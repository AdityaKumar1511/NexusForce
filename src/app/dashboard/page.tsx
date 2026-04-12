'use client';

import React, { useEffect, useState, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/ui/StatCard';
import StatusBadge from '@/components/ui/StatusBadge';
import MilestoneProgressBar from '@/components/ui/MilestoneProgressBar';
import TransactionHash from '@/components/ui/TransactionHash';
import { DealRowSkeleton } from '@/components/ui/SkeletonLoader';
import {
  subscribeToDeals,
  subscribeToDisputes,
  subscribeToActivity,
  subscribeToJurorStats,
  hasSeeded,
  subscribeToDealMessages,
  sendDealMessage,
  submitMilestone,
  approveMilestone,
  rejectMilestone,
} from '@/lib/firebaseService';
import { useSignDeal } from '@/hooks/useContractActions';
import { useWalletContext } from '@/providers/WalletProvider';
import { seedFirestore } from '@/lib/seedData';
import type { Deal, Dispute, ActivityEvent, JurorStats, DealMessage, Milestone } from '@/lib/types';
import CountdownTimer from '@/components/ui/CountdownTimer';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';

const INITIAL_DEALS: Deal[] = [
  {
    id: '#4821', buyer: '0x3F4a8b2C1D9e7F6A5B3c2D1E0F9A8B7C6D5E4F3a', seller: '0x7E2c9D3B1A4F8C6E5D0B7A9F2C1E8D3B4A5F6C7D', value: 2400, token: 'USDC', status: 'in_dispute', description: 'Full-stack DeFi dashboard with analytics panel and wallet integration',
    milestones: [{ title: 'UI Design & Wireframes', percentage: 30, status: 'completed', deadline: new Date('2024-04-10T12:00:00Z') }, { title: 'Frontend Development', percentage: 40, status: 'active', deadline: new Date('2024-05-15T12:00:00Z') }, { title: 'Backend & Smart Contracts', percentage: 30, status: 'pending', deadline: new Date('2024-06-01T12:00:00Z') }], deadline: new Date('2024-06-15T12:00:00Z'), createdAt: new Date('2024-04-01T12:00:00Z')
  },
  {
    id: '#4820', buyer: '0x1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B', seller: '0x3F4a8b2C1D9e7F6A5B3c2D1E0F9A8B7C6D5E4F3a', value: 890, token: 'USDC', status: 'completed', description: 'Smart contract audit for NFT marketplace',
    milestones: [{ title: 'Initial Audit Report', percentage: 50, status: 'completed', deadline: new Date('2024-03-20T12:00:00Z') }, { title: 'Final Review & Sign-off', percentage: 50, status: 'completed', deadline: new Date('2024-03-25T12:00:00Z') }], deadline: new Date('2024-03-30T12:00:00Z'), createdAt: new Date('2024-03-01T12:00:00Z')
  },
  {
    id: '#4819', buyer: '0x3F4a8b2C1D9e7F6A5B3c2D1E0F9A8B7C6D5E4F3a', seller: '0x9B8A7C6D5E4F3A2B1C0D9E8F7A6B5C4D3E2F1A0B', value: 5500, token: 'USDC', status: 'active', description: 'Custom ERC-721 collection with generative art engine',
    milestones: [{ title: 'Art Generation Script', percentage: 25, status: 'completed', deadline: new Date('2024-04-05T12:00:00Z') }, { title: 'Smart Contract Development', percentage: 35, status: 'active', deadline: new Date('2024-04-25T12:00:00Z') }, { title: 'Frontend Minting Page', percentage: 25, status: 'pending', deadline: new Date('2024-05-10T12:00:00Z') }, { title: 'Testing & Deployment', percentage: 15, status: 'pending', deadline: new Date('2024-05-20T12:00:00Z') }], deadline: new Date('2024-05-30T12:00:00Z'), createdAt: new Date('2024-03-15T12:00:00Z')
  },
];

const INITIAL_DISPUTES: Dispute[] = [
  {
    id: '#1203', dealId: '#4821', dealValue: 2400, reason: ['QUALITY BELOW SPEC', 'MISSED DEADLINE'], description: 'The frontend deliverable does not match the wireframes approved in Milestone 1.', buyer: '0x3F4a8b2C...', seller: '0x7E2c9D3B...', status: 'voting', raisedBy: 'buyer',
    evidence: [],
    jurors: [
      { id: 1, address: '0xJUR1...A2c3', reputation: 892, hasVoted: true, vote: 'buyer_wins', staked: 150 },
      { id: 2, address: '0xJUR2...B4d5', reputation: 731, hasVoted: true, vote: 'buyer_wins', staked: 200 },
      { id: 3, address: '0xJUR3...C6e7', reputation: 884, hasVoted: false, staked: 175 },
      { id: 4, address: '0xJUR4...D8f9', reputation: 756, hasVoted: true, vote: 'seller_wins', staked: 125 },
      { id: 5, address: '0xJUR5...E0g1', reputation: 945, hasVoted: true, vote: 'buyer_wins', staked: 300 },
      { id: 6, address: '0xJUR6...F2h3', reputation: 812, hasVoted: true, vote: 'buyer_wins', staked: 180 },
      { id: 7, address: '0xJUR7...G4i5', reputation: 667, hasVoted: false, staked: 100 },
    ],
    votingDeadline: new Date('2024-04-15T12:00:00Z'), createdAt: new Date('2024-04-05T12:00:00Z'), timeline: []
  }
];

export default function DashboardPage() {
  // ─── Live wallet from RainbowKit/MetaMask ──────────────────
  const { address: walletAddress, isConnected } = useWalletContext();
  const [mounted, setMounted] = useState(false);
  const [deals, setDeals] = useState<Deal[]>(INITIAL_DEALS);
  const [disputes, setDisputes] = useState<Dispute[]>(INITIAL_DISPUTES);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [jurorStats, setJurorStats] = useState<JurorStats>({
    casesHandled: 24, majorityVotes: 21, accuracyRate: 87.5, totalEarned: 124.5,
    reputationScore: 847, maxReputation: 1000, percentile: 12,
    nxfStaked: 500, nxfBalance: 847.5, reputationHistory: [720, 735, 742, 760, 775, 790, 780, 795, 810, 822, 835, 840, 847],
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [submissionProof, setSubmissionProof] = useState('');
  const [isSubmittingWork, setIsSubmittingWork] = useState(false);
  const [revisionReason, setRevisionReason] = useState('');

  const handleMilestoneSubmit = async (dealId: string, index: number) => {
    if (!submissionProof) return toast.error('Please provide a proof hash or link');
    setIsSubmittingWork(true);
    try {
      await submitMilestone(dealId, index, submissionProof);
      toast.success('Work submitted for review!');
      setSubmissionProof('');
    } catch (err) {
      toast.error('Submission failed');
    } finally {
      setIsSubmittingWork(false);
    }
  };

  const handleMilestoneAction = async (dealId: string, index: number, action: 'approve' | 'reject') => {
    try {
      if (action === 'approve') {
        await approveMilestone(dealId, index);
        toast.success('Milestone approved & funds released');
      } else {
        if (!revisionReason) return toast.error('Please provide a reason for revision');
        await rejectMilestone(dealId, index, revisionReason);
        toast.success('Revision requested');
        setRevisionReason('');
      }
    } catch (err) {
      toast.error('Action failed');
    }
  };
  const [dealMessages, setDealMessages] = useState<DealMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSendingMsg, setIsSendingMsg] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selectedDeal) {
      setDealMessages([]);
      return;
    }
    const unsub = subscribeToDealMessages(selectedDeal.id, setDealMessages);
    return () => unsub();
  }, [selectedDeal]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [dealMessages, selectedDeal]);

  const searchParams = useSearchParams();

  useEffect(() => {
    const dealId = searchParams.get('deal');
    if (dealId && deals.length > 0) {
      const deal = deals.find(d => d.id === dealId);
      if (deal) setSelectedDeal(deal);
    }
  }, [searchParams, deals]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedDeal || !walletAddress) {
      if (!walletAddress) toast.error('Connect wallet to send messages');
      return;
    }
    setIsSendingMsg(true);
    try {
      await sendDealMessage(selectedDeal.id, walletAddress, chatInput.trim());
      setChatInput('');
    } catch (err) {
      console.error('Failed to send msg:', err);
      toast.error('Failed to send message');
    } finally {
      setIsSendingMsg(false);
    }
  };

  // ─── On-chain deal completion hook ─────────────────────────

  const signDealHook = useSignDeal();

  useEffect(() => {
    const unsub1 = subscribeToDeals((d) => {
      const all = [...d, ...INITIAL_DEALS];
      const unique = Array.from(new Map(all.map(item => [item.id, item])).values());
      // Sort to put newest first (optional, but good)
      unique.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setDeals(unique);
    });
    const unsub2 = subscribeToDisputes((d) => {
      const all = [...d, ...INITIAL_DISPUTES];
      const unique = Array.from(new Map(all.map(item => [item.id, item])).values());
      unique.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setDisputes(unique);
    });
    const unsub3 = subscribeToActivity((act) => { setActivity(prev => act.length > 0 ? act : prev); });
    const unsub4 = subscribeToJurorStats(setJurorStats);

    let isSeeding = false;
    const checkAndSeed = async () => {
      if (isSeeding) return;
      isSeeding = true;
      try {
        if (!(await hasSeeded())) {
          console.log('Database uninitialized. Auto-seeding from dashboard...');
          await seedFirestore();
        }
      } catch (err) {
        console.error('Auto-seed check failed:', err);
      }
    };
    checkAndSeed();

    return () => { unsub1(); unsub2(); unsub3(); unsub4(); };
  }, []);



  const handleSignDeal = async (deal: Deal) => {
    if (!isConnected || !walletAddress) {
      toast.error('Connect your wallet first to sign.', {
        style: {
          background: 'rgba(255, 255, 255, 0.04)',
          color: '#EF4444',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(20px)',
          fontFamily: 'Space Grotesk, sans-serif',
          fontSize: '13px'
        },
      });
      return;
    }

    toast.dismiss();
    const toastId = toast.loading(`🔐 Sign typed data to confirm ${deal.id}...`, {
      style: {
        background: 'rgba(255, 255, 255, 0.04)', color: '#E0E0FF', border: '1px solid rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(20px)', fontFamily: 'Space Grotesk, sans-serif', fontSize: '13px'
      },
    });

    const hardTimeout = setTimeout(() => {
      toast.dismiss(toastId);
      toast.loading('Pending confirmation...', { id: toastId, duration: 2000, style: { background: 'rgba(255, 255, 255, 0.04)', color: '#E0E0FF', border: '1px solid rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(20px)', fontFamily: 'Space Grotesk, sans-serif', fontSize: '13px' }});
    }, 3000);

    try {
      const myWallet = walletAddress.toLowerCase();
      const isBuyer = deal.buyer.toLowerCase() === myWallet;
      const role = isBuyer ? 'buyer' : 'seller';

      await signDealHook.execute(deal.id, deal.value.toString(), deal.buyer, deal.seller, role);

      clearTimeout(hardTimeout);
      toast.dismiss(toastId);
      toast.success(`✓ DEAL ${deal.id} CONFIRMED!`, {
        style: {
          background: 'rgba(255, 255, 255, 0.04)',
          color: '#00E5C3',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(20px)',
          fontFamily: 'Space Grotesk, sans-serif',
          fontSize: '13px'
        },
        iconTheme: { primary: '#00E5C3', secondary: '#060612' },
        duration: 5000,
      });

      // Optimistically update the UI status
      setDeals(prev => prev.map(d =>
        d.id === deal.id ? { ...d, status: 'confirmed' as const } : d
      ));
    } catch (err) {
      console.error(err);
      toast.dismiss(toastId);
      const errorMsg = err instanceof Error && err.message.includes('rejected')
        ? 'Signature rejected by user.'
        : 'Failed to sign deal.';
      toast.error(errorMsg, {
        style: {
          background: 'rgba(255, 255, 255, 0.04)',
          color: '#EF4444',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(20px)',
          fontFamily: 'Space Grotesk, sans-serif',
          fontSize: '13px'
        },
      });
    } finally {

    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // Use dynamic wallet address (lowercase comparison for robustness)
  const myWallet = walletAddress?.toLowerCase() ?? '';

  const isUserBuyer = (deal: Deal) => deal.buyer.toLowerCase() === myWallet;

  const totalEscrowed = deals.filter(d => ['active', 'in_dispute', 'pending_signatures', 'confirmed'].includes(d.status)).reduce((sum, d) => sum + d.value, 0);
  const activeDeals = deals.filter(d => d.status !== 'completed').length;
  const activeDisputes = disputes.filter(d => d.status === 'voting' || d.status === 'pending_jury');

  // Find dispute ID for a given deal
  const getDisputeForDeal = (dealId: string): Dispute | undefined =>
    disputes.find(d => d.dealId === dealId);

  const combinedActivity = [
    ...activity,
    ...deals
      .filter(d => d.status !== 'completed')
      .map(deal => ({
        timestamp: deal.createdAt,
        type: 'deal' as const,
        message: `Active Deal: ${deal.id} - ${deal.description || 'No description'}`,
      })),
    ...activeDisputes
      .map(dispute => ({
        timestamp: dispute.createdAt,
        type: 'dispute' as const,
        message: `Active Dispute: ${dispute.id} for Deal ${dispute.dealId}`,
      }))
  ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="mb-10">
        <h1 className="font-sans text-3xl font-bold text-[#E0E0FF] tracking-tight">MISSION CONTROL</h1>
        <p className="text-[#B0B0E0] font-mono text-[10px] mt-2 opacity-60 tracking-widest uppercase">Your deals, disputes, and juror activity at a glance</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard value={activeDeals} label="Active Deals" delay={0} suffix="" />
        <StatCard value={totalEscrowed} prefix="$" label="Escrowed (USDC)" delay={80} suffix="" />
        <StatCard value={jurorStats.reputationScore} label="Juror Score / 1000" delay={160} suffix="" />
        <StatCard value={jurorStats.nxfStaked} label="NXF Staked" delay={240} suffix="" />
      </div>

      {/* Active Deals Table */}
      <div className="glass mb-8 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <h2 className="font-sans text-sm font-bold text-[#E0E0FF] tracking-wider uppercase">ACTIVE DEALS</h2>
          <Link href="/deals/new" className="text-brand-teal text-xs font-mono hover:underline tracking-tighter transition-all">+ New Deal</Link>
        </div>

        {/* Table Header */}
        <div className="hidden lg:grid grid-cols-[100px_1fr_120px_160px_140px_180px] pl-6 pr-4 py-4 text-[10px] font-mono text-[#6060A0] uppercase tracking-[0.15em] border-b border-white/5 lg:gap-x-4">
          <span>Deal ID</span>
          <span>Counterparty</span>
          <span>Value</span>
          <span>Status</span>
          <span>Milestone</span>
          <span>Action</span>
        </div>

        {deals.length === 0 && (
          <div className="px-6 py-12 text-center">
            <p className="font-mono text-xs text-[#6060A0]">No deals yet. <Link href="/deals/new" className="text-brand-teal hover:underline transition-all font-bold">CREATE ONE →</Link></p>
          </div>
        )}

        {deals.map((deal) => {
          const dispute = getDisputeForDeal(deal.id);
          const isBuyer = isUserBuyer(deal);
          return (
            <div key={deal.id} className="grid grid-cols-1 lg:grid-cols-[100px_1fr_120px_160px_140px_180px] pl-6 pr-4 py-5 items-center gap-4 lg:gap-x-4 border-b border-white/5 table-row-hover">
              <div className="flex justify-between items-center lg:block">
                <span className="lg:hidden text-[10px] font-mono text-[#6060A0] uppercase">Deal ID</span>
                <span className="font-mono text-sm text-brand-teal font-semibold">{deal.id}</span>
              </div>
              
              <div className="flex justify-between items-center lg:block">
                <span className="lg:hidden text-[10px] font-mono text-[#6060A0] uppercase">Counterparty</span>
                <div className="flex items-center gap-2">
                  <TransactionHash hash={isBuyer ? deal.seller : deal.buyer} />
                  <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${isBuyer ? 'bg-brand-teal/10 border-brand-teal/20 text-brand-teal' : 'bg-brand-purple/10 border-brand-purple/20 text-[#8B85FF]'
                    }`}>
                    {isBuyer ? 'BUYER' : 'SELLER'}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center lg:block">
                <span className="lg:hidden text-[10px] font-mono text-[#6060A0] uppercase">Value</span>
                <span className="font-mono text-sm text-[#E0E0FF]">${deal.value.toLocaleString()} {deal.token}</span>
              </div>

              <div className="flex justify-between items-center lg:block">
                <span className="lg:hidden text-[10px] font-mono text-[#6060A0] uppercase">Status</span>
                <StatusBadge status={deal.status} />
              </div>

              <div className="flex justify-between items-center lg:block">
                <span className="lg:hidden text-[10px] font-mono text-[#6060A0] uppercase mb-1">Milestone</span>
                <div className="w-32">
                  <MilestoneProgressBar milestones={deal.milestones} showLabels />
                </div>
              </div>

              <div className="flex justify-between items-center lg:block">
                <span className="lg:hidden text-[10px] font-mono text-[#6060A0] uppercase">Action</span>
                <div className="flex flex-wrap items-center lg:justify-end gap-2">
                  {deal.status === 'in_dispute' && dispute && (
                    <Link href={`/disputes/${encodeURIComponent(dispute.id)}`} className="text-[10px] font-sans font-bold px-4 py-1.5 rounded-[7px] bg-white/5 border border-white/10 text-[#B0B0E0] hover:bg-white/10 hover:text-white transition-all whitespace-nowrap w-[140px] text-center">
                      VIEW DISPUTE →
                    </Link>
                  )}
                  {deal.status === 'pending_signatures' && (
                    <button 
                      onClick={() => handleSignDeal(deal)}
                      className="text-[10px] font-sans font-bold px-4 py-1.5 rounded-[7px] bg-transparent border border-brand-amber/30 text-brand-amber hover:bg-brand-amber/10 transition-all whitespace-nowrap w-[140px] text-center"
                    >
                      AWAITING SIGNATURE
                    </button>
                  )}
                  {(deal.status === 'active' || deal.status === 'completed' || deal.status === 'confirmed') && (
                    <button
                      onClick={() => setSelectedDeal(deal)}
                      className="text-[10px] font-sans font-bold px-4 py-1.5 rounded-[7px] bg-white/5 border border-white/10 text-[#B0B0E0] hover:bg-white/10 hover:text-white transition-all whitespace-nowrap w-[140px] text-center"
                    >
                      VIEW
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Disputes Section */}
      {activeDisputes.length > 0 && (
        <div className="glass border-brand-pink/20 mb-8 overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-brand-pink/10">
            <div className="flex items-center gap-4">
              <h2 className="font-sans text-sm font-bold text-[#E0E0FF] tracking-wider uppercase">ACTIVE DISPUTES</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-brand-pink/10 text-brand-pink border border-brand-pink/20 animate-pulse tracking-widest">{activeDisputes.length} LIVE</span>
            </div>
            <Link href="/disputes/new" className="text-brand-pink text-xs font-mono hover:underline transition-all tracking-tighter uppercase font-bold">+ File Dispute</Link>
          </div>

          <div className="hidden lg:grid grid-cols-[90px_90px_120px_160px_1fr_100px] px-6 py-4 text-[10px] font-mono text-[#6060A0] uppercase tracking-[0.2em] border-b border-white/5 lg:gap-x-4">
            <span>Dispute ID</span>
            <span>Deal ID</span>
            <span>Value</span>
            <span>Status</span>
            <span>Jurors</span>
            <span>Action</span>
          </div>

          {activeDisputes.map((dispute) => {
            const votedCount = dispute.jurors.filter(j => j.hasVoted).length;
            return (
              <div key={dispute.id} className="grid grid-cols-1 lg:grid-cols-[90px_90px_120px_160px_1fr_100px] px-6 py-5 items-center gap-4 lg:gap-x-4 border-b border-white/5 table-row-hover">
                <div className="flex justify-between items-center lg:block">
                  <span className="lg:hidden text-[10px] font-mono text-[#6060A0] uppercase">Dispute ID</span>
                  <span className="font-mono text-sm text-brand-pink font-semibold">{dispute.id}</span>
                </div>

                <div className="flex justify-between items-center lg:block">
                  <span className="lg:hidden text-[10px] font-mono text-[#6060A0] uppercase">Deal ID</span>
                  <span className="font-mono text-sm text-brand-teal opacity-70">{dispute.dealId}</span>
                </div>

                <div className="flex justify-between items-center lg:block">
                  <span className="lg:hidden text-[10px] font-mono text-[#6060A0] uppercase">Value</span>
                  <span className="font-mono text-sm text-[#E0E0FF]">${dispute.dealValue.toLocaleString()} USDC</span>
                </div>

                <div className="flex justify-between items-center lg:block">
                  <span className="lg:hidden text-[10px] font-mono text-[#6060A0] uppercase">Status</span>
                  <span className="text-[10px] font-mono px-2 py-1 rounded-full bg-brand-amber/10 text-brand-amber border border-brand-amber/20 tracking-tighter">
                    ⚖ {dispute.status === 'voting' ? 'VOTING IN PROGRESS' : 'PENDING JURY'}
                  </span>
                </div>

                <div className="flex justify-between items-center lg:block">
                  <span className="lg:hidden text-[10px] font-mono text-[#6060A0] uppercase">Jurors</span>
                  <div className="flex items-center gap-2">
                    {dispute.jurors.slice(0, 7).map((juror, j) => (
                      <div
                        key={j}
                        title={juror.address}
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold border transition-all ${juror.hasVoted
                            ? 'bg-brand-teal/20 border-brand-teal/40 text-brand-teal'
                            : 'bg-white/5 border-white/10 text-[#6060A0]'
                          }`}
                      >
                        {j + 1}
                      </div>
                    ))}
                    <span className="font-mono text-[9px] text-[#6060A0] ml-2 uppercase tracking-widest">{votedCount}/{dispute.jurors.length} VOTED</span>
                  </div>
                </div>

                <div className="flex justify-between items-center lg:block">
                  <span className="lg:hidden text-[10px] font-mono text-[#6060A0] uppercase">Action</span>
                  <Link href={`/disputes/${encodeURIComponent(dispute.id)}`} className="text-[10px] font-sans font-bold px-3 py-1.5 rounded-[7px] bg-danger/10 border border-danger/30 text-danger hover:bg-danger/20 transition-all inline-flex items-center gap-2 w-fit">
                    VIEW CASE →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom Row: Activity Feed + Juror Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Feed */}
        <div className="glass overflow-hidden">
          <div className="p-6 border-b border-white/5">
            <h2 className="font-sans text-sm font-bold text-[#E0E0FF] tracking-wider uppercase">RECENT ACTIVITY</h2>
          </div>
          <div className="p-4 max-h-80 overflow-y-auto space-y-0">
            {combinedActivity.length === 0 && (
              <p className="font-mono text-xs text-[#6060A0] py-8 text-center uppercase tracking-widest">No activity detected</p>
            )}
            {combinedActivity.map((event, i) => (
              <div key={i} className="flex items-start gap-3 py-3 px-2 border-b border-white/[0.03] last:border-0 group hover:bg-white/[0.01] transition-colors">
                <span className="font-mono text-[9px] text-[#5A5A7A] whitespace-nowrap mt-1 group-hover:text-brand-teal transition-colors">
                  {mounted ? formatTime(event.timestamp) : '--:--:--'}
                </span>
                <span className={`font-mono text-[11px] leading-relaxed tracking-tight ${event.type === 'dispute' ? 'text-brand-pink' :
                    event.type === 'payment' ? 'text-brand-teal' :
                      event.type === 'juror' ? 'text-brand-amber' :
                        event.type === 'deal' ? 'text-[#E0E0FF]' :
                          'text-brand-purple-light'
                  }`}>
                  {event.message}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Juror Stats */}
        <div className="glass overflow-hidden">
          <div className="p-6 border-b border-white/5">
            <h2 className="font-sans text-sm font-bold text-[#E0E0FF] tracking-wider uppercase">YOUR JUROR STATS</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <p className="font-sans text-2xl font-bold text-brand-teal tracking-tight">{jurorStats.casesHandled}</p>
                <p className="text-[#6060A0] font-mono text-[9px] mt-1 uppercase tracking-widest font-semibold">Cases Handled</p>
              </div>
              <div>
                <p className="font-sans text-2xl font-bold text-brand-teal tracking-tight">{jurorStats.majorityVotes}</p>
                <p className="text-[#6060A0] font-mono text-[9px] mt-1 uppercase tracking-widest font-semibold">Majority Votes</p>
              </div>
              <div>
                <p className="font-sans text-2xl font-bold text-brand-amber tracking-tight">{jurorStats.accuracyRate}%</p>
                <p className="text-[#6060A0] font-mono text-[9px] mt-1 uppercase tracking-widest font-semibold">Accuracy Rate</p>
              </div>
              <div>
                <p className="font-sans text-2xl font-bold text-[#8B85FF] tracking-tight">+{jurorStats.totalEarned} NXF</p>
                <p className="text-[#6060A0] font-mono text-[9px] mt-1 uppercase tracking-widest font-semibold">Total Earned</p>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-[#5A5A7A] font-mono text-[9px] uppercase tracking-[0.2em] mb-4">Reputation Trend (Last {jurorStats.reputationHistory.length} Cases)</p>
              <div className="h-20 flex items-end gap-1.5">
                {jurorStats.reputationHistory.length > 0 ? jurorStats.reputationHistory.map((score, i) => {
                  const max = Math.max(...jurorStats.reputationHistory);
                  const min = Math.min(...jurorStats.reputationHistory);
                  const range = max - min || 1;
                  const height = ((score - min) / range) * 100;
                  return (
                    <div key={i} className="flex-1 relative group">
                      <div
                        className="w-full bg-brand-teal/20 rounded-t-[2px] group-hover:bg-brand-teal group-hover:shadow-[0_0_15px_rgba(0,229,195,0.4)] transition-all duration-300"
                        style={{ height: `${Math.max(height, 15)}%` }}
                      />
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-mono font-bold text-brand-teal glass px-2 py-0.5 opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 whitespace-nowrap z-10 border-brand-teal/20">
                        {score}
                      </div>
                    </div>
                  );
                }) : (
                  <p className="font-mono text-xs text-[#6060A0] w-full text-center py-4">NO DATA AVAILABLE</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Deal Details Modal */}
      {selectedDeal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#060612]/90 backdrop-blur-md animate-fade-in">
          <div className="glass w-full max-w-5xl rounded-3xl overflow-hidden border-brand-teal/20 relative animate-slide-up flex flex-col">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-teal to-[#8B85FF]" />
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02] shrink-0">
              <div>
                <h2 className="font-sans text-xl font-bold text-[#E0E0FF] tracking-tight uppercase">DEAL {selectedDeal.id}</h2>
                <p className="font-mono text-[9px] text-[#6060A0] uppercase tracking-widest mt-1">Full Off-chain Record</p>
              </div>
              <button 
                onClick={() => setSelectedDeal(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#6060A0] hover:text-white hover:bg-white/10 transition-all text-xl"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-5 h-[70vh] min-h-[500px]">
              {/* DEAL DETAILS - LEFT COLUMN */}
              <div className="col-span-1 lg:col-span-2 p-8 overflow-y-auto border-r border-white/5 space-y-8 custom-scrollbar">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                    <p className="font-mono text-[9px] text-[#6060A0] uppercase tracking-widest font-bold mb-2">Deal Status</p>
                    <StatusBadge status={selectedDeal.status} />
                  </div>
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                    <p className="font-mono text-[9px] text-[#6060A0] uppercase tracking-widest font-bold mb-2">Escrow Value</p>
                    <p className="font-sans text-lg font-bold text-brand-teal tracking-tight">${selectedDeal.value.toLocaleString()} {selectedDeal.token}</p>
                  </div>
                </div>

                <div>
                  <p className="font-mono text-[9px] text-[#6060A0] uppercase tracking-widest font-bold mb-3">Parties Involved</p>
                  <div className="space-y-2">
                    <div className="flex flex-col gap-1 p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                      <span className="font-mono text-[9px] text-[#5A5A7A] uppercase font-bold tracking-widest">Buyer</span>
                      <span className="font-mono text-[10px] text-[#E0E0FF] break-all">{selectedDeal.buyer}</span>
                    </div>
                    <div className="flex flex-col gap-1 p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                      <span className="font-mono text-[9px] text-[#5A5A7A] uppercase font-bold tracking-widest">Seller</span>
                      <span className="font-mono text-[10px] text-[#E0E0FF] break-all">{selectedDeal.seller}</span>
                    </div>
                  </div>
                </div>

                {selectedDeal.description && (
                  <div>
                    <p className="font-mono text-[9px] text-[#6060A0] uppercase tracking-widest font-bold mb-3">Scope</p>
                    <p className="text-[#B0B0E0] text-xs leading-relaxed italic bg-white/[0.02] p-4 rounded-xl border border-white/5">{selectedDeal.description}</p>
                  </div>
                )}

                <div>
                  <p className="font-mono text-[9px] text-[#6060A0] uppercase tracking-widest font-bold mb-3">Milestones</p>
                  <div className="space-y-2">
                    {selectedDeal.milestones.map((m, i) => (
                      <div key={i} className="flex justify-between items-center p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            m.status === 'completed' ? 'bg-brand-teal' : 
                            m.status === 'under_review' ? 'bg-brand-amber animate-pulse' : 
                            m.status === 'active' ? 'bg-brand-teal pulse-dot' : 
                            m.status === 'rejected' ? 'bg-brand-pink' :
                            m.status === 'auto_released' ? 'bg-[#8B85FF]' :
                            'bg-white/20'}`} />
                          <span className="font-sans text-xs text-[#E0E0FF] font-bold">{m.title}</span>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1">
                          <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-[#060612] border border-white/10 text-[#B0B0E0]">{m.percentage}%</span>
                          {m.status === 'under_review' && m.submittedAt && (
                            <div className="flex items-center gap-1 opacity-80">
                              <span className="text-[8px] font-mono text-brand-amber animate-pulse">●</span>
                              <CountdownTimer 
                                targetDate={new Date(m.submittedAt.getTime() + 72 * 60 * 60 * 1000)} 
                                size="sm" 
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* DYNAMIC ACTIONS SECTION */}
                <div className="pt-4 border-t border-white/5">
                  {(() => {
                    const isSeller = walletAddress?.toLowerCase() === selectedDeal.seller.toLowerCase();
                    const isBuyer = walletAddress?.toLowerCase() === selectedDeal.buyer.toLowerCase();
                    const activeMilestoneIndex = selectedDeal.milestones.findIndex(m => m.status === 'pending' || m.status === 'active' || m.status === 'rejected');
                    const reviewMilestoneIndex = selectedDeal.milestones.findIndex(m => m.status === 'under_review');

                    if (isSeller && activeMilestoneIndex !== -1) {
                      const m = selectedDeal.milestones[activeMilestoneIndex];
                      return (
                        <div className="space-y-4">
                          <div className="flex flex-col gap-2">
                            <label className="font-mono text-[9px] text-[#6060A0] uppercase tracking-widest font-bold">Submit Work for: {m.title}</label>
                            <input 
                              type="text" 
                              placeholder="IPFS Hash or Deliverable Link..."
                              value={submissionProof}
                              onChange={(e) => setSubmissionProof(e.target.value)}
                              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-[#E0E0FF] focus:outline-none focus:border-brand-teal/50"
                            />
                          </div>
                          <button 
                            onClick={() => handleMilestoneSubmit(selectedDeal.id, activeMilestoneIndex)}
                            disabled={isSubmittingWork}
                            className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-teal/20 to-[#8B85FF]/20 border border-brand-teal/30 text-white font-sans text-xs font-bold hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50"
                          >
                            {isSubmittingWork ? 'SUBMITTING...' : 'SUBMIT FOR REVIEW'}
                          </button>
                        </div>
                      );
                    }

                    if (isBuyer && reviewMilestoneIndex !== -1) {
                      const m = selectedDeal.milestones[reviewMilestoneIndex];
                      return (
                        <div className="space-y-4">
                          <div className="bg-brand-amber/5 border border-brand-amber/20 rounded-xl p-4">
                            <p className="text-[10px] text-brand-amber font-mono uppercase tracking-widest mb-2 font-bold flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-brand-amber animate-pulse" />
                              Under Review: {m.title}
                            </p>
                            <p className="text-[10px] text-[#A0A0C0] leading-relaxed mb-3">Proof: <span className="text-brand-teal break-all">{m.submissionProof}</span></p>
                            
                            <div className="flex flex-col gap-2 mb-4">
                              <textarea 
                                placeholder="Reason for revision (only if rejecting)..."
                                value={revisionReason}
                                onChange={(e) => setRevisionReason(e.target.value)}
                                className="w-full bg-black/20 border border-white/5 rounded-lg px-3 py-2 text-[10px] font-sans text-[#E0E0FF] h-16 focus:outline-none focus:border-brand-pink/30"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <button 
                                onClick={() => handleMilestoneAction(selectedDeal.id, reviewMilestoneIndex, 'approve')}
                                className="py-2.5 rounded-lg bg-brand-teal/10 border border-brand-teal/30 text-brand-teal font-sans text-[10px] font-bold hover:bg-brand-teal/20 transition-all"
                              >
                                APPROVE & RELEASE
                              </button>
                              <button 
                                onClick={() => handleMilestoneAction(selectedDeal.id, reviewMilestoneIndex, 'reject')}
                                className="py-2.5 rounded-lg bg-brand-pink/10 border border-brand-pink/30 text-brand-pink font-sans text-[10px] font-bold hover:bg-brand-pink/20 transition-all"
                              >
                                REQUEST REVISION
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    if (isSeller && reviewMilestoneIndex !== -1) {
                      return (
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                          <p className="text-[10px] text-[#A0A0C0] font-mono uppercase tracking-widest mb-3">Awaiting Buyer Review...</p>
                          <div className="flex flex-col gap-2">
                            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full bg-brand-amber animate-pulse w-[40%]" />
                            </div>
                            <p className="text-[9px] text-[#6060A0] font-mono">Auto-release in ~72 hours if no action taken</p>
                            
                            {/* FAST-FORWARD FOR DEMO */}
                            <button 
                              onClick={() => handleMilestoneAction(selectedDeal.id, reviewMilestoneIndex, 'approve')}
                              className="mt-2 py-1.5 px-3 rounded-lg border border-brand-teal/20 text-brand-teal text-[8px] font-mono hover:bg-brand-teal/10 transition-all uppercase tracking-widest font-bold"
                            >
                              ⚡ DEMO: Fast-Forward (Trigger Auto-Release)
                            </button>
                          </div>
                        </div>
                      );
                    }
                    
                    return null;
                  })()}
                </div>
              </div>

              {/* CHAT LAYER / LOGS - RIGHT COLUMN */}
              <div className="col-span-1 lg:col-span-3 flex flex-col h-full bg-white/[0.01]">
                <div className="p-4 border-b border-white/5 bg-black/20 shrink-0">
                  <p className="font-mono text-[10px] text-[#8B85FF] uppercase tracking-widest font-bold flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#8B85FF] animate-pulse" />
                    Encrypted Evidence Log
                  </p>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-gradient-to-b from-transparent to-black/10">
                  {dealMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-50">
                      <svg className="w-8 h-8 text-[#6060A0] mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <p className="font-mono text-[#6060A0] text-[10px] uppercase tracking-widest text-center">No messages yet.<br/>Start the evidence trail.</p>
                    </div>
                  ) : (
                    dealMessages.map((msg) => {
                      const isMe = msg.sender.toLowerCase() === myWallet;
                      return (
                        <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-fade-in`}>
                          <div className={`max-w-[85%] rounded-2xl p-4 ${isMe ? 'bg-brand-purple/10 border border-brand-purple/20 rounded-tr-sm' : 'bg-white/5 border border-white/10 rounded-tl-sm'}`}>
                            <p className="text-[#E0E0FF] text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                          </div>
                          <div className={`flex items-center gap-2 mt-2 px-1 opacity-70 ${isMe ? 'flex-row-reverse' : ''}`}>
                            <span className="font-mono text-[9px] text-[#6060A0] uppercase">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            <span className="font-mono text-[9px] text-[#5A5A7A] bg-black/40 px-1.5 py-0.5 rounded border border-white/5">
                              {msg.sender.slice(0,6)}...{msg.sender.slice(-4)}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} className="h-1" />
                </div>

                <div className="p-4 border-t border-white/5 bg-black/20 shrink-0">
                  <form onSubmit={handleSendMessage} className="flex gap-3">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Record a message to the evidence trail..."
                      className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-[#E0E0FF] font-sans focus:outline-none focus:border-[#8B85FF]/50 focus:ring-1 focus:ring-[#8B85FF]/20 transition-all"
                      disabled={isSendingMsg}
                    />
                    <button 
                      type="submit"
                      disabled={isSendingMsg || !chatInput.trim()}
                      className="px-6 rounded-xl bg-[#8B85FF]/10 border border-[#8B85FF]/30 text-[#8B85FF] font-sans font-bold hover:bg-[#8B85FF]/20 hover:shadow-[0_0_15px_rgba(139,133,255,0.2)] transition-all disabled:opacity-50 flex items-center justify-center uppercase tracking-wider text-[11px]"
                    >
                      {isSendingMsg ? (
                        <span className="flex gap-1 items-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#8B85FF] animate-bounce"></span>
                          <span className="w-1.5 h-1.5 rounded-full bg-[#8B85FF] animate-bounce" style={{animationDelay: '0.1s'}}></span>
                          <span className="w-1.5 h-1.5 rounded-full bg-[#8B85FF] animate-bounce" style={{animationDelay: '0.2s'}}></span>
                        </span>
                      ) : (
                        <>Record ↵</>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
