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
      { name: '_mTitles', type: 'string[]' },
      { name: '_mPercentages', type: 'uint256[]' },
    ],
    outputs: [],
  },
  // ── submitMilestone ──
  {
    name: 'submitMilestone',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_dealId', type: 'string' },
      { name: '_index', type: 'uint256' },
      { name: '_proof', type: 'string' },
    ],
    outputs: [],
  },
  // ── approveMilestone ──
  {
    name: 'approveMilestone',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_dealId', type: 'string' },
      { name: '_index', type: 'uint256' },
    ],
    outputs: [],
  },
  // ── triggerAutoApproval ──
  {
    name: 'triggerAutoApproval',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_dealId', type: 'string' },
      { name: '_index', type: 'uint256' },
    ],
    outputs: [],
  },
  // ── rejectMilestone ──
  {
    name: 'rejectMilestone',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_dealId', type: 'string' },
      { name: '_index', type: 'uint256' },
      { name: '_reason', type: 'string' },
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
    name: 'MilestoneSubmitted',
    type: 'event',
    inputs: [
      { name: 'dealHash', type: 'bytes32', indexed: true },
      { name: 'milestoneIndex', type: 'uint256', indexed: false },
      { name: 'proof', type: 'string', indexed: false },
    ],
  },
  {
    name: 'MilestoneApproved',
    type: 'event',
    inputs: [
      { name: 'dealHash', type: 'bytes32', indexed: true },
      { name: 'milestoneIndex', type: 'uint256', indexed: false },
      { name: 'amountReleased', type: 'uint256', indexed: false },
    ],
  },
] as const;
