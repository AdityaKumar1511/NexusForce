'use client';

import React, { useEffect, useState } from 'react';
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
} from '@/lib/firebaseService';
import { useCompleteDeal } from '@/hooks/useContractActions';
import { useWalletContext } from '@/providers/WalletProvider';
import { seedFirestore } from '@/lib/seedData';
import type { Deal, Dispute, ActivityEvent, JurorStats } from '@/lib/types';
import Link from 'next/link';
import toast from 'react-hot-toast';

const INITIAL_DEALS: Deal[] = [
  {
    id: '#4821', buyer: '0x3F4a8b2C1D9e7F6A5B3c2D1E0F9A8B7C6D5E4F3a', seller: '0x7E2c9D3B1A4F8C6E5D0B7A9F2C1E8D3B4A5F6C7D', value: 2400, token: 'USDC', status: 'in_dispute', description: 'Full-stack DeFi dashboard with analytics panel and wallet integration',
    milestones: [{ title: 'UI Design & Wireframes', percentage: 30, status: 'completed', deadline: new Date() }, { title: 'Frontend Development', percentage: 40, status: 'active', deadline: new Date() }, { title: 'Backend & Smart Contracts', percentage: 30, status: 'pending', deadline: new Date() }], deadline: new Date(), createdAt: new Date()
  },
  {
    id: '#4820', buyer: '0x1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B', seller: '0x3F4a8b2C1D9e7F6A5B3c2D1E0F9A8B7C6D5E4F3a', value: 890, token: 'USDC', status: 'completed', description: 'Smart contract audit for NFT marketplace',
    milestones: [{ title: 'Initial Audit Report', percentage: 50, status: 'completed', deadline: new Date() }, { title: 'Final Review & Sign-off', percentage: 50, status: 'completed', deadline: new Date() }], deadline: new Date(), createdAt: new Date()
  },
  {
    id: '#4819', buyer: '0x3F4a8b2C1D9e7F6A5B3c2D1E0F9A8B7C6D5E4F3a', seller: '0x9B8A7C6D5E4F3A2B1C0D9E8F7A6B5C4D3E2F1A0B', value: 5500, token: 'USDC', status: 'active', description: 'Custom ERC-721 collection with generative art engine',
    milestones: [{ title: 'Art Generation Script', percentage: 25, status: 'completed', deadline: new Date() }, { title: 'Smart Contract Development', percentage: 35, status: 'active', deadline: new Date() }, { title: 'Frontend Minting Page', percentage: 25, status: 'pending', deadline: new Date() }, { title: 'Testing & Deployment', percentage: 15, status: 'pending', deadline: new Date() }], deadline: new Date(), createdAt: new Date()
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
    votingDeadline: new Date(), createdAt: new Date(), timeline: []
  }
];

export default function DashboardPage() {
  // ─── Live wallet from RainbowKit/MetaMask ──────────────────
  const { address: walletAddress, isConnected } = useWalletContext();

  const [deals, setDeals] = useState<Deal[]>(INITIAL_DEALS);
  const [disputes, setDisputes] = useState<Dispute[]>(INITIAL_DISPUTES);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [jurorStats, setJurorStats] = useState<JurorStats>({
    casesHandled: 24, majorityVotes: 21, accuracyRate: 87.5, totalEarned: 124.5,
    reputationScore: 847, maxReputation: 1000, percentile: 12,
    nxfStaked: 500, nxfBalance: 847.5, reputationHistory: [720, 735, 742, 760, 775, 790, 780, 795, 810, 822, 835, 840, 847],
  });
  const [loading, setLoading] = useState(true);
  const [confirmingDeal, setConfirmingDeal] = useState<string | null>(null);

  // ─── On-chain deal completion hook ─────────────────────────
  const completeDealHook = useCompleteDeal();

  useEffect(() => {
    const unsub1 = subscribeToDeals((d) => {
      const all = [...d, ...INITIAL_DEALS];
      const unique = Array.from(new Map(all.map(item => [item.id, item])).values());
      // Sort to put newest first (optional, but good)
      unique.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setDeals(unique);
      setLoading(false);
    });
    const unsub2 = subscribeToDisputes((d) => {
      const all = [...INITIAL_DISPUTES, ...d];
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

  const handleConfirmDeal = async (dealId: string) => {
    if (!isConnected) {
      toast.error('Connect your wallet first to sign transactions.', {
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

    setConfirmingDeal(dealId);
    const toastId = toast.loading(`🔐 Sign transaction to release funds for ${dealId}...`, {
      style: {
        background: 'rgba(255, 255, 255, 0.04)',
        color: '#E0E0FF',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(20px)',
        fontFamily: 'Space Grotesk, sans-serif',
        fontSize: '13px'
      },
    });
    try {
      await completeDealHook.execute(dealId);
      toast.dismiss(toastId);
      toast.success(`✓ DEAL ${dealId} COMPLETED — Funds released on-chain!`, {
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
    } catch (err) {
      console.error(err);
      toast.dismiss(toastId);
      const errorMsg = err instanceof Error && err.message.includes('User rejected')
        ? 'Transaction rejected by user.'
        : 'Failed to complete deal on-chain.';
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
      setConfirmingDeal(null);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // Use dynamic wallet address (lowercase comparison for robustness)
  const myWallet = walletAddress?.toLowerCase() ?? '';

  const isUserBuyer = (deal: Deal) => deal.buyer.toLowerCase() === myWallet;

  const totalEscrowed = deals.filter(d => d.status === 'active' || d.status === 'in_dispute').reduce((sum, d) => sum + d.value, 0);
  const activeDeals = deals.filter(d => d.status !== 'completed').length;
  const activeDisputes = disputes.filter(d => d.status === 'voting' || d.status === 'pending_jury');

  // Find dispute ID for a given deal
  const getDisputeForDeal = (dealId: string): Dispute | undefined =>
    disputes.find(d => d.dealId === dealId);

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
        <div className="hidden lg:grid grid-cols-[100px_1fr_120px_160px_140px_140px] px-6 py-4 text-[10px] font-mono text-[#6060A0] uppercase tracking-[0.2em] border-b border-white/5 lg:gap-x-8">
          <span>Deal ID</span>
          <span>Counterparty</span>
          <span>Value</span>
          <span>Status</span>
          <span>Milestone</span>
          <span>Action</span>
        </div>

        {/* ── Premium Skeleton Loader ── */}
        {loading && (
          <div>
            {Array.from({ length: 3 }).map((_, i) => (
              <DealRowSkeleton key={i} delay={i * 120} />
            ))}
          </div>
        )}

        {!loading && deals.length === 0 && (
          <div className="px-6 py-12 text-center">
            <p className="font-mono text-xs text-[#6060A0]">No deals yet. <Link href="/deals/new" className="text-brand-teal hover:underline transition-all font-bold">CREATE ONE →</Link></p>
          </div>
        )}

        {!loading && deals.map((deal) => {
          const dispute = getDisputeForDeal(deal.id);
          const isBuyer = isUserBuyer(deal);
          return (
            <div key={deal.id} className="grid grid-cols-1 lg:grid-cols-[100px_1fr_120px_160px_140px_140px] px-6 py-5 items-center gap-4 lg:gap-x-8 border-b border-white/5 table-row-hover">
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
                <div className="flex items-center gap-2">
                  {deal.status === 'active' && (
                    <button
                      onClick={() => handleConfirmDeal(deal.id)}
                      disabled={confirmingDeal === deal.id}
                      className="text-[10px] font-sans font-bold px-3 py-1.5 rounded-[7px] bg-brand-teal/10 border border-brand-teal/30 text-brand-teal hover:bg-brand-teal/20 transition-all disabled:opacity-50"
                    >
                      {confirmingDeal === deal.id ? '...' : 'CONFIRM'}
                    </button>
                  )}
                  {deal.status === 'in_dispute' && dispute && (
                    <Link href={`/disputes/${encodeURIComponent(dispute.id)}`} className="text-[10px] font-sans font-bold px-3 py-1.5 rounded-[7px] bg-danger/10 border border-danger/30 text-danger hover:bg-danger/20 transition-all">
                      VIEW ⚖
                    </Link>
                  )}
                  {deal.status === 'completed' && (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-brand-teal">
                      <div className="w-1 h-1 rounded-full bg-current" />
                      DONE
                    </span>
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

          <div className="hidden lg:grid grid-cols-[110px_100px_140px_180px_1fr_120px] px-6 py-4 text-[10px] font-mono text-[#6060A0] uppercase tracking-[0.2em] border-b border-white/5 lg:gap-x-8">
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
              <div key={dispute.id} className="grid grid-cols-1 lg:grid-cols-[110px_100px_140px_180px_1fr_120px] px-6 py-5 items-center gap-4 lg:gap-x-8 border-b border-white/5 table-row-hover">
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
            {activity.length === 0 && (
              <p className="font-mono text-xs text-[#6060A0] py-8 text-center uppercase tracking-widest">No activity detected</p>
            )}
            {activity.map((event, i) => (
              <div key={i} className="flex items-start gap-3 py-3 px-2 border-b border-white/[0.03] last:border-0 group hover:bg-white/[0.01] transition-colors">
                <span className="font-mono text-[9px] text-[#5A5A7A] whitespace-nowrap mt-1 group-hover:text-brand-teal transition-colors">
                  {formatTime(event.timestamp)}
                </span>
                <span className={`font-mono text-[11px] leading-relaxed tracking-tight ${event.type === 'dispute' ? 'text-brand-pink' :
                    event.type === 'payment' ? 'text-brand-teal' :
                      event.type === 'juror' ? 'text-brand-amber' :
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
    </DashboardLayout>
  );
}
