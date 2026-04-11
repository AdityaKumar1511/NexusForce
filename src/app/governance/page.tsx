'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { subscribeToProposals, subscribeToJurorStats, voteOnProposal, hasSeeded } from '@/lib/firebaseService';
import { seedFirestore } from '@/lib/seedData';
import type { Proposal, JurorStats } from '@/lib/types';
import toast from 'react-hot-toast';

const INITIAL_PROPOSALS: Proposal[] = [
  {
    id: 'NXF-012',
    title: 'Increase minimum juror stake from 100 NXF to 200 NXF',
    description: 'This proposal aims to raise the minimum staking threshold for juror eligibility from 100 NXF to 200 NXF.',
    votesFor: 68, votesForNXF: 2400000, votesAgainst: 32, votesAgainstNXF: 1100000,
    deadline: new Date(Date.now() + 3.58 * 24 * 60 * 60 * 1000), status: 'active', createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'NXF-011',
    title: 'Reduce protocol fee from 1.5% to 1.0% for deals under $500',
    description: 'Small deal makers are disproportionately affected by the flat 1.5% fee. This proposal introduces a tiered fee structure.',
    votesFor: 74, votesForNXF: 3100000, votesAgainst: 26, votesAgainstNXF: 980000,
    deadline: new Date(Date.now() + 1.25 * 24 * 60 * 60 * 1000), status: 'active', createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'NXF-010',
    title: 'Add WETH as a supported escrow token',
    description: 'Expand the escrow contract to accept Wrapped ETH (WETH) as a valid payment token alongside USDC, USDT, and MATIC.',
    votesFor: 91, votesForNXF: 4200000, votesAgainst: 9, votesAgainstNXF: 380000,
    deadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), status: 'passed', createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'NXF-009',
    title: 'Implement super-jury appeal for disputes above $10,000',
    description: 'For high-value disputes exceeding $10,000 USDC, allow an appeal to a super-jury of 25 high-reputation jurors.',
    votesFor: 82, votesForNXF: 3600000, votesAgainst: 18, votesAgainstNXF: 720000,
    deadline: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), status: 'passed', createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
  },
];

export default function GovernancePage() {
  const [proposals, setProposals] = useState<Proposal[]>(INITIAL_PROPOSALS);
  const [jurorStats, setJurorStats] = useState<JurorStats>({
    casesHandled: 24, majorityVotes: 21, accuracyRate: 87.5, totalEarned: 124.5,
    reputationScore: 847, maxReputation: 1000, percentile: 12,
    nxfStaked: 500, nxfBalance: 847.5, reputationHistory: [720, 735, 742, 760, 775, 790, 780, 795, 810, 822, 835, 840, 847],
  });
  const [votedProposals, setVotedProposals] = useState<Record<string, 'for' | 'against'>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub1 = subscribeToProposals((p) => {
      const all = [...INITIAL_PROPOSALS, ...p];
      const unique = Array.from(new Map(all.map(item => [item.id, item])).values());
      unique.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setProposals(unique);
      setLoading(false);
    });
    const unsub2 = subscribeToJurorStats(setJurorStats);
    
    let isSeeding = false;
    const checkAndSeed = async () => {
      if (isSeeding) return;
      isSeeding = true;
      try {
        if (!(await hasSeeded())) {
          console.log('Database uninitialized. Auto-seeding from governance...');
          await seedFirestore();
        }
      } catch (err) {
        console.error('Auto-seed check failed:', err);
      }
    };
    checkAndSeed();

    return () => { unsub1(); unsub2(); };
  }, []);

  const handleVote = async (proposalId: string, vote: 'for' | 'against') => {
    try {
      await voteOnProposal(proposalId, vote);
      setVotedProposals(prev => ({ ...prev, [proposalId]: vote }));
      toast.success(`Vote recorded: ${vote.toUpperCase()} on ${proposalId}`, {
        style: { 
          background: 'rgba(255, 255, 255, 0.04)', 
          color: '#E0E0FF', 
          border: '1px solid rgba(255, 255, 255, 0.08)', 
          backdropFilter: 'blur(20px)',
          fontFamily: 'Space Grotesk, sans-serif', 
          fontSize: '13px' 
        },
        iconTheme: { primary: '#00E5C3', secondary: '#060612' },
      });
    } catch (err) {
      console.error(err);
      toast.error('Failed to record vote.', {
        style: { 
          background: 'rgba(255, 255, 255, 0.04)', 
          color: '#EF4444', 
          border: '1px solid rgba(255, 255, 255, 0.08)', 
          backdropFilter: 'blur(20px)',
          fontFamily: 'Space Grotesk, sans-serif', 
          fontSize: '13px' 
        },
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-10">
        <h1 className="font-sans text-3xl font-bold text-[#E0E0FF] tracking-tight uppercase">DAO GOVERNANCE</h1>
        <p className="text-[#B0B0E0] font-mono text-[10px] mt-2 opacity-60 tracking-widest uppercase">NXF holders vote on protocol parameters. Your stake, your voice.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        {/* Left: Proposals */}
        <div className="space-y-6">
          <h2 className="font-mono text-[10px] font-bold text-[#6060A0] tracking-[0.2em] mb-4 uppercase">PROPOSALS</h2>
          
          {loading && (
            <div className="py-12 glass text-center">
              <p className="font-mono text-[10px] text-[#6060A0] animate-pulse uppercase tracking-widest">Hydrating proposals from chain...</p>
            </div>
          )}

          {!loading && proposals.length === 0 && (
            <div className="py-12 glass text-center border-dashed border-white/5">
              <p className="font-mono text-[10px] text-[#6060A0] uppercase tracking-widest">No active proposals — Protocol stable.</p>
            </div>
          )}
          
          {proposals.map((proposal, i) => (
            <div key={proposal.id} className="glass p-8 group relative overflow-hidden transition-all hover:bg-white/[0.06] opacity-0 animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="flex items-start justify-between gap-6 mb-4 relative z-10">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-[11px] text-brand-teal font-bold">{proposal.id}</span>
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${
                      proposal.status === 'active' ? 'bg-brand-amber/10 border-brand-amber/20 text-brand-amber' :
                      proposal.status === 'passed' ? 'bg-brand-teal/10 border-brand-teal/20 text-brand-teal' :
                      'bg-brand-pink/10 border-brand-pink/20 text-brand-pink'
                    }`}>
                      {proposal.status.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="font-sans text-lg font-bold text-[#E0E0FF] tracking-tight group-hover:text-brand-purple transition-colors">{proposal.title}</h3>
                </div>
              </div>
              
              <p className="font-sans text-sm text-[#B0B0E0] leading-relaxed mb-6 opacity-80 group-hover:opacity-100 transition-opacity italic">{proposal.description}</p>

              {/* Vote Tally */}
              <div className="space-y-4 mb-8 relative z-10">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[10px] text-brand-teal font-bold tracking-widest">SUPPORT (FOR)</span>
                    <span className="font-mono text-[10px] text-[#E0E0FF] font-bold">{proposal.votesFor}% · {(proposal.votesForNXF / 1000000).toFixed(1)}M NXF</span>
                  </div>
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-brand-teal to-[#8B85FF] rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(0,229,195,0.4)]" style={{ width: `${proposal.votesFor}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[10px] text-brand-pink font-bold tracking-widest">REJECT (AGAINST)</span>
                    <span className="font-mono text-[10px] text-[#E0E0FF] font-bold">{proposal.votesAgainst}% · {(proposal.votesAgainstNXF / 1000000).toFixed(1)}M NXF</span>
                  </div>
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-pink/40 rounded-full transition-all duration-1000" style={{ width: `${proposal.votesAgainst}%` }} />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-6 border-t border-white/5 relative z-10">
                {proposal.status === 'active' ? (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-amber pulse-dot" />
                      <span className="font-mono text-[10px] text-[#6060A0] font-bold uppercase tracking-widest">
                        Voting closes in {Math.max(0, Math.ceil((proposal.deadline.getTime() - Date.now()) / (1000 * 60 * 60)))}h
                      </span>
                    </div>
                    {votedProposals[proposal.id] ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-brand-teal/20 flex items-center justify-center">
                          <span className="text-brand-teal text-[8px] font-bold">✓</span>
                        </div>
                        <span className="font-mono text-[10px] text-brand-teal font-bold uppercase tracking-widest">
                          Cast {votedProposals[proposal.id].toUpperCase()}
                        </span>
                      </div>
                    ) : (
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleVote(proposal.id, 'for')}
                          className="px-6 py-2.5 rounded-xl text-[10px] font-mono font-bold tracking-widest bg-brand-teal/10 text-brand-teal border border-brand-teal/30 hover:bg-brand-teal/20 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase"
                        >
                          Cast FOR
                        </button>
                        <button
                          onClick={() => handleVote(proposal.id, 'against')}
                          className="px-6 py-2.5 rounded-xl text-[10px] font-mono font-bold tracking-widest bg-brand-pink/10 text-brand-pink border border-brand-pink/30 hover:bg-brand-pink/20 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase"
                        >
                          Cast AGAINST
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className={`font-mono text-[10px] font-bold uppercase tracking-widest ${
                      proposal.status === 'passed' ? 'text-brand-teal' : 'text-brand-pink'
                    }`}>
                      {proposal.status === 'passed' ? 'Execution Pending' : 'Proposal Rejected'}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-white/20" />
                    <span className="font-mono text-[10px] text-[#6060A0] font-bold uppercase tracking-tighter">
                      FINALIZED {proposal.createdAt.toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        {/* Right: Voting Power */}
        <div className="space-y-6">
          <h2 className="font-mono text-[10px] font-bold text-[#6060A0] tracking-[0.2em] mb-4 uppercase">YOUR VOICE</h2>
          
          <div className="glass p-8 space-y-8 sticky top-24 border-brand-purple/20 overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-purple/5 rounded-full blur-[60px] -mr-16 -mt-16 group-hover:bg-brand-purple/10 transition-all duration-700 pointer-events-none" />
            
            <div className="relative z-10">
              <p className="font-mono text-[9px] text-[#6060A0] font-bold uppercase tracking-widest mb-2">NXF Balance</p>
              <p className="font-sans text-3xl font-bold text-brand-amber tracking-tighter">{jurorStats.nxfBalance}</p>
            </div>
            <div className="relative z-10 border-t border-white/5 pt-6">
              <p className="font-mono text-[9px] text-[#6060A0] font-bold uppercase tracking-widest mb-2">LOCKED STATE</p>
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-[11px] text-[#E0E0FF] font-bold opacity-80 uppercase tracking-tighter">{jurorStats.nxfStaked} NXF STAKED</span>
                <span className="font-mono text-[11px] text-brand-teal font-bold">{jurorStats.nxfStaked} VOTES</span>
              </div>
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-brand-teal rounded-full shadow-[0_0_10px_rgba(0,229,195,0.3)]" style={{ width: '100%' }} />
              </div>
            </div>
            
            <div className="relative z-10 border-t border-white/5 pt-6">
              <p className="font-mono text-[9px] text-[#6060A0] font-bold uppercase tracking-widest mb-3">REPUTATION STANDING</p>
              <div className="flex items-center gap-4 mb-3">
                <div className="flex-1 h-3 bg-white/5 rounded-lg overflow-hidden p-[2px]">
                  <div className="h-full bg-gradient-to-r from-brand-teal via-brand-purple to-brand-pink rounded-md shadow-[0_0_10px_rgba(108,99,255,0.3)]" style={{ width: `${(jurorStats.reputationScore / jurorStats.maxReputation) * 100}%` }} />
                </div>
                <span className="font-sans text-xl font-bold text-brand-teal">{jurorStats.reputationScore}</span>
              </div>
              <p className="font-mono text-[9px] text-brand-purple font-bold uppercase tracking-widest text-right">Top {jurorStats.percentile}% JUROR</p>
            </div>

            <div className="relative z-10 border-t border-white/5 pt-6">
              <p className="font-mono text-[9px] text-[#6060A0] font-bold uppercase tracking-widest mb-3">DELEGATION IDENTITY</p>
              <div className="flex items-center gap-2 px-3 py-2 bg-brand-teal/5 border border-brand-teal/20 rounded-xl">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-teal" />
                <span className="font-mono text-[10px] text-brand-teal font-bold uppercase tracking-widest">Self-Delegated (Active)</span>
              </div>
            </div>

            {/* Actions */}
            <div className="relative z-10 space-y-3 pt-4">
              <button className="w-full py-4 rounded-xl bg-gradient-to-r from-brand-teal to-brand-purple text-[#060612] text-[10px] font-mono font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-brand-teal/10 uppercase tracking-widest">
                Increment Stake
              </button>
              <button className="w-full py-4 rounded-xl bg-white/5 text-[#B0B0E0] text-[10px] font-mono font-bold border border-white/10 hover:bg-white/10 transition-all uppercase tracking-widest">
                Update Delegation
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
