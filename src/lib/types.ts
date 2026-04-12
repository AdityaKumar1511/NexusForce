// NexusForce Type Definitions — shared across all pages and Firebase service

export interface Deal {
  id: string;
  buyer: string;
  seller: string;
  value: number;
  token: string;
  status: 'active' | 'in_dispute' | 'pending_signatures' | 'confirmed' | 'completed' | 'voting';
  milestones: Milestone[];
  deadline: Date;
  createdAt: Date;
  description: string;
  txHash?: string;
  buyerSignature?: string;
  sellerSignature?: string;
}

export interface Milestone {
  title: string;
  percentage: number;
  status: 'completed' | 'pending' | 'active' | 'under_review' | 'rejected' | 'auto_released';
  deadline: Date;
  submittedAt?: Date;
  submissionProof?: string;
  rejectionReason?: string;
}

export interface Dispute {
  id: string;
  dealId: string;
  dealValue: number;
  reason: string[];
  description: string;
  buyer: string;
  seller: string;
  status: 'voting' | 'resolved' | 'pending_jury';
  raisedBy: 'buyer' | 'seller';
  evidence: EvidenceFile[];
  jurors: Juror[];
  votingDeadline: Date;
  createdAt: Date;
  verdict?: 'buyer_wins' | 'seller_wins' | 'split';
  timeline: TimelineEvent[];
  jurorSelectionLog?: string[];
}

export interface EvidenceFile {
  name: string;
  size: string;
  type: string;
  cid: string;
  uploadedBy: 'buyer' | 'seller';
  uploadedAt: Date;
  previewUrl?: string;
}

export interface Juror {
  id: number;
  address: string;
  reputation: number;
  hasVoted: boolean;
  vote?: 'buyer_wins' | 'seller_wins' | 'split';
  staked: number;
}

export interface Proposal {
  id: string;
  title: string;
  description: string;
  votesFor: number;
  votesForNXF: number;
  votesAgainst: number;
  votesAgainstNXF: number;
  deadline: Date;
  status: 'active' | 'passed' | 'rejected';
  createdAt: Date;
}

export interface ActivityEvent {
  timestamp: Date;
  type: 'deal' | 'dispute' | 'juror' | 'payment';
  message: string;
  dealId?: string;
  disputeId?: string;
}

export interface TimelineEvent {
  timestamp: Date;
  label: string;
  status: 'completed' | 'active' | 'pending' | 'under_review' | 'rejected' | 'auto_released';
}

export interface JurorStats {
  casesHandled: number;
  majorityVotes: number;
  accuracyRate: number;
  totalEarned: number;
  reputationScore: number;
  maxReputation: number;
  percentile: number;
  nxfStaked: number;
  nxfBalance: number;
  reputationHistory: number[];
  delegatedTo?: string | null;
}

export interface GlobalStats {
  totalEscrowed: number;
  dealsCompleted: number;
  autoResolutionRate: number;
  avgReleaseTime: string;
}

// Force graph node data
export interface GraphNode {
  id: string;
  type: 'buyer' | 'seller' | 'dispute';
  label: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
}

export interface DealMessage {
  id: string;
  dealId: string;
  sender: string;
  text: string;
  timestamp: Date;
}

export interface Notification {
  id: string;
  recipient: string;
  type: 'deal' | 'dispute' | 'milestone' | 'juror' | 'system';
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  timestamp: Date;
}
