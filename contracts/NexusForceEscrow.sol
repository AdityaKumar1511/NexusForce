// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title NexusForce Escrow Protocol v2
 * @notice Trustless escrow with Dual-Verification milestones and Auto-Escalation alerts.
 */
contract NexusForceEscrow {

    enum DealStatus { Active, Completed, InDispute, Resolved }
    enum MilestoneStatus { Pending, UnderReview, Completed, Rejected }
    enum Vote { None, BuyerWins, SellerWins, Split }

    struct Milestone {
        string title;
        uint256 percentage;
        MilestoneStatus status;
        uint256 submittedAt;
        string proof;
    }

    struct Deal {
        address buyer;
        address seller;
        uint256 value;
        uint256 remainingValue;
        DealStatus status;
        string dealId;
        uint256 createdAt;
        uint256 milestoneCount;
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
    // dealId hash => milestoneIndex => Milestone
    mapping(bytes32 => mapping(uint256 => Milestone)) public milestones;
    // dealId hash => Dispute
    mapping(bytes32 => Dispute) public disputes;
    // dealId hash => juror address => has voted
    mapping(bytes32 => mapping(address => bool)) public jurorVoted;

    uint256 public constant REVIEW_WINDOW = 72 hours;

    // ─── Events ────────────────────────────────────────────────
    event DealCreated(bytes32 indexed dealHash, string dealId, address indexed buyer, address indexed seller, uint256 value);
    event MilestoneSubmitted(bytes32 indexed dealHash, uint256 milestoneIndex, string proof);
    event MilestoneApproved(bytes32 indexed dealHash, uint256 milestoneIndex, uint256 amountReleased);
    event MilestoneRejected(bytes32 indexed dealHash, uint256 milestoneIndex, string reason);
    event AutoApprovalTriggered(bytes32 indexed dealHash, uint256 milestoneIndex);
    event DealCompleted(bytes32 indexed dealHash, string dealId, address indexed seller, uint256 value);
    event DisputeRaised(bytes32 indexed dealHash, string dealId, address indexed raisedBy, string reason);
    event VoteSubmitted(bytes32 indexed dealHash, string dealId, address indexed juror, Vote vote);
    event DisputeResolved(bytes32 indexed dealHash, string dealId, Vote outcome);

    modifier onlyBuyer(bytes32 h) {
        require(msg.sender == deals[h].buyer, "Only buyer");
        _;
    }

    modifier onlySeller(bytes32 h) {
        require(msg.sender == deals[h].seller, "Only seller");
        _;
    }

    modifier dealExists(string memory _dealId) {
        bytes32 h = keccak256(abi.encodePacked(_dealId));
        require(deals[h].value > 0, "Deal missing");
        _;
    }

    // ─── Core Functions ────────────────────────────────────────

    function createDeal(
        address _seller, 
        string calldata _dealId, 
        string[] calldata _mTitles, 
        uint256[] calldata _mPercentages
    ) external payable {
        require(msg.value > 0, "No funds");
        require(_mTitles.length == _mPercentages.length, "Mismatched milestones");
        
        bytes32 h = keccak256(abi.encodePacked(_dealId));
        require(deals[h].value == 0, "Exists");

        deals[h] = Deal({
            buyer: msg.sender,
            seller: _seller,
            value: msg.value,
            remainingValue: msg.value,
            status: DealStatus.Active,
            dealId: _dealId,
            createdAt: block.timestamp,
            milestoneCount: _mTitles.length
        });

        uint256 totalPct = 0;
        for (uint256 i = 0; i < _mTitles.length; i++) {
            milestones[h][i] = Milestone({
                title: _mTitles[i],
                percentage: _mPercentages[i],
                status: MilestoneStatus.Pending,
                submittedAt: 0,
                proof: ""
            });
            totalPct += _mPercentages[i];
        }
        require(totalPct == 100, "Pct != 100");

        emit DealCreated(h, _dealId, msg.sender, _seller, msg.value);
    }

    function submitMilestone(string calldata _dealId, uint256 _index, string calldata _proof) external {
        bytes32 h = keccak256(abi.encodePacked(_dealId));
        require(msg.sender == deals[h].seller, "Only seller");
        require(milestones[h][_index].status == MilestoneStatus.Pending || milestones[h][_index].status == MilestoneStatus.Rejected, "Invalid state");

        milestones[h][_index].status = MilestoneStatus.UnderReview;
        milestones[h][_index].submittedAt = block.timestamp;
        milestones[h][_index].proof = _proof;

        emit MilestoneSubmitted(h, _index, _proof);
    }

    function approveMilestone(string calldata _dealId, uint256 _index) external {
        bytes32 h = keccak256(abi.encodePacked(_dealId));
        require(msg.sender == deals[h].buyer, "Only buyer");
        _completeMilestone(h, _index);
    }

    function triggerAutoApproval(string calldata _dealId, uint256 _index) external {
        bytes32 h = keccak256(abi.encodePacked(_dealId));
        Milestone storage m = milestones[h][_index];
        require(m.status == MilestoneStatus.UnderReview, "Not in review");
        require(block.timestamp >= m.submittedAt + REVIEW_WINDOW, "Review window active");

        emit AutoApprovalTriggered(h, _index);
        _completeMilestone(h, _index);
    }

    function rejectMilestone(string calldata _dealId, uint256 _index, string calldata _reason) external {
        bytes32 h = keccak256(abi.encodePacked(_dealId));
        require(msg.sender == deals[h].buyer, "Only buyer");
        require(milestones[h][_index].status == MilestoneStatus.UnderReview, "Not in review");

        milestones[h][_index].status = MilestoneStatus.Rejected;
        emit MilestoneRejected(h, _index, _reason);
    }

    function _completeMilestone(bytes32 h, uint256 _index) internal {
        Milestone storage m = milestones[h][_index];
        require(m.status == MilestoneStatus.UnderReview, "Not in review");

        m.status = MilestoneStatus.Completed;
        uint256 amount = (deals[h].value * m.percentage) / 100;
        deals[h].remainingValue -= amount;

        (bool sent, ) = deals[h].seller.call{value: amount}("");
        require(sent, "Pay failed");

        emit MilestoneApproved(h, _index, amount);

        if (deals[h].remainingValue == 0) {
            deals[h].status = DealStatus.Completed;
            emit DealCompleted(h, deals[h].dealId, deals[h].seller, deals[h].value);
        }
    }

    function raiseDispute(string calldata _dealId, string calldata _reason) external dealExists(_dealId) {
        bytes32 h = keccak256(abi.encodePacked(_dealId));
        Deal storage d = deals[h];
        require(msg.sender == d.buyer || msg.sender == d.seller, "Parties only");
        require(d.status == DealStatus.Active, "Not active");

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

    function submitVote(string calldata _dealId, uint8 _vote) external dealExists(_dealId) {
        bytes32 h = keccak256(abi.encodePacked(_dealId));
        Dispute storage dis = disputes[h];
        require(deals[h].status == DealStatus.InDispute, "Not disputed");
        require(!dis.resolved && !jurorVoted[h][msg.sender], "Bad state");
        require(_vote >= 1 && _vote <= 3, "1-3");

        jurorVoted[h][msg.sender] = true;
        dis.totalVotes++;
        if (_vote == 1) dis.buyerVotes++;
        else if (_vote == 2) dis.sellerVotes++;
        else dis.splitVotes++;

        emit VoteSubmitted(h, _dealId, msg.sender, Vote(_vote));
        if (dis.totalVotes >= 7) _resolveDispute(h, _dealId);
    }

    function _resolveDispute(bytes32 h, string memory _dealId) internal {
        Deal storage d = deals[h];
        Dispute storage dis = disputes[h];
        dis.resolved = true;
        d.status = DealStatus.Resolved;

        uint256 bal = d.remainingValue;
        if (dis.buyerVotes > dis.sellerVotes && dis.buyerVotes > dis.splitVotes) {
            payable(d.buyer).transfer(bal);
        } else if (dis.sellerVotes > dis.buyerVotes && dis.sellerVotes > dis.splitVotes) {
            payable(d.seller).transfer(bal);
        } else {
            uint256 half = bal / 2;
            payable(d.buyer).transfer(half);
            payable(d.seller).transfer(bal - half);
        }
        emit DisputeResolved(h, _dealId, Vote(1)); // Simplified outcome event
    }
}

