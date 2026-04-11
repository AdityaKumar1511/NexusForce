/**
 * NexusForce Escrow Contract — ABI & Address
 *
 * IMPORTANT: After deploying NexusForceEscrow.sol to Polygon Amoy,
 * replace NEXUS_ESCROW_ADDRESS below with your deployed contract address.
 */

// ─── Deployed Contract Address (Polygon Amoy Testnet) ────────
// TODO: Replace with your deployed contract address after deploying NexusForceEscrow.sol
export const NEXUS_ESCROW_ADDRESS = '0x5B38Da6a701c568545dCfcB03FcB875f56beddC4' as `0x${string}`;

// ─── Contract ABI ────────────────────────────────────────────
export const NEXUS_ESCROW_ABI = [
  // ── createDeal ──
  {
    name: 'createDeal',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: '_seller', type: 'address' },
      { name: '_dealId', type: 'string' },
    ],
    outputs: [],
  },
  // ── completeDeal ──
  {
    name: 'completeDeal',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_dealId', type: 'string' },
    ],
    outputs: [],
  },
  // ── raiseDispute ──
  {
    name: 'raiseDispute',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_dealId', type: 'string' },
      { name: '_reason', type: 'string' },
    ],
    outputs: [],
  },
  // ── submitVote ──
  {
    name: 'submitVote',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_dealId', type: 'string' },
      { name: '_vote', type: 'uint8' },
    ],
    outputs: [],
  },
  // ── getDeal (view) ──
  {
    name: 'getDeal',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: '_dealId', type: 'string' },
    ],
    outputs: [
      { name: 'buyer', type: 'address' },
      { name: 'seller', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'status', type: 'uint8' },
      { name: 'createdAt', type: 'uint256' },
    ],
  },
  // ── getDispute (view) ──
  {
    name: 'getDispute',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: '_dealId', type: 'string' },
    ],
    outputs: [
      { name: 'reason', type: 'string' },
      { name: 'buyerVotes', type: 'uint256' },
      { name: 'sellerVotes', type: 'uint256' },
      { name: 'splitVotes', type: 'uint256' },
      { name: 'totalVotes', type: 'uint256' },
      { name: 'resolved', type: 'bool' },
    ],
  },
  // ── Events ──
  {
    name: 'DealCreated',
    type: 'event',
    inputs: [
      { name: 'dealHash', type: 'bytes32', indexed: true },
      { name: 'dealId', type: 'string', indexed: false },
      { name: 'buyer', type: 'address', indexed: true },
      { name: 'seller', type: 'address', indexed: true },
      { name: 'value', type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'DealCompleted',
    type: 'event',
    inputs: [
      { name: 'dealHash', type: 'bytes32', indexed: true },
      { name: 'dealId', type: 'string', indexed: false },
      { name: 'seller', type: 'address', indexed: true },
      { name: 'value', type: 'uint256', indexed: false },
      { name: 'completedAt', type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'DisputeRaised',
    type: 'event',
    inputs: [
      { name: 'dealHash', type: 'bytes32', indexed: true },
      { name: 'dealId', type: 'string', indexed: false },
      { name: 'raisedBy', type: 'address', indexed: true },
      { name: 'reason', type: 'string', indexed: false },
    ],
  },
  {
    name: 'VoteSubmitted',
    type: 'event',
    inputs: [
      { name: 'dealHash', type: 'bytes32', indexed: true },
      { name: 'dealId', type: 'string', indexed: false },
      { name: 'juror', type: 'address', indexed: true },
      { name: 'vote', type: 'uint8', indexed: false },
    ],
  },
  {
    name: 'DisputeResolved',
    type: 'event',
    inputs: [
      { name: 'dealHash', type: 'bytes32', indexed: true },
      { name: 'dealId', type: 'string', indexed: false },
      { name: 'outcome', type: 'uint8', indexed: false },
    ],
  },
] as const;
