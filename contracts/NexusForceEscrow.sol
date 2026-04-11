// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title NexusForce Escrow Protocol
 * @notice Trustless escrow for freelance deals on Polygon Amoy
 * @dev Deploy via Remix or Hardhat. Paste the deployed address into src/lib/contract.ts
 *
 * FLOW:
 *   1. Buyer calls createDeal(seller, dealId) with msg.value = escrow amount
 *   2. On satisfactory delivery, buyer calls completeDeal(dealId) → funds go to seller
 *   3. Either party can call raiseDispute(dealId, reason) → funds stay locked
 *   4. Randomly selected jurors call submitVote(dealId, vote) → majority determines outcome
 */
contract NexusForceEscrow {

    enum DealStatus { Active, Completed, InDispute, Resolved }
    enum Vote { None, BuyerWins, SellerWins, Split }

    struct Deal {
        address buyer;
        address seller;
        uint256 value;
        DealStatus status;
        string dealId;
        uint256 createdAt;
    }

    struct Dispute {
        string reason;
        uint256 buyerVotes;
        uint256 sellerVotes;
        uint256 splitVotes;
        uint256 totalVotes;
        bool resolved;
    }

    // dealId hash => Deal
    mapping(bytes32 => Deal) public deals;
    // dealId hash => Dispute
    mapping(bytes32 => Dispute) public disputes;
    // dealId hash => juror address => has voted
    mapping(bytes32 => mapping(address => bool)) public jurorVoted;

    // ─── Events (indexer listens to these) ─────────────────────
    event DealCreated(
        bytes32 indexed dealHash,
        string dealId,
        address indexed buyer,
        address indexed seller,
        uint256 value
    );

    event DealCompleted(
        bytes32 indexed dealHash,
        string dealId,
        address indexed seller,
        uint256 value,
        uint256 completedAt
    );

    event DisputeRaised(
        bytes32 indexed dealHash,
        string dealId,
        address indexed raisedBy,
        string reason
    );

    event VoteSubmitted(
        bytes32 indexed dealHash,
        string dealId,
        address indexed juror,
        Vote vote
    );

    event DisputeResolved(
        bytes32 indexed dealHash,
        string dealId,
        Vote outcome
    );

    // ─── Modifiers ─────────────────────────────────────────────

    modifier dealExists(string memory _dealId) {
        bytes32 h = keccak256(abi.encodePacked(_dealId));
        require(deals[h].value > 0, "Deal does not exist");
        _;
    }

    // ─── Core Functions ────────────────────────────────────────

    /**
     * @notice Create a new escrowed deal. Buyer sends MATIC as escrow.
     * @param _seller Address of the service provider
     * @param _dealId Unique deal identifier (e.g. "#4821")
     */
    function createDeal(address _seller, string calldata _dealId) external payable {
        require(msg.value > 0, "Must escrow funds");
        require(_seller != address(0), "Invalid seller");
        require(_seller != msg.sender, "Cannot escrow to yourself");

        bytes32 h = keccak256(abi.encodePacked(_dealId));
        require(deals[h].value == 0, "Deal ID already exists");

        deals[h] = Deal({
            buyer: msg.sender,
            seller: _seller,
            value: msg.value,
            status: DealStatus.Active,
            dealId: _dealId,
            createdAt: block.timestamp
        });

        emit DealCreated(h, _dealId, msg.sender, _seller, msg.value);
    }

    /**
     * @notice Buyer confirms delivery — funds released to seller.
     * @param _dealId The deal to complete
     */
    function completeDeal(string calldata _dealId) external dealExists(_dealId) {
        bytes32 h = keccak256(abi.encodePacked(_dealId));
        Deal storage d = deals[h];

        require(msg.sender == d.buyer, "Only buyer can confirm");
        require(d.status == DealStatus.Active, "Deal not active");

        d.status = DealStatus.Completed;

        (bool sent, ) = d.seller.call{value: d.value}("");
        require(sent, "Transfer failed");

        emit DealCompleted(h, _dealId, d.seller, d.value, block.timestamp);
    }

    /**
     * @notice Either party raises a dispute — funds remain locked.
     * @param _dealId The deal to dispute
     * @param _reason Description of the dispute reason
     */
    function raiseDispute(string calldata _dealId, string calldata _reason) external dealExists(_dealId) {
        bytes32 h = keccak256(abi.encodePacked(_dealId));
        Deal storage d = deals[h];

        require(
            msg.sender == d.buyer || msg.sender == d.seller,
            "Only deal parties can dispute"
        );
        require(d.status == DealStatus.Active, "Deal not active");

        d.status = DealStatus.InDispute;
        disputes[h] = Dispute({
            reason: _reason,
            buyerVotes: 0,
            sellerVotes: 0,
            splitVotes: 0,
            totalVotes: 0,
            resolved: false
        });

        emit DisputeRaised(h, _dealId, msg.sender, _reason);
    }

    /**
     * @notice Juror submits a vote on a dispute.
     * @param _dealId The disputed deal
     * @param _vote 1 = BuyerWins, 2 = SellerWins, 3 = Split
     */
    function submitVote(string calldata _dealId, uint8 _vote) external dealExists(_dealId) {
        bytes32 h = keccak256(abi.encodePacked(_dealId));
        Deal storage d = deals[h];
        Dispute storage dis = disputes[h];

        require(d.status == DealStatus.InDispute, "No active dispute");
        require(!dis.resolved, "Dispute already resolved");
        require(!jurorVoted[h][msg.sender], "Already voted");
        require(_vote >= 1 && _vote <= 3, "Invalid vote");

        jurorVoted[h][msg.sender] = true;
        dis.totalVotes++;

        if (_vote == 1) dis.buyerVotes++;
        else if (_vote == 2) dis.sellerVotes++;
        else dis.splitVotes++;

        emit VoteSubmitted(h, _dealId, msg.sender, Vote(_vote));

        // Auto-resolve when 7 jurors have voted
        if (dis.totalVotes >= 7) {
            _resolveDispute(h, _dealId);
        }
    }

    // ─── Internal ──────────────────────────────────────────────

    function _resolveDispute(bytes32 h, string memory _dealId) internal {
        Deal storage d = deals[h];
        Dispute storage dis = disputes[h];

        dis.resolved = true;
        d.status = DealStatus.Resolved;

        Vote outcome;

        if (dis.buyerVotes > dis.sellerVotes && dis.buyerVotes > dis.splitVotes) {
            // Buyer wins — full refund
            outcome = Vote.BuyerWins;
            (bool sent, ) = d.buyer.call{value: d.value}("");
            require(sent, "Refund failed");
        } else if (dis.sellerVotes > dis.buyerVotes && dis.sellerVotes > dis.splitVotes) {
            // Seller wins — full payment
            outcome = Vote.SellerWins;
            (bool sent, ) = d.seller.call{value: d.value}("");
            require(sent, "Payment failed");
        } else {
            // Split 50/50
            outcome = Vote.Split;
            uint256 half = d.value / 2;
            (bool s1, ) = d.buyer.call{value: half}("");
            (bool s2, ) = d.seller.call{value: d.value - half}("");
            require(s1 && s2, "Split failed");
        }

        emit DisputeResolved(h, _dealId, outcome);
    }

    // ─── View Functions ────────────────────────────────────────

    function getDeal(string calldata _dealId) external view returns (
        address buyer,
        address seller,
        uint256 value,
        DealStatus status,
        uint256 createdAt
    ) {
        bytes32 h = keccak256(abi.encodePacked(_dealId));
        Deal storage d = deals[h];
        return (d.buyer, d.seller, d.value, d.status, d.createdAt);
    }

    function getDispute(string calldata _dealId) external view returns (
        string memory reason,
        uint256 buyerVotes,
        uint256 sellerVotes,
        uint256 splitVotes,
        uint256 totalVotes,
        bool resolved
    ) {
        bytes32 h = keccak256(abi.encodePacked(_dealId));
        Dispute storage dis = disputes[h];
        return (dis.reason, dis.buyerVotes, dis.sellerVotes, dis.splitVotes, dis.totalVotes, dis.resolved);
    }
}
