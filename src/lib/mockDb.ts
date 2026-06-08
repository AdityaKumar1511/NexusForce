import type { Deal, Dispute, ActivityEvent, JurorStats, GlobalStats, DealMessage, Proposal, Notification } from './types';

// ─── Pub/Sub System ──────────────────────────────────────────────────────────
type Listener = () => void;
const listeners = new Set<Listener>();

function notifyListeners() {
  listeners.forEach(l => l());
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const KEY_PREFIX = 'nf_mock_';

function getStorageItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  const val = localStorage.getItem(KEY_PREFIX + key);
  if (!val) return defaultValue;
  try {
    return JSON.parse(val, (k, v) => {
      // Parse ISO dates back to Date objects
      if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(v)) {
        return new Date(v);
      }
      return v;
    });
  } catch {
    return defaultValue;
  }
}

function setStorageItem<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY_PREFIX + key, JSON.stringify(value));
  notifyListeners();
}

// ─── Seed Data Constants ─────────────────────────────────────────────────────
const hoursAgo = (h: number) => new Date(Date.now() - h * 60 * 60 * 1000);
const hoursFromNow = (h: number) => new Date(Date.now() + h * 60 * 60 * 1000);
const daysFromNow = (d: number) => new Date(Date.now() + d * 24 * 60 * 60 * 1000);
const daysAgo = (d: number) => new Date(Date.now() - d * 24 * 60 * 60 * 1000);

const SEED_DEALS: Deal[] = [
  {
    id: '#4821',
    buyer: '0x3F4a8b2C1D9e7F6A5B3c2D1E0F9A8B7C6D5E4F3a',
    seller: '0x7E2c9D3B1A4F8C6E5D0B7A9F2C1E8D3B4A5F6C7D',
    value: 2400,
    token: 'USDC',
    status: 'in_dispute',
    description: 'Full-stack DeFi dashboard with analytics panel and wallet integration',
    milestones: [
      { title: 'UI Design & Wireframes', percentage: 30, status: 'completed', deadline: daysAgo(10) },
      { title: 'Frontend Development', percentage: 40, status: 'active', deadline: daysFromNow(3) },
      { title: 'Backend & Smart Contracts', percentage: 30, status: 'pending', deadline: daysFromNow(10) },
    ],
    deadline: daysFromNow(10),
    createdAt: daysAgo(14),
  },
  {
    id: '#4820',
    buyer: '0x1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B',
    seller: '0x3F4a8b2C1D9e7F6A5B3c2D1E0F9A8B7C6D5E4F3a',
    value: 890,
    token: 'USDC',
    status: 'completed',
    description: 'Smart contract audit for NFT marketplace',
    milestones: [
      { title: 'Initial Audit Report', percentage: 50, status: 'completed', deadline: daysAgo(5) },
      { title: 'Final Review & Sign-off', percentage: 50, status: 'completed', deadline: daysAgo(2) },
    ],
    deadline: daysAgo(2),
    createdAt: daysAgo(20),
  },
  {
    id: '#4819',
    buyer: '0x3F4a8b2C1D9e7F6A5B3c2D1E0F9A8B7C6D5E4F3a',
    seller: '0x9B8A7C6D5E4F3A2B1C0D9E8F7A6B5C4D3E2F1A0B',
    value: 5500,
    token: 'USDC',
    status: 'active',
    description: 'Custom ERC-721 collection with generative art engine',
    milestones: [
      { title: 'Art Generation Script', percentage: 25, status: 'completed', deadline: daysAgo(3) },
      { title: 'Smart Contract Development', percentage: 35, status: 'active', deadline: daysFromNow(5) },
      { title: 'Frontend Minting Page', percentage: 25, status: 'pending', deadline: daysFromNow(12) },
      { title: 'Testing & Deployment', percentage: 15, status: 'pending', deadline: daysFromNow(15) },
    ],
    deadline: daysFromNow(15),
    createdAt: daysAgo(7),
  },
  {
    id: '#4817',
    buyer: '0xABCD1234EFGH5678IJKL9012MNOP3456QRST7890',
    seller: '0x3F4a8b2C1D9e7F6A5B3c2D1E0F9A8B7C6D5E4F3a',
    value: 1200,
    token: 'USDC',
    status: 'pending_signatures',
    description: 'DAO governance token design and tokenomics whitepaper',
    milestones: [
      { title: 'Tokenomics Model', percentage: 40, status: 'pending', deadline: daysFromNow(7) },
      { title: 'Whitepaper Draft', percentage: 30, status: 'pending', deadline: daysFromNow(14) },
      { title: 'Final Deliverable', percentage: 30, status: 'pending', deadline: daysFromNow(21) },
    ],
    deadline: daysFromNow(21),
    createdAt: hoursAgo(3),
  },
];

const SEED_DISPUTES: Dispute[] = [
  {
    id: '#1203',
    dealId: '#4821',
    dealValue: 2400,
    reason: ['QUALITY BELOW SPEC', 'MISSED DEADLINE'],
    description: 'The frontend deliverable does not match the wireframes approved in Milestone 1. Multiple UI components are unresponsive on mobile, and the analytics panel lacks the real-time charting feature specified in the deal terms.',
    buyer: '0x3F4a8b2C1D9e7F6A5B3c2D1E0F9A8B7C6D5E4F3a',
    seller: '0x7E2c9D3B1A4F8C6E5D0B7A9F2C1E8D3B4A5F6C7D',
    status: 'voting',
    raisedBy: 'buyer',
    evidence: [
      { name: 'wireframe_comparison.pdf', size: '2.4 MB', type: 'application/pdf', cid: 'QmX7b3yZ9rK2mN4pQ8wF5vH6jT1sA0cE3dG8iL2oU9kR', uploadedBy: 'buyer', uploadedAt: hoursAgo(18) },
      { name: 'mobile_screenshots.zip', size: '8.1 MB', type: 'application/zip', cid: 'QmY4c8aR3sL7nO5qW9xG6uI1kV2bD0fH4jM8pS3tE7wN', uploadedBy: 'buyer', uploadedAt: hoursAgo(18) },
      { name: 'chat_logs_milestone2.pdf', size: '1.2 MB', type: 'application/pdf', cid: 'QmZ1d9bS4tM8oP6rX0yH7vJ2lW3cE1gI5kN9qT4uF8xO', uploadedBy: 'buyer', uploadedAt: hoursAgo(17) },
      { name: 'delivery_proof.mp4', size: '24.5 MB', type: 'video/mp4', cid: 'QmA2e0cT5uN9pQ7sY1zI8wK3mX4dF2hJ6lO0rU5vG9yP', uploadedBy: 'seller', uploadedAt: hoursAgo(12) },
      { name: 'updated_codebase.zip', size: '15.3 MB', type: 'application/zip', cid: 'QmB3f1dU6vO0qR8tZ2aJ9xL4nY5eG3iK7mP1sV6wH0zA', uploadedBy: 'seller', uploadedAt: hoursAgo(12) },
    ],
    jurors: [
      { id: 1, address: '0xJUR1...A2c3', reputation: 892, hasVoted: true, vote: 'buyer_wins', staked: 150 },
      { id: 2, address: '0xJUR2...B4d5', reputation: 731, hasVoted: true, vote: 'buyer_wins', staked: 200 },
      { id: 3, address: '0xJUR3...C6e7', reputation: 884, hasVoted: false, staked: 175 },
      { id: 4, address: '0xJUR4...D8f9', reputation: 756, hasVoted: true, vote: 'seller_wins', staked: 125 },
      { id: 5, address: '0xJUR5...E0g1', reputation: 945, hasVoted: true, vote: 'buyer_wins', staked: 300 },
      { id: 6, address: '0xJUR6...F2h3', reputation: 812, hasVoted: true, vote: 'buyer_wins', staked: 180 },
      { id: 7, address: '0xJUR7...G4i5', reputation: 667, hasVoted: false, staked: 100 },
    ],
    votingDeadline: hoursFromNow(31.38),
    createdAt: hoursAgo(16.62),
    timeline: [
      { timestamp: daysAgo(14), label: 'Deal #4821 Created', status: 'completed' },
      { timestamp: daysAgo(10), label: 'Milestone 1 Confirmed', status: 'completed' },
      { timestamp: hoursAgo(18), label: 'Dispute Raised by Buyer', status: 'completed' },
      { timestamp: hoursAgo(17), label: 'Evidence Submitted (Buyer)', status: 'completed' },
      { timestamp: hoursAgo(12), label: 'Evidence Submitted (Seller)', status: 'completed' },
      { timestamp: hoursAgo(10), label: '7 Jurors Selected via Chainlink VRF', status: 'completed' },
      { timestamp: hoursFromNow(31.38), label: 'Voting Deadline', status: 'active' },
      { timestamp: hoursFromNow(32), label: 'Verdict Execution', status: 'pending' },
    ],
  },
  {
    id: '#1199',
    dealId: '#4815',
    dealValue: 800,
    reason: ['WORK NOT DELIVERED'],
    description: 'Seller accepted the deal 3 weeks ago but has not delivered any work or communicated since accepting.',
    buyer: '0xDEAD1234BEEF5678CAFE9012FACE3456BABE7890',
    seller: '0x3F4a8b2C1D9e7F6A5B3c2D1E0F9A8B7C6D5E4F3a',
    status: 'resolved',
    raisedBy: 'buyer',
    verdict: 'buyer_wins',
    evidence: [
      { name: 'communication_log.pdf', size: '0.8 MB', type: 'application/pdf', cid: 'QmC4g2eV7wP1rS9uA3bK0yM5oZ6fH4jL8nQ2tW7xI1aB', uploadedBy: 'buyer', uploadedAt: daysAgo(5) },
    ],
    jurors: [
      { id: 1, address: '0xJUR8...H6j7', reputation: 920, hasVoted: true, vote: 'buyer_wins', staked: 250 },
      { id: 2, address: '0xJUR9...I8k9', reputation: 855, hasVoted: true, vote: 'buyer_wins', staked: 200 },
      { id: 3, address: '0xJUR0...J0l1', reputation: 790, hasVoted: true, vote: 'buyer_wins', staked: 150 },
      { id: 4, address: '0xJURA...K2m3', reputation: 682, hasVoted: true, vote: 'buyer_wins', staked: 100 },
      { id: 5, address: '0xJURB...L4n5', reputation: 875, hasVoted: true, vote: 'buyer_wins', staked: 200 },
      { id: 6, address: '0xJURC...M6o7', reputation: 710, hasVoted: true, vote: 'buyer_wins', staked: 125 },
      { id: 7, address: '0xJURD...N8p9', reputation: 640, hasVoted: true, vote: 'seller_wins', staked: 100 },
    ],
    votingDeadline: daysAgo(3),
    createdAt: daysAgo(5),
    timeline: [
      { timestamp: daysAgo(25), label: 'Deal #4815 Created', status: 'completed' },
      { timestamp: daysAgo(5), label: 'Dispute Raised by Buyer', status: 'completed' },
      { timestamp: daysAgo(5), label: 'Evidence Submitted', status: 'completed' },
      { timestamp: daysAgo(5), label: 'Jurors Selected', status: 'completed' },
      { timestamp: daysAgo(3), label: 'Voting Completed', status: 'completed' },
      { timestamp: daysAgo(3), label: 'Verdict: Buyer Wins — Full Refund', status: 'completed' },
    ],
  },
];

const SEED_PROPOSALS: Proposal[] = [
  {
    id: 'NXF-012',
    title: 'Increase minimum juror stake from 100 NXF to 200 NXF',
    description: 'This proposal aims to raise the minimum staking threshold for juror eligibility from 100 NXF to 200 NXF.',
    votesFor: 68, votesForNXF: 2400000, votesAgainst: 32, votesAgainstNXF: 1100000,
    deadline: daysFromNow(3.58), status: 'active', createdAt: daysAgo(4),
  },
  {
    id: 'NXF-011',
    title: 'Reduce protocol fee from 1.5% to 1.0% for deals under $500',
    description: 'Small deal makers are disproportionately affected by the flat 1.5% fee. This proposal introduces a tiered fee structure.',
    votesFor: 74, votesForNXF: 3100000, votesAgainst: 26, votesAgainstNXF: 980000,
    deadline: daysFromNow(1.25), status: 'active', createdAt: daysAgo(6),
  },
  {
    id: 'NXF-010',
    title: 'Add WETH as a supported escrow token',
    description: 'Expand the escrow contract to accept Wrapped ETH (WETH) as a valid payment token alongside USDC, USDT, and MATIC.',
    votesFor: 91, votesForNXF: 4200000, votesAgainst: 9, votesAgainstNXF: 380000,
    deadline: daysAgo(1), status: 'passed', createdAt: daysAgo(8),
  },
  {
    id: 'NXF-009',
    title: 'Implement super-jury appeal for disputes above $10,000',
    description: 'For high-value disputes exceeding $10,000 USDC, allow an appeal to a super-jury of 25 high-reputation jurors.',
    votesFor: 82, votesForNXF: 3600000, votesAgainst: 18, votesAgainstNXF: 720000,
    deadline: daysAgo(3), status: 'passed', createdAt: daysAgo(10),
  },
];

const SEED_ACTIVITIES: ActivityEvent[] = [
  { timestamp: hoursAgo(0.05), type: 'deal', message: 'DEAL #4821 · Milestone 2 confirmed by buyer', dealId: '#4821' },
  { timestamp: hoursAgo(0.1), type: 'payment', message: 'DEAL #4818 · $890 USDC auto-released to seller', dealId: '#4818' },
  { timestamp: hoursAgo(0.15), type: 'dispute', message: 'DISPUTE #1203 · Evidence CID QmX7b...f3a uploaded', disputeId: '#1203' },
  { timestamp: hoursAgo(0.5), type: 'juror', message: 'JUROR assigned to DISPUTE #1199', disputeId: '#1199' },
  { timestamp: hoursAgo(1), type: 'deal', message: 'DEAL #4819 · Milestone 1 completed — Art Generation Script delivered', dealId: '#4819' },
  { timestamp: hoursAgo(1.5), type: 'payment', message: 'DEAL #4816 · $3,200 USDC escrowed by buyer', dealId: '#4816' },
  { timestamp: hoursAgo(2), type: 'dispute', message: 'DISPUTE #1203 · Juror #5 cast vote (anonymous)', disputeId: '#1203' },
  { timestamp: hoursAgo(3), type: 'deal', message: 'DEAL #4817 · New deal created — awaiting seller signature', dealId: '#4817' },
  { timestamp: hoursAgo(4), type: 'juror', message: 'JUROR reputation updated: +12 points for majority vote' },
  { timestamp: hoursAgo(6), type: 'dispute', message: 'DISPUTE #1199 · RESOLVED — Buyer wins, $800 USDC refunded', disputeId: '#1199' },
  { timestamp: hoursAgo(8), type: 'payment', message: 'DEAL #4814 · Milestone 3 payment released — $1,500 USDC', dealId: '#4814' },
  { timestamp: hoursAgo(12), type: 'deal', message: 'DEAL #4813 · All milestones confirmed — deal complete', dealId: '#4813' },
];

const SEED_GLOBAL_STATS: GlobalStats = {
  totalEscrowed: 4200000,
  dealsCompleted: 12847,
  autoResolutionRate: 99.2,
  avgReleaseTime: '<2 MIN',
};

const SEED_JUROR_STATS: JurorStats = {
  casesHandled: 24,
  majorityVotes: 21,
  accuracyRate: 87.5,
  totalEarned: 124.5,
  reputationScore: 847,
  maxReputation: 1000,
  percentile: 12,
  nxfStaked: 500,
  nxfBalance: 847.5,
  reputationHistory: [720, 735, 742, 760, 775, 790, 780, 795, 810, 822, 835, 840, 847],
};

// ─── INITIALIZATION ──────────────────────────────────────────────────────────
export function initMockDb() {
  if (typeof window === 'undefined') return;
  if (!localStorage.getItem(KEY_PREFIX + 'deals')) {
    setStorageItem('deals', SEED_DEALS);
    setStorageItem('disputes', SEED_DISPUTES);
    setStorageItem('proposals', SEED_PROPOSALS);
    setStorageItem('activity', SEED_ACTIVITIES);
    setStorageItem('globalStats', SEED_GLOBAL_STATS);
    setStorageItem('jurorStats_default', SEED_JUROR_STATS);
    setStorageItem('dealMessages', []);
    setStorageItem('notifications', []);
  }
}

// Ensure database is initialized at runtime
if (typeof window !== 'undefined') {
  initMockDb();
}

// ─── API IMPLEMENTATION ──────────────────────────────────────────────────────

// DEALS
export function getDeals(): Deal[] {
  return getStorageItem<Deal[]>('deals', []);
}

export function getDealById(dealId: string): Deal | null {
  const deals = getDeals();
  return deals.find(d => d.id === dealId) || null;
}

export async function createDeal(deal: Omit<Deal, 'id'> & { id?: string }): Promise<string> {
  const deals = getDeals();
  const dealId = deal.id || `#${Math.floor(4800 + Math.random() * 200)}`;
  const newDeal: Deal = {
    ...deal,
    id: dealId,
  };
  deals.push(newDeal);
  setStorageItem('deals', deals);

  await addActivityEvent({
    type: 'deal',
    message: `DEAL ${dealId} · New deal created — $${deal.value.toLocaleString()} ${deal.token} escrowed`,
    dealId,
    timestamp: new Date(),
  });

  await updateGlobalStats({ totalEscrowed: deal.value, dealsCreated: 1 });

  await createNotification({
    recipient: deal.seller,
    type: 'deal',
    title: 'New Deal Proposal',
    message: `You have a new deal proposal for $${deal.value.toLocaleString()} ${deal.token}.`,
    link: `/dashboard?deal=${dealId}`,
  });

  return dealId;
}

export async function updateDealStatus(dealId: string, status: Deal['status']): Promise<void> {
  const deals = getDeals();
  const index = deals.findIndex(d => d.id === dealId);
  if (index !== -1) {
    deals[index].status = status;
    setStorageItem('deals', deals);

    await addActivityEvent({
      type: 'deal',
      message: `DEAL ${dealId} · Status changed to ${status.toUpperCase().replace('_', ' ')}`,
      dealId,
      timestamp: new Date(),
    });
  }
}

export async function completeDeal(dealId: string): Promise<void> {
  const deals = getDeals();
  const index = deals.findIndex(d => d.id === dealId);
  if (index !== -1) {
    const txHash = `0x${Math.random().toString(16).slice(2, 18)}${Math.random().toString(16).slice(2, 18)}`;
    deals[index].status = 'completed';
    deals[index].txHash = txHash;
    setStorageItem('deals', deals);

    await addActivityEvent({
      type: 'payment',
      message: `DEAL ${dealId} · ✓ COMPLETED — Funds released from escrow`,
      dealId,
      timestamp: new Date(),
    });
  }
}

export async function saveDealSignature(dealId: string, role: 'buyer' | 'seller', signature: string): Promise<void> {
  const deals = getDeals();
  const index = deals.findIndex(d => d.id === dealId);
  if (index === -1) return;

  const deal = deals[index];
  if (role === 'buyer') deal.buyerSignature = signature;
  if (role === 'seller') deal.sellerSignature = signature;
  
  deal.status = 'confirmed';
  setStorageItem('deals', deals);

  await addActivityEvent({
    type: 'deal',
    message: `DEAL ${dealId} · ${role.toUpperCase()} signed off-chain data. Status changed to CONFIRMED`,
    dealId,
    timestamp: new Date(),
  });

  const recipient = role === 'buyer' ? deal.seller : deal.buyer;
  await createNotification({
    recipient,
    type: 'deal',
    title: 'Deal Signed',
    message: `The ${role} has signed the deal ${dealId}.`,
    link: `/dashboard?deal=${dealId}`,
  });
}

// MILESTONES
export async function submitMilestone(dealId: string, index: number, proof: string): Promise<void> {
  const deals = getDeals();
  const dealIdx = deals.findIndex(d => d.id === dealId);
  if (dealIdx === -1) return;

  const deal = deals[dealIdx];
  if (deal.milestones[index]) {
    deal.milestones[index].status = 'under_review';
    deal.milestones[index].submittedAt = new Date();
    deal.milestones[index].submissionProof = proof;
    setStorageItem('deals', deals);

    await addActivityEvent({
      type: 'deal',
      message: `DEAL ${dealId} · Milestone #${index + 1} submitted for review`,
      dealId,
      timestamp: new Date(),
    });

    await createNotification({
      recipient: deal.buyer,
      type: 'milestone',
      title: 'Milestone Submitted',
      message: `Seller submitted work for Milestone #${index + 1} of Deal ${dealId}.`,
      link: `/dashboard?deal=${dealId}`,
    });
  }
}

export async function approveMilestone(dealId: string, index: number): Promise<void> {
  const deals = getDeals();
  const dealIdx = deals.findIndex(d => d.id === dealId);
  if (dealIdx === -1) return;

  const deal = deals[dealIdx];
  if (deal.milestones[index]) {
    deal.milestones[index].status = 'completed';
    
    const allDone = deal.milestones.every(m => m.status === 'completed');
    if (allDone) {
      deal.status = 'completed';
    }
    setStorageItem('deals', deals);

    await addActivityEvent({
      type: 'deal',
      message: `DEAL ${dealId} · Milestone #${index + 1} approved by buyer`,
      dealId,
      timestamp: new Date(),
    });

    await createNotification({
      recipient: deal.seller,
      type: 'milestone',
      title: 'Milestone Approved',
      message: `Buyer approved Milestone #${index + 1} of Deal ${dealId}. Funds released.`,
      link: `/dashboard?deal=${dealId}`,
    });
  }
}

export async function rejectMilestone(dealId: string, index: number, reason: string): Promise<void> {
  const deals = getDeals();
  const dealIdx = deals.findIndex(d => d.id === dealId);
  if (dealIdx === -1) return;

  const deal = deals[dealIdx];
  if (deal.milestones[index]) {
    deal.milestones[index].status = 'rejected';
    deal.milestones[index].rejectionReason = reason;
    setStorageItem('deals', deals);

    await addActivityEvent({
      type: 'deal',
      message: `DEAL ${dealId} · Milestone #${index + 1} revision requested`,
      dealId,
      timestamp: new Date(),
    });

    await createNotification({
      recipient: deal.seller,
      type: 'milestone',
      title: 'Revision Requested',
      message: `Buyer requested revisions for Milestone #${index + 1} of Deal ${dealId}. Reason: ${reason}`,
      link: `/dashboard?deal=${dealId}`,
    });
  }
}

// DISPUTES
export function getDisputes(): Dispute[] {
  return getStorageItem<Dispute[]>('disputes', []);
}

export function getDisputeById(disputeId: string): Dispute | null {
  const disputes = getDisputes();
  return disputes.find(d => d.id === disputeId) || null;
}

export async function createDispute(dispute: Omit<Dispute, 'id'>): Promise<string> {
  const disputes = getDisputes();
  const disputeId = `#${Math.floor(1200 + Math.random() * 100)}`;
  const newDispute: Dispute = {
    ...dispute,
    id: disputeId,
  };
  disputes.push(newDispute);
  setStorageItem('disputes', disputes);

  if (dispute.dealId) {
    await updateDealStatus(dispute.dealId, 'in_dispute');
  }

  await addActivityEvent({
    type: 'dispute',
    message: `DISPUTE ${disputeId} · Filed against DEAL ${dispute.dealId} — $${dispute.dealValue.toLocaleString()} USDC`,
    disputeId,
    dealId: dispute.dealId,
    timestamp: new Date(),
  });

  const parties = [dispute.buyer, dispute.seller];
  for (const recipient of parties) {
    await createNotification({
      recipient,
      type: 'dispute',
      title: 'Dispute Raised',
      message: `A dispute has been raised for Deal ${dispute.dealId}. Action required.`,
      link: `/governance`,
    });
  }

  if (dispute.jurors) {
    for (const juror of dispute.jurors) {
      await createNotification({
        recipient: juror.address,
        type: 'juror',
        title: 'Selected as Juror',
        message: `You have been selected to adjudicate Dispute ${disputeId}.`,
        link: `/governance`,
      });
    }
  }

  return disputeId;
}

export async function submitJurorVote(
  disputeId: string,
  jurorIndex: number,
  vote: 'buyer_wins' | 'seller_wins' | 'split'
): Promise<void> {
  const disputes = getDisputes();
  const idx = disputes.findIndex(d => d.id === disputeId);
  if (idx === -1) return;

  const dispute = disputes[idx];
  if (dispute.jurors[jurorIndex]) {
    dispute.jurors[jurorIndex].hasVoted = true;
    dispute.jurors[jurorIndex].vote = vote;
    setStorageItem('disputes', disputes);

    await addActivityEvent({
      type: 'juror',
      message: `DISPUTE ${disputeId} · Juror #${jurorIndex + 1} cast vote (anonymous)`,
      disputeId,
      timestamp: new Date(),
    });
  }
}

export async function uploadEvidenceFile(
  disputeId: string,
  file: { name: string; size: string; type: string; cid: string; uploadedBy: 'buyer' | 'seller' }
): Promise<void> {
  const disputes = getDisputes();
  const idx = disputes.findIndex(d => d.id === disputeId);
  if (idx === -1) return;

  const dispute = disputes[idx];
  dispute.evidence.push({
    ...file,
    uploadedAt: new Date(),
  });
  setStorageItem('disputes', disputes);

  await addActivityEvent({
    type: 'dispute',
    message: `DISPUTE ${disputeId} · New evidence uploaded: ${file.name}`,
    disputeId,
    timestamp: new Date(),
  });
}

// PROPOSALS
export function getProposals(): Proposal[] {
  return getStorageItem<Proposal[]>('proposals', []);
}

export async function voteOnProposal(proposalId: string, vote: 'for' | 'against', nxfAmount: number = 50000): Promise<void> {
  const proposals = getProposals();
  const idx = proposals.findIndex(p => p.id === proposalId);
  if (idx === -1) return;

  const prop = proposals[idx];
  if (vote === 'for') {
    prop.votesFor += 1;
    prop.votesForNXF += nxfAmount;
  } else {
    prop.votesAgainst += 1;
    prop.votesAgainstNXF += nxfAmount;
  }
  setStorageItem('proposals', proposals);
}

// ACTIVITY FEED
export function getActivityFeed(limitCount: number = 20): ActivityEvent[] {
  const activity = getStorageItem<ActivityEvent[]>('activity', []);
  return activity.slice(0, limitCount);
}

export async function addActivityEvent(event: ActivityEvent): Promise<void> {
  const activity = getStorageItem<ActivityEvent[]>('activity', []);
  activity.unshift(event);
  setStorageItem('activity', activity);
}

// GLOBAL STATS
export function getGlobalStats(): GlobalStats {
  return getStorageItem<GlobalStats>('globalStats', SEED_GLOBAL_STATS);
}

export async function updateGlobalStats(updates: { totalEscrowed?: number; dealsCreated?: number }): Promise<void> {
  const stats = getGlobalStats();
  if (updates.totalEscrowed) stats.totalEscrowed += updates.totalEscrowed;
  if (updates.dealsCreated) stats.dealsCompleted += updates.dealsCreated;
  setStorageItem('globalStats', stats);
}

// JUROR STATS
export function getJurorStats(walletAddress?: string): JurorStats {
  const id = walletAddress || 'default';
  return getStorageItem<JurorStats>(`jurorStats_${id}`, SEED_JUROR_STATS);
}

export async function updateJurorStats(updates: Partial<JurorStats>, walletAddress?: string): Promise<void> {
  const id = walletAddress || 'default';
  const current = getJurorStats(walletAddress);
  const updated = {
    ...current,
    ...updates,
  };
  setStorageItem(`jurorStats_${id}`, updated);
}

// CHAT LAYER
export function getDealMessages(dealId: string): DealMessage[] {
  const all = getStorageItem<DealMessage[]>('dealMessages', []);
  return all.filter(m => m.dealId === dealId);
}

export async function sendDealMessage(dealId: string, sender: string, text: string): Promise<string> {
  const messages = getStorageItem<DealMessage[]>('dealMessages', []);
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const newMsg: DealMessage = {
    id: messageId,
    dealId,
    sender,
    text,
    timestamp: new Date(),
  };
  messages.push(newMsg);
  setStorageItem('dealMessages', messages);
  return messageId;
}

// NOTIFICATIONS
export function getNotifications(recipient: string): Notification[] {
  const all = getStorageItem<Notification[]>('notifications', []);
  return all.filter(n => n.recipient === recipient).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

export async function createNotification(notification: Omit<Notification, 'id' | 'isRead' | 'timestamp'>): Promise<string> {
  const notifications = getStorageItem<Notification[]>('notifications', []);
  const id = `note_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const newNote: Notification = {
    ...notification,
    id,
    isRead: false,
    timestamp: new Date(),
  };
  notifications.push(newNote);
  setStorageItem('notifications', notifications);
  return id;
}

export async function markAsRead(notificationId: string): Promise<void> {
  const notifications = getStorageItem<Notification[]>('notifications', []);
  const idx = notifications.findIndex(n => n.id === notificationId);
  if (idx !== -1) {
    notifications[idx].isRead = true;
    setStorageItem('notifications', notifications);
  }
}

export async function markAllAsRead(recipient: string, list: Notification[]): Promise<void> {
  const notifications = getStorageItem<Notification[]>('notifications', []);
  const unreadIds = new Set(list.filter(n => !n.isRead && n.recipient === recipient).map(n => n.id));
  notifications.forEach(n => {
    if (unreadIds.has(n.id)) {
      n.isRead = true;
    }
  });
  setStorageItem('notifications', notifications);
}
