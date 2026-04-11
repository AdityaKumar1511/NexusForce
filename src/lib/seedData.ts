import { doc, setDoc, collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

// Helper to create dates relative to now
const hoursAgo = (h: number) => new Date(Date.now() - h * 60 * 60 * 1000);
const hoursFromNow = (h: number) => new Date(Date.now() + h * 60 * 60 * 1000);
const daysFromNow = (d: number) => new Date(Date.now() + d * 24 * 60 * 60 * 1000);
const daysAgo = (d: number) => new Date(Date.now() - d * 24 * 60 * 60 * 1000);
const toTs = (d: Date) => Timestamp.fromDate(d);

export async function seedFirestore() {
  console.log('🌱 Seeding Firestore...');

  // ─── DEALS ──────────────────────────────────────────
  const deals = [
    {
      buyer: '0x3F4a8b2C1D9e7F6A5B3c2D1E0F9A8B7C6D5E4F3a',
      seller: '0x7E2c9D3B1A4F8C6E5D0B7A9F2C1E8D3B4A5F6C7D',
      value: 2400,
      token: 'USDC',
      status: 'in_dispute',
      description: 'Full-stack DeFi dashboard with analytics panel and wallet integration',
      milestones: [
        { title: 'UI Design & Wireframes', percentage: 30, status: 'completed', deadline: toTs(daysAgo(10)) },
        { title: 'Frontend Development', percentage: 40, status: 'active', deadline: toTs(daysFromNow(3)) },
        { title: 'Backend & Smart Contracts', percentage: 30, status: 'pending', deadline: toTs(daysFromNow(10)) },
      ],
      deadline: toTs(daysFromNow(10)),
      createdAt: toTs(daysAgo(14)),
    },
    {
      buyer: '0x1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B',
      seller: '0x3F4a8b2C1D9e7F6A5B3c2D1E0F9A8B7C6D5E4F3a',
      value: 890,
      token: 'USDC',
      status: 'completed',
      description: 'Smart contract audit for NFT marketplace',
      milestones: [
        { title: 'Initial Audit Report', percentage: 50, status: 'completed', deadline: toTs(daysAgo(5)) },
        { title: 'Final Review & Sign-off', percentage: 50, status: 'completed', deadline: toTs(daysAgo(2)) },
      ],
      deadline: toTs(daysAgo(2)),
      createdAt: toTs(daysAgo(20)),
    },
    {
      buyer: '0x3F4a8b2C1D9e7F6A5B3c2D1E0F9A8B7C6D5E4F3a',
      seller: '0x9B8A7C6D5E4F3A2B1C0D9E8F7A6B5C4D3E2F1A0B',
      value: 5500,
      token: 'USDC',
      status: 'active',
      description: 'Custom ERC-721 collection with generative art engine',
      milestones: [
        { title: 'Art Generation Script', percentage: 25, status: 'completed', deadline: toTs(daysAgo(3)) },
        { title: 'Smart Contract Development', percentage: 35, status: 'active', deadline: toTs(daysFromNow(5)) },
        { title: 'Frontend Minting Page', percentage: 25, status: 'pending', deadline: toTs(daysFromNow(12)) },
        { title: 'Testing & Deployment', percentage: 15, status: 'pending', deadline: toTs(daysFromNow(15)) },
      ],
      deadline: toTs(daysFromNow(15)),
      createdAt: toTs(daysAgo(7)),
    },
    {
      buyer: '0xABCD1234EFGH5678IJKL9012MNOP3456QRST7890',
      seller: '0x3F4a8b2C1D9e7F6A5B3c2D1E0F9A8B7C6D5E4F3a',
      value: 1200,
      token: 'USDC',
      status: 'pending_signature',
      description: 'DAO governance token design and tokenomics whitepaper',
      milestones: [
        { title: 'Tokenomics Model', percentage: 40, status: 'pending', deadline: toTs(daysFromNow(7)) },
        { title: 'Whitepaper Draft', percentage: 30, status: 'pending', deadline: toTs(daysFromNow(14)) },
        { title: 'Final Deliverable', percentage: 30, status: 'pending', deadline: toTs(daysFromNow(21)) },
      ],
      deadline: toTs(daysFromNow(21)),
      createdAt: toTs(hoursAgo(3)),
    },
  ];

  const dealIds = ['#4821', '#4820', '#4819', '#4817'];
  for (let i = 0; i < deals.length; i++) {
    await setDoc(doc(db, 'deals', dealIds[i]), deals[i]);
    console.log(`  ✓ Deal ${dealIds[i]}`);
  }

  // ─── DISPUTES ───────────────────────────────────────
  const disputes = [
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
        { name: 'wireframe_comparison.pdf', size: '2.4 MB', type: 'application/pdf', cid: 'QmX7b3yZ9rK2mN4pQ8wF5vH6jT1sA0cE3dG8iL2oU9kR', uploadedBy: 'buyer', uploadedAt: toTs(hoursAgo(18)) },
        { name: 'mobile_screenshots.zip', size: '8.1 MB', type: 'application/zip', cid: 'QmY4c8aR3sL7nO5qW9xG6uI1kV2bD0fH4jM8pS3tE7wN', uploadedBy: 'buyer', uploadedAt: toTs(hoursAgo(18)) },
        { name: 'chat_logs_milestone2.pdf', size: '1.2 MB', type: 'application/pdf', cid: 'QmZ1d9bS4tM8oP6rX0yH7vJ2lW3cE1gI5kN9qT4uF8xO', uploadedBy: 'buyer', uploadedAt: toTs(hoursAgo(17)) },
        { name: 'delivery_proof.mp4', size: '24.5 MB', type: 'video/mp4', cid: 'QmA2e0cT5uN9pQ7sY1zI8wK3mX4dF2hJ6lO0rU5vG9yP', uploadedBy: 'seller', uploadedAt: toTs(hoursAgo(12)) },
        { name: 'updated_codebase.zip', size: '15.3 MB', type: 'application/zip', cid: 'QmB3f1dU6vO0qR8tZ2aJ9xL4nY5eG3iK7mP1sV6wH0zA', uploadedBy: 'seller', uploadedAt: toTs(hoursAgo(12)) },
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
      votingDeadline: toTs(hoursFromNow(31.38)),
      createdAt: toTs(hoursAgo(16.62)),
      timeline: [
        { timestamp: toTs(daysAgo(14)), label: 'Deal #4821 Created', status: 'completed' },
        { timestamp: toTs(daysAgo(10)), label: 'Milestone 1 Confirmed', status: 'completed' },
        { timestamp: toTs(hoursAgo(18)), label: 'Dispute Raised by Buyer', status: 'completed' },
        { timestamp: toTs(hoursAgo(17)), label: 'Evidence Submitted (Buyer)', status: 'completed' },
        { timestamp: toTs(hoursAgo(12)), label: 'Evidence Submitted (Seller)', status: 'completed' },
        { timestamp: toTs(hoursAgo(10)), label: '7 Jurors Selected via Chainlink VRF', status: 'completed' },
        { timestamp: toTs(hoursFromNow(31.38)), label: 'Voting Deadline', status: 'active' },
        { timestamp: toTs(hoursFromNow(32)), label: 'Verdict Execution', status: 'pending' },
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
        { name: 'communication_log.pdf', size: '0.8 MB', type: 'application/pdf', cid: 'QmC4g2eV7wP1rS9uA3bK0yM5oZ6fH4jL8nQ2tW7xI1aB', uploadedBy: 'buyer', uploadedAt: toTs(daysAgo(5)) },
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
      votingDeadline: toTs(daysAgo(3)),
      createdAt: toTs(daysAgo(5)),
      timeline: [
        { timestamp: toTs(daysAgo(25)), label: 'Deal #4815 Created', status: 'completed' },
        { timestamp: toTs(daysAgo(5)), label: 'Dispute Raised by Buyer', status: 'completed' },
        { timestamp: toTs(daysAgo(5)), label: 'Evidence Submitted', status: 'completed' },
        { timestamp: toTs(daysAgo(5)), label: 'Jurors Selected', status: 'completed' },
        { timestamp: toTs(daysAgo(3)), label: 'Voting Completed', status: 'completed' },
        { timestamp: toTs(daysAgo(3)), label: 'Verdict: Buyer Wins — Full Refund', status: 'completed' },
      ],
    },
  ];

  for (const dispute of disputes) {
    await setDoc(doc(db, 'disputes', dispute.id), dispute);
    console.log(`  ✓ Dispute ${dispute.id}`);
  }

  // ─── PROPOSALS ──────────────────────────────────────
  const proposals = [
    {
      title: 'Increase minimum juror stake from 100 NXF to 200 NXF',
      description: 'This proposal aims to raise the minimum staking threshold for juror eligibility from 100 NXF to 200 NXF.',
      votesFor: 68, votesForNXF: 2400000, votesAgainst: 32, votesAgainstNXF: 1100000,
      deadline: toTs(daysFromNow(3.58)), status: 'active', createdAt: toTs(daysAgo(4)),
    },
    {
      title: 'Reduce protocol fee from 1.5% to 1.0% for deals under $500',
      description: 'Small deal makers are disproportionately affected by the flat 1.5% fee. This proposal introduces a tiered fee structure.',
      votesFor: 74, votesForNXF: 3100000, votesAgainst: 26, votesAgainstNXF: 980000,
      deadline: toTs(daysFromNow(1.25)), status: 'active', createdAt: toTs(daysAgo(6)),
    },
    {
      title: 'Add WETH as a supported escrow token',
      description: 'Expand the escrow contract to accept Wrapped ETH (WETH) as a valid payment token alongside USDC, USDT, and MATIC.',
      votesFor: 91, votesForNXF: 4200000, votesAgainst: 9, votesAgainstNXF: 380000,
      deadline: toTs(daysAgo(1)), status: 'passed', createdAt: toTs(daysAgo(8)),
    },
    {
      title: 'Implement super-jury appeal for disputes above $10,000',
      description: 'For high-value disputes exceeding $10,000 USDC, allow an appeal to a super-jury of 25 high-reputation jurors.',
      votesFor: 82, votesForNXF: 3600000, votesAgainst: 18, votesAgainstNXF: 720000,
      deadline: toTs(daysAgo(3)), status: 'passed', createdAt: toTs(daysAgo(10)),
    },
  ];

  const proposalIds = ['NXF-012', 'NXF-011', 'NXF-010', 'NXF-009'];
  for (let i = 0; i < proposals.length; i++) {
    await setDoc(doc(db, 'proposals', proposalIds[i]), proposals[i]);
    console.log(`  ✓ Proposal ${proposalIds[i]}`);
  }

  // ─── ACTIVITY FEED ──────────────────────────────────
  const activities = [
    { timestamp: toTs(hoursAgo(0.05)), type: 'deal', message: 'DEAL #4821 · Milestone 2 confirmed by buyer', dealId: '#4821' },
    { timestamp: toTs(hoursAgo(0.1)), type: 'payment', message: 'DEAL #4818 · $890 USDC auto-released to seller', dealId: '#4818' },
    { timestamp: toTs(hoursAgo(0.15)), type: 'dispute', message: 'DISPUTE #1203 · Evidence CID QmX7b...f3a uploaded', disputeId: '#1203' },
    { timestamp: toTs(hoursAgo(0.5)), type: 'juror', message: 'JUROR assigned to DISPUTE #1199', disputeId: '#1199' },
    { timestamp: toTs(hoursAgo(1)), type: 'deal', message: 'DEAL #4819 · Milestone 1 completed — Art Generation Script delivered', dealId: '#4819' },
    { timestamp: toTs(hoursAgo(1.5)), type: 'payment', message: 'DEAL #4816 · $3,200 USDC escrowed by buyer', dealId: '#4816' },
    { timestamp: toTs(hoursAgo(2)), type: 'dispute', message: 'DISPUTE #1203 · Juror #5 cast vote (anonymous)', disputeId: '#1203' },
    { timestamp: toTs(hoursAgo(3)), type: 'deal', message: 'DEAL #4817 · New deal created — awaiting seller signature', dealId: '#4817' },
    { timestamp: toTs(hoursAgo(4)), type: 'juror', message: 'JUROR reputation updated: +12 points for majority vote' },
    { timestamp: toTs(hoursAgo(6)), type: 'dispute', message: 'DISPUTE #1199 · RESOLVED — Buyer wins, $800 USDC refunded', disputeId: '#1199' },
    { timestamp: toTs(hoursAgo(8)), type: 'payment', message: 'DEAL #4814 · Milestone 3 payment released — $1,500 USDC', dealId: '#4814' },
    { timestamp: toTs(hoursAgo(12)), type: 'deal', message: 'DEAL #4813 · All milestones confirmed — deal complete', dealId: '#4813' },
  ];

  for (const activity of activities) {
    await addDoc(collection(db, 'activity'), activity);
  }
  console.log(`  ✓ ${activities.length} activity events`);

  // ─── GLOBAL STATS ───────────────────────────────────
  await setDoc(doc(db, 'config', 'globalStats'), {
    totalEscrowed: 4200000,
    dealsCompleted: 12847,
    autoResolutionRate: 99.2,
    avgReleaseTime: '<2 MIN',
  });
  console.log('  ✓ Global stats');

  // ─── JUROR STATS ────────────────────────────────────
  await setDoc(doc(db, 'jurorStats', 'default'), {
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
  });
  console.log('  ✓ Juror stats');

  console.log('🎉 Seeding complete!');
}
