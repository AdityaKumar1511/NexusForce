import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  Timestamp,
  increment,
} from 'firebase/firestore';
import { db, isMock } from './firebase';
import * as mockDb from './mockDb';
import type {
  Deal,
  Milestone,
  Dispute,
  Proposal,
  ActivityEvent,
  JurorStats,
  GlobalStats,
  GraphNode,
  GraphLink,
  DealMessage,
} from './types';
import { createNotification } from './notificationService';

// ─── Collection References ───────────────────────────────────────
const dealsCol = db ? collection(db, 'deals') : null;
const disputesCol = db ? collection(db, 'disputes') : null;
const proposalsCol = db ? collection(db, 'proposals') : null;
const activityCol = db ? collection(db, 'activity') : null;
const dealMessagesCol = db ? collection(db, 'dealMessages') : null;

// ─── Helpers: Firestore ↔ App date conversion ───────────────────
function toDate(val: unknown): Date {
  if (val instanceof Timestamp) return val.toDate();
  if (val instanceof Date) return val;
  if (typeof val === 'string' || typeof val === 'number') return new Date(val);
  return new Date();
}

function serializeDates(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value instanceof Date) {
      result[key] = Timestamp.fromDate(value);
    } else if (Array.isArray(value)) {
      result[key] = value.map(item =>
        typeof item === 'object' && item !== null ? serializeDates(item as Record<string, unknown>) : item
      );
    } else if (typeof value === 'object' && value !== null && !(value instanceof Timestamp)) {
      result[key] = serializeDates(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result;
}

function parseDeal(id: string, data: Record<string, unknown>): Deal {
  return {
    id,
    buyer: data.buyer as string,
    seller: data.seller as string,
    value: data.value as number,
    token: (data.token as string) || 'USDC',
    status: data.status as Deal['status'],
    description: (data.description as string) || '',
    deadline: toDate(data.deadline),
    createdAt: toDate(data.createdAt),
    txHash: data.txHash as string | undefined,
    buyerSignature: data.buyerSignature as string | undefined,
    sellerSignature: data.sellerSignature as string | undefined,
    milestones: ((data.milestones as Record<string, unknown>[]) || []).map(m => ({
      title: m.title as string,
      percentage: m.percentage as number,
      status: m.status as Milestone['status'],
      deadline: toDate(m.deadline),
      submittedAt: m.submittedAt ? toDate(m.submittedAt) : undefined,
      submissionProof: m.submissionProof as string | undefined,
      rejectionReason: m.rejectionReason as string | undefined,
    })),
  };
}

function parseDispute(id: string, data: Record<string, unknown>): Dispute {
  return {
    id,
    dealId: data.dealId as string,
    dealValue: data.dealValue as number,
    reason: data.reason as string[],
    description: data.description as string,
    buyer: data.buyer as string,
    seller: data.seller as string,
    status: data.status as Dispute['status'],
    raisedBy: data.raisedBy as 'buyer' | 'seller',
    evidence: ((data.evidence as Record<string, unknown>[]) || []).map(e => ({
      name: e.name as string,
      size: e.size as string,
      type: e.type as string,
      cid: e.cid as string,
      uploadedBy: e.uploadedBy as 'buyer' | 'seller',
      uploadedAt: toDate(e.uploadedAt),
      previewUrl: e.previewUrl as string | undefined,
    })),
    jurors: ((data.jurors as Record<string, unknown>[]) || []).map(j => ({
      id: j.id as number,
      address: j.address as string,
      reputation: j.reputation as number,
      hasVoted: j.hasVoted as boolean,
      vote: j.vote as 'buyer_wins' | 'seller_wins' | 'split' | undefined,
      staked: j.staked as number,
    })),
    votingDeadline: toDate(data.votingDeadline),
    createdAt: toDate(data.createdAt),
    verdict: data.verdict as Dispute['verdict'],
    timeline: ((data.timeline as Record<string, unknown>[]) || []).map(t => ({
      timestamp: toDate(t.timestamp),
      label: t.label as string,
      status: t.status as 'completed' | 'active' | 'pending',
    })),
  };
}

function parseProposal(id: string, data: Record<string, unknown>): Proposal {
  return {
    id,
    title: data.title as string,
    description: data.description as string,
    votesFor: data.votesFor as number,
    votesForNXF: data.votesForNXF as number,
    votesAgainst: data.votesAgainst as number,
    votesAgainstNXF: data.votesAgainstNXF as number,
    deadline: toDate(data.deadline),
    status: data.status as Proposal['status'],
    createdAt: toDate(data.createdAt),
  };
}

function parseActivity(data: Record<string, unknown>): ActivityEvent {
  return {
    timestamp: toDate(data.timestamp),
    type: data.type as ActivityEvent['type'],
    message: data.message as string,
    dealId: data.dealId as string | undefined,
    disputeId: data.disputeId as string | undefined,
  };
}

function parseDealMessage(id: string, data: Record<string, unknown>): DealMessage {
  return {
    id,
    dealId: data.dealId as string,
    sender: data.sender as string,
    text: data.text as string,
    timestamp: toDate(data.timestamp),
  };
}

// ─── DEALS ───────────────────────────────────────────────────────

export async function getDeals(): Promise<Deal[]> {
  if (isMock) return mockDb.getDeals();
  if (!dealsCol) return [];
  const snap = await getDocs(dealsCol);
  return snap.docs.map(d => parseDeal(d.id, d.data() as Record<string, unknown>));
}

export async function getDealById(dealId: string): Promise<Deal | null> {
  if (isMock) return mockDb.getDealById(dealId);
  if (!db) return null;
  const ref = doc(db, 'deals', dealId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return parseDeal(snap.id, snap.data() as Record<string, unknown>);
}

export async function createDeal(deal: Omit<Deal, 'id'> & { id?: string }): Promise<string> {
  if (isMock) return mockDb.createDeal(deal);
  if (!db) return '';
  const dealId = deal.id || `#${Math.floor(4800 + Math.random() * 200)}`;
  const dealData = { ...deal };
  delete dealData.id;
  const ref = doc(db, 'deals', dealId);
  await setDoc(ref, serializeDates(dealData as unknown as Record<string, unknown>));

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
  if (isMock) return mockDb.updateDealStatus(dealId, status);
  if (!db) return;
  const ref = doc(db, 'deals', dealId);
  await updateDoc(ref, { status });

  await addActivityEvent({
    type: 'deal',
    message: `DEAL ${dealId} · Status changed to ${status.toUpperCase().replace('_', ' ')}`,
    dealId,
    timestamp: new Date(),
  });
}

export async function completeDeal(dealId: string): Promise<void> {
  if (isMock) return mockDb.completeDeal(dealId);
  if (!db) return;
  const ref = doc(db, 'deals', dealId);
  const txHash = `0x${Math.random().toString(16).slice(2, 18)}${Math.random().toString(16).slice(2, 18)}`;
  await updateDoc(ref, { status: 'completed', txHash });

  await addActivityEvent({
    type: 'payment',
    message: `DEAL ${dealId} · ✓ COMPLETED — Funds released from escrow`,
    dealId,
    timestamp: new Date(),
  });
}

export function subscribeToDeals(callback: (deals: Deal[]) => void): () => void {
  if (isMock) {
    callback(mockDb.getDeals());
    return mockDb.subscribe(() => callback(mockDb.getDeals()));
  }
  if (!dealsCol) return () => {};
  return onSnapshot(dealsCol, {
    next: snap => {
      const deals = snap.docs.map(d => parseDeal(d.id, d.data() as Record<string, unknown>));
      callback(deals);
    },
    error: err => {
      console.warn('Firestore deals subscription error:', err);
    }
  });
}

export async function saveDealSignature(dealId: string, role: 'buyer' | 'seller', signature: string): Promise<void> {
  if (isMock) return mockDb.saveDealSignature(dealId, role, signature);
  if (!db) return;
  const ref = doc(db, 'deals', dealId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const currentDeal = snap.data();

  const updates: Record<string, unknown> = {};
  if (role === 'buyer') updates.buyerSignature = signature;
  if (role === 'seller') updates.sellerSignature = signature;

  // Only mark confirmed once BOTH parties have signed
  const hasBuyerSig = role === 'buyer' ? true : !!currentDeal.buyerSignature;
  const hasSellerSig = role === 'seller' ? true : !!currentDeal.sellerSignature;
  updates.status = hasBuyerSig && hasSellerSig ? 'confirmed' : 'pending_signatures';

  await updateDoc(ref, updates);

  await addActivityEvent({
    type: 'deal',
    message: `DEAL ${dealId} · ${role.toUpperCase()} signed off-chain data. ${hasBuyerSig && hasSellerSig ? 'Status changed to CONFIRMED' : 'Awaiting counterparty'}`,
    dealId,
    timestamp: new Date(),
  });

  const recipient = role === 'buyer' ? currentDeal.seller : currentDeal.buyer;
  await createNotification({
    recipient,
    type: 'deal',
    title: 'Deal Signed',
    message: `The ${role} has signed the deal ${dealId}.`,
    link: `/dashboard?deal=${dealId}`,
  });
}

// ─── MILESTONES ──────────────────────────────────────────────────

export async function submitMilestone(dealId: string, index: number, proof: string): Promise<void> {
  if (isMock) return mockDb.submitMilestone(dealId, index, proof);
  if (!db) return;
  const ref = doc(db, 'deals', dealId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const deal = snap.data() as Deal;

  const milestones = [...deal.milestones];
  if (milestones[index]) {
    milestones[index].status = 'under_review';
    (milestones[index] as any).submittedAt = Timestamp.fromDate(new Date());
    (milestones[index] as any).submissionProof = proof;
  }

  await updateDoc(ref, { milestones });

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

export async function approveMilestone(dealId: string, index: number): Promise<void> {
  if (isMock) return mockDb.approveMilestone(dealId, index);
  if (!db) return;
  const ref = doc(db, 'deals', dealId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const deal = snap.data() as Deal;

  const milestones = [...deal.milestones];
  if (milestones[index]) {
    milestones[index].status = 'completed';
  }

  const allDone = milestones.every(m => m.status === 'completed');
  const updates: any = { milestones };
  if (allDone) updates.status = 'completed';

  await updateDoc(ref, updates);

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

export async function rejectMilestone(dealId: string, index: number, reason: string): Promise<void> {
  if (isMock) return mockDb.rejectMilestone(dealId, index, reason);
  if (!db) return;
  const ref = doc(db, 'deals', dealId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const deal = snap.data() as Deal;

  const milestones = [...deal.milestones];
  if (milestones[index]) {
    milestones[index].status = 'rejected';
    (milestones[index] as any).rejectionReason = reason;
  }

  await updateDoc(ref, { milestones });

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

// ─── DISPUTES ────────────────────────────────────────────────────

export async function getDisputes(): Promise<Dispute[]> {
  if (isMock) return mockDb.getDisputes();
  if (!disputesCol) return [];
  const snap = await getDocs(disputesCol);
  return snap.docs.map(d => parseDispute(d.id, d.data() as Record<string, unknown>));
}

export async function getDisputeById(disputeId: string): Promise<Dispute | null> {
  if (isMock) return mockDb.getDisputeById(disputeId);
  if (!db) return null;
  // Direct doc lookup — no need to fetch the entire collection
  const ref = doc(db, 'disputes', disputeId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return parseDispute(snap.id, snap.data() as Record<string, unknown>);
}

export async function createDispute(dispute: Omit<Dispute, 'id'>): Promise<string> {
  if (isMock) return mockDb.createDispute(dispute);
  if (!db) return '';
  const disputeId = `#${Math.floor(1200 + Math.random() * 100)}`;
  const ref = doc(db, 'disputes', disputeId);
  await setDoc(ref, {
    ...serializeDates(dispute as unknown as Record<string, unknown>),
    id: disputeId,
  });

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
  if (isMock) return mockDb.submitJurorVote(disputeId, jurorIndex, vote);
  if (!db) return;
  const dispute = await getDisputeById(disputeId);
  if (!dispute) return;

  const updatedJurors = [...dispute.jurors];
  if (updatedJurors[jurorIndex]) {
    updatedJurors[jurorIndex] = { ...updatedJurors[jurorIndex], hasVoted: true, vote };
  }

  const ref = doc(db, 'disputes', disputeId);
  await updateDoc(ref, { jurors: updatedJurors.map(j => serializeDates(j as unknown as Record<string, unknown>)) });

  await addActivityEvent({
    type: 'juror',
    message: `DISPUTE ${disputeId} · Juror #${jurorIndex + 1} cast vote (anonymous)`,
    disputeId,
    timestamp: new Date(),
  });
}

export async function uploadEvidenceFile(
  disputeId: string,
  file: { name: string; size: string; type: string; cid: string; uploadedBy: 'buyer' | 'seller' }
): Promise<void> {
  if (isMock) return mockDb.uploadEvidenceFile(disputeId, file);
  if (!db) return;
  const dispute = await getDisputeById(disputeId);
  if (!dispute) return;

  const newEvidence = [
    ...dispute.evidence,
    { ...file, uploadedAt: new Date() },
  ];

  const ref = doc(db, 'disputes', disputeId);
  await updateDoc(ref, {
    evidence: newEvidence.map(e => serializeDates(e as unknown as Record<string, unknown>)),
  });

  await addActivityEvent({
    type: 'dispute',
    message: `DISPUTE ${disputeId} · New evidence uploaded: ${file.name}`,
    disputeId,
    timestamp: new Date(),
  });
}

export function subscribeToDisputes(callback: (disputes: Dispute[]) => void): () => void {
  if (isMock) {
    callback(mockDb.getDisputes());
    return mockDb.subscribe(() => callback(mockDb.getDisputes()));
  }
  if (!disputesCol) return () => {};
  return onSnapshot(disputesCol, {
    next: snap => {
      const disputes = snap.docs.map(d => parseDispute(d.id, d.data() as Record<string, unknown>));
      callback(disputes);
    },
    error: err => {
      console.warn('Firestore disputes subscription error:', err);
    }
  });
}

// ─── PROPOSALS ───────────────────────────────────────────────────

export async function getProposals(): Promise<Proposal[]> {
  if (isMock) return mockDb.getProposals();
  if (!proposalsCol) return [];
  const snap = await getDocs(proposalsCol);
  return snap.docs.map(d => parseProposal(d.id, d.data() as Record<string, unknown>));
}

export async function voteOnProposal(proposalId: string, vote: 'for' | 'against', nxfAmount: number = 50000): Promise<void> {
  if (isMock) return mockDb.voteOnProposal(proposalId, vote, nxfAmount);
  if (!db) return;
  const ref = doc(db, 'proposals', proposalId);
  if (vote === 'for') {
    await updateDoc(ref, {
      votesFor: increment(1),
      votesForNXF: increment(nxfAmount),
    });
  } else {
    await updateDoc(ref, {
      votesAgainst: increment(1),
      votesAgainstNXF: increment(nxfAmount),
    });
  }
}

export function subscribeToProposals(callback: (proposals: Proposal[]) => void): () => void {
  if (isMock) {
    callback(mockDb.getProposals());
    return mockDb.subscribe(() => callback(mockDb.getProposals()));
  }
  if (!proposalsCol) return () => {};
  return onSnapshot(proposalsCol, {
    next: snap => {
      const proposals = snap.docs.map(d => parseProposal(d.id, d.data() as Record<string, unknown>));
      callback(proposals);
    },
    error: err => {
      console.warn('Firestore proposals subscription error:', err);
    }
  });
}

// ─── ACTIVITY FEED ───────────────────────────────────────────────

export async function getActivityFeed(limitCount: number = 20): Promise<ActivityEvent[]> {
  if (isMock) return mockDb.getActivityFeed(limitCount);
  if (!activityCol) return [];
  const q = query(activityCol, orderBy('timestamp', 'desc'), limit(limitCount));
  const snap = await getDocs(q);
  return snap.docs.map(d => parseActivity(d.data() as Record<string, unknown>));
}

export async function addActivityEvent(event: ActivityEvent): Promise<void> {
  if (isMock) return mockDb.addActivityEvent(event);
  if (!activityCol) return;
  await addDoc(activityCol, serializeDates(event as unknown as Record<string, unknown>));
}

export function subscribeToActivity(callback: (events: ActivityEvent[]) => void, limitCount: number = 20): () => void {
  if (isMock) {
    callback(mockDb.getActivityFeed(limitCount));
    return mockDb.subscribe(() => callback(mockDb.getActivityFeed(limitCount)));
  }
  if (!activityCol) return () => {};
  const q = query(activityCol, orderBy('timestamp', 'desc'), limit(limitCount));
  return onSnapshot(q, {
    next: snap => {
      const events = snap.docs.map(d => parseActivity(d.data() as Record<string, unknown>));
      callback(events);
    },
    error: err => {
      console.warn('Firestore activity subscription error:', err);
    }
  });
}

// ─── GLOBAL STATS ────────────────────────────────────────────────

export async function hasSeeded(): Promise<boolean> {
  if (isMock) return true;
  if (!db) return false;
  const ref = doc(db, 'proposals', 'NXF-009');
  const snap = await getDoc(ref);
  return snap.exists();
}

export async function getGlobalStats(): Promise<GlobalStats> {
  if (isMock) return mockDb.getGlobalStats();
  if (!db) return { totalEscrowed: 4200000, dealsCompleted: 12847, autoResolutionRate: 99.2, avgReleaseTime: '<2 MIN' };
  const ref = doc(db, 'config', 'globalStats');
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    return { totalEscrowed: 4200000, dealsCompleted: 12847, autoResolutionRate: 99.2, avgReleaseTime: '<2 MIN' };
  }
  const data = snap.data();
  return {
    totalEscrowed: data.totalEscrowed || 0,
    dealsCompleted: data.dealsCompleted || 0,
    autoResolutionRate: data.autoResolutionRate || 0,
    avgReleaseTime: data.avgReleaseTime || '<2 MIN',
  };
}

export async function updateGlobalStats(updates: { totalEscrowed?: number; dealsCreated?: number }): Promise<void> {
  if (isMock) return mockDb.updateGlobalStats(updates);
  if (!db) return;
  const ref = doc(db, 'config', 'globalStats');
  const updateObj: Record<string, unknown> = {};
  if (updates.totalEscrowed) updateObj.totalEscrowed = increment(updates.totalEscrowed);
  if (updates.dealsCreated) updateObj.dealsCompleted = increment(updates.dealsCreated);
  try {
    await updateDoc(ref, updateObj);
  } catch {
    const current = await getGlobalStats();
    await setDoc(ref, {
      totalEscrowed: (current.totalEscrowed || 0) + (updates.totalEscrowed || 0),
      dealsCompleted: (current.dealsCompleted || 0) + (updates.dealsCreated || 0),
      autoResolutionRate: current.autoResolutionRate || 99.2,
      avgReleaseTime: current.avgReleaseTime || '<2 MIN',
    });
  }
}

export function subscribeToGlobalStats(callback: (stats: GlobalStats) => void): () => void {
  if (isMock) {
    callback(mockDb.getGlobalStats());
    return mockDb.subscribe(() => callback(mockDb.getGlobalStats()));
  }
  if (!db) return () => {};
  const ref = doc(db, 'config', 'globalStats');
  return onSnapshot(ref, {
    next: snap => {
      if (!snap.exists()) {
        callback({ totalEscrowed: 4200000, dealsCompleted: 12847, autoResolutionRate: 99.2, avgReleaseTime: '<2 MIN' });
        return;
      }
      const data = snap.data();
      callback({
        totalEscrowed: data.totalEscrowed || 0,
        dealsCompleted: data.dealsCompleted || 0,
        autoResolutionRate: data.autoResolutionRate || 0,
        avgReleaseTime: data.avgReleaseTime || '<2 MIN',
      });
    },
    error: err => {
      console.warn('Firestore global stats subscription error:', err);
    }
  });
}

// ─── JUROR STATS ─────────────────────────────────────────────────

export async function updateJurorStats(updates: Partial<JurorStats>, walletAddress?: string): Promise<void> {
  if (isMock) return mockDb.updateJurorStats(updates, walletAddress);
  if (!db) return;
  const id = walletAddress || 'default';
  const ref = doc(db, 'jurorStats', id);
  await setDoc(ref, updates, { merge: true });
}

export async function getJurorStats(walletAddress?: string): Promise<JurorStats> {
  if (isMock) return mockDb.getJurorStats(walletAddress);
  if (!db) {
    return {
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
      delegatedTo: null,
    };
  }
  const id = walletAddress || 'default';
  const ref = doc(db, 'jurorStats', id);
  const snap = await getDoc(ref);
  const data = snap.exists() ? snap.data() : {};

  return {
    casesHandled: data.casesHandled ?? 24,
    majorityVotes: data.majorityVotes ?? 21,
    accuracyRate: data.accuracyRate ?? 87.5,
    totalEarned: data.totalEarned ?? 124.5,
    reputationScore: data.reputationScore ?? 847,
    maxReputation: data.maxReputation ?? 1000,
    percentile: data.percentile ?? 12,
    nxfStaked: data.nxfStaked ?? 500,
    nxfBalance: data.nxfBalance ?? 847.5,
    reputationHistory: data.reputationHistory ?? [720, 735, 742, 760, 775, 790, 780, 795, 810, 822, 835, 840, 847],
    delegatedTo: data.delegatedTo ?? null,
  };
}

export function subscribeToJurorStats(callback: (stats: JurorStats) => void, walletAddress?: string): () => void {
  if (isMock) {
    callback(mockDb.getJurorStats(walletAddress));
    return mockDb.subscribe(() => callback(mockDb.getJurorStats(walletAddress)));
  }
  if (!db) return () => {};
  const id = walletAddress || 'default';
  const ref = doc(db, 'jurorStats', id);
  return onSnapshot(ref, {
    next: snap => {
      const data = snap.exists() ? snap.data() : {};
      callback({
        casesHandled: data.casesHandled ?? 24,
        majorityVotes: data.majorityVotes ?? 21,
        accuracyRate: data.accuracyRate ?? 87.5,
        totalEarned: data.totalEarned ?? 124.5,
        reputationScore: data.reputationScore ?? 847,
        maxReputation: data.maxReputation ?? 1000,
        percentile: data.percentile ?? 12,
        nxfStaked: data.nxfStaked ?? 500,
        nxfBalance: data.nxfBalance ?? 847.5,
        reputationHistory: data.reputationHistory ?? [720, 735, 742, 760, 775, 790, 780, 795, 810, 822, 835, 840, 847],
        delegatedTo: data.delegatedTo ?? null,
      });
    },
    error: err => {
      console.warn('Firestore juror stats subscription error:', err);
    }
  });
}

// ─── GRAPH DATA (Dynamic from deals/disputes) ───────────────────

export function buildGraphData(deals: Deal[], disputes: Dispute[]): { nodes: GraphNode[]; links: GraphLink[] } {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];

  deals.forEach((deal, i) => {
    const buyerId = `b${i + 1}`;
    const sellerId = `s${i + 1}`;
    nodes.push({ id: buyerId, type: 'buyer', label: `DEAL ${deal.id} · $${deal.value.toLocaleString()}` });
    nodes.push({ id: sellerId, type: 'seller', label: `Seller ${deal.seller.slice(0, 6)}` });
    links.push({ source: buyerId, target: sellerId });
  });

  disputes.forEach((dispute, i) => {
    const disputeNodeId = `d${i + 1}`;
    nodes.push({ id: disputeNodeId, type: 'dispute', label: `DISPUTE ${dispute.id}` });

    const dealIndex = deals.findIndex(d => d.id === dispute.dealId);
    if (dealIndex >= 0) {
      links.push({ source: `b${dealIndex + 1}`, target: disputeNodeId });
      links.push({ source: `s${dealIndex + 1}`, target: disputeNodeId });
    }
  });

  return { nodes, links };
}

// ─── TICKER EVENTS (from activity feed) ──────────────────────────

export function buildTickerEvents(activity: ActivityEvent[]): string[] {
  return activity.slice(0, 10).map(event => {
    if (event.type === 'payment' || (event.type === 'deal' && event.message.includes('RELEASED'))) {
      return `✓ ${event.message.toUpperCase()}`;
    }
    if (event.type === 'dispute') {
      return `⚖ ${event.message.toUpperCase()}`;
    }
    return `● ${event.message.toUpperCase()}`;
  });
}

// ─── DEAL MESSAGES (CHAT LAYER) ──────────────────────────────────

export async function sendDealMessage(dealId: string, sender: string, text: string): Promise<string> {
  if (isMock) return mockDb.sendDealMessage(dealId, sender, text);
  if (!dealMessagesCol) return '';
  const messageData = {
    dealId,
    sender,
    text,
    timestamp: new Date(),
  };
  const docRef = await addDoc(dealMessagesCol, serializeDates(messageData as unknown as Record<string, unknown>));
  return docRef.id;
}

export function subscribeToDealMessages(dealId: string, callback: (messages: DealMessage[]) => void): () => void {
  if (isMock) {
    callback(mockDb.getDealMessages(dealId));
    return mockDb.subscribe(() => callback(mockDb.getDealMessages(dealId)));
  }
  if (!dealMessagesCol) return () => {};
  const q = query(dealMessagesCol, orderBy('timestamp', 'asc'));
  return onSnapshot(q, {
    next: snap => {
      const allMessages = snap.docs.map(d => parseDealMessage(d.id, d.data() as Record<string, unknown>));
      const dealMessages = allMessages.filter(m => m.dealId === dealId);
      callback(dealMessages);
    },
    error: err => {
      console.warn('Firestore deal messages subscription error:', err);
    }
  });
}
