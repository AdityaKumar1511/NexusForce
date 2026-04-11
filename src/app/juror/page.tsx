'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import CountdownTimer from '@/components/ui/CountdownTimer';
import { subscribeToDisputes, submitJurorVote, hasSeeded } from '@/lib/firebaseService';
import { seedFirestore } from '@/lib/seedData';
import type { Dispute } from '@/lib/types';
import toast from 'react-hot-toast';

const INITIAL_DISPUTES: Dispute[] = [
  {
    id: '#1203', dealId: '#4821', dealValue: 2400, reason: ['QUALITY BELOW SPEC', 'MISSED DEADLINE'],
    description: 'The frontend deliverable does not match the wireframes approved in Milestone 1.', buyer: '0x3F4a8b2C...', seller: '0x7E2c9D3B...', status: 'voting', raisedBy: 'buyer',
    evidence: [
      { name: 'wireframe_comparison.pdf', size: '2.4 MB', type: 'application/pdf', cid: 'QmX7b3yZ9rK2mN4pQ8wF5vH6jT1sA0cE3dG8iL2oU9kR', uploadedBy: 'buyer', uploadedAt: new Date() },
      { name: 'delivery_proof.mp4', size: '24.5 MB', type: 'video/mp4', cid: 'QmA2e0cT5uN9pQ7sY1zI8wK3mX4dF2hJ6lO0rU5vG9yP', uploadedBy: 'seller', uploadedAt: new Date() },
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
    votingDeadline: new Date(Date.now() + 31 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 16 * 60 * 60 * 1000),
    timeline: []
  }
];

export default function JurorPanelPage() {
  const [disputes, setDisputes] = useState<Dispute[]>(INITIAL_DISPUTES);
  const [selectedCase, setSelectedCase] = useState(0);
  const [selectedVerdict, setSelectedVerdict] = useState<string | null>(null);
  const [splitPercent, setSplitPercent] = useState(50);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToDisputes((d) => { 
      const all = [...INITIAL_DISPUTES, ...d];
      const unique = Array.from(new Map(all.map(item => [item.id, item])).values());
      unique.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      const votingDisputes = unique.filter(item => item.status === 'voting');
      setDisputes(votingDisputes); 
      setLoading(false); 
    });
    
    let isSeeding = false;
    const checkAndSeed = async () => {
      if (isSeeding) return;
      isSeeding = true;
      try {
        if (!(await hasSeeded())) {
          console.log('Database uninitialized. Auto-seeding from juror panel...');
          await seedFirestore();
        }
      } catch (err) {
        console.error('Auto-seed check failed:', err);
      }
    };
    checkAndSeed();

    return () => unsub();
  }, [disputes]);

  const dispute = disputes[selectedCase];

  const handleVoteSubmit = async () => {
    if (!dispute || !selectedVerdict) return;

    toast.loading('Submitting vote on-chain...', {
      style: { 
        background: 'rgba(255, 255, 255, 0.04)', 
        color: '#E0E0FF', 
        border: '1px solid rgba(255, 255, 255, 0.08)', 
        backdropFilter: 'blur(20px)',
        fontFamily: 'Space Grotesk, sans-serif', 
        fontSize: '13px' 
      },
      duration: 2000,
    });

    try {
      // Find first non-voted juror to simulate voting (demo mode)
      const jurorIndex = dispute.jurors.findIndex(j => !j.hasVoted);
      if (jurorIndex >= 0) {
        await submitJurorVote(dispute.id, jurorIndex, selectedVerdict as 'buyer_wins' | 'seller_wins' | 'split');
      }

      setTimeout(() => {
        toast.success('✓ Vote submitted! Your verdict has been recorded on-chain.', {
          style: { 
            background: 'rgba(255, 255, 255, 0.04)', 
            color: '#00E5C3', 
            border: '1px solid rgba(255, 255, 255, 0.08)', 
            backdropFilter: 'blur(20px)',
            fontFamily: 'Space Grotesk, sans-serif', 
            fontSize: '13px' 
          },
          iconTheme: { primary: '#00E5C3', secondary: '#060612' },
          duration: 4000,
        });
      }, 2500);
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit vote.', {
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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-20 glass">
          <p className="font-mono text-[10px] text-[#6060A0] animate-pulse tracking-[0.2em] uppercase">Hydrating juror panel from Polygon...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (disputes.length === 0) {
    return (
      <DashboardLayout>
        <div className="mb-10">
          <h1 className="font-sans text-3xl font-bold text-[#E0E0FF] tracking-tight uppercase">JUROR PANEL</h1>
          <p className="text-[#B0B0E0] font-mono text-[10px] mt-2 opacity-60 tracking-widest uppercase">Review evidence. Cast your verdict. Earn protocol rewards.</p>
        </div>
        <div className="text-center py-24 glass border-dashed border-white/5 flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-center text-3xl opacity-20">⚖</div>
          <div>
            <p className="font-sans text-lg font-bold text-[#6060A0] opacity-40 uppercase tracking-widest">No Cases Assigned</p>
            <p className="font-mono text-[10px] text-[#6060A0] opacity-30 mt-2 uppercase tracking-tighter">Your wallet has not been selected for any active disputes via VRF.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const assignedCases = disputes.map(d => ({
    dispute: d,
    status: (d.status === 'voting' ? 'vote_now' : 'voted') as 'vote_now' | 'voted',
    nxfAtStake: d.jurors.reduce((sum, j) => sum + j.staked, 0) / d.jurors.length || 150,
  }));

  return (
    <DashboardLayout>
      <div className="mb-10">
        <h1 className="font-sans text-3xl font-bold text-[#E0E0FF] tracking-tight uppercase">JUROR PANEL</h1>
        <p className="text-[#B0B0E0] font-mono text-[10px] mt-2 opacity-60 tracking-widest uppercase">Review evidence. Cast your verdict. Earn protocol rewards.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
        {/* Left: Assigned Cases */}
        <div className="space-y-6">
          <h2 className="font-mono text-[10px] font-bold text-[#6060A0] tracking-[0.2em] mb-4 uppercase">Assigned Caseload</h2>
          <div className="space-y-4">
            {assignedCases.map((c, i) => (
              <button
                key={i}
                onClick={() => setSelectedCase(i)}
                className={`w-full text-left glass p-5 transition-all group relative overflow-hidden ${
                  selectedCase === i
                    ? 'border-brand-teal/40 bg-white/[0.08] shadow-[0_0_20px_rgba(0,229,195,0.05)]'
                    : 'border-white/5 hover:bg-white/[0.04] opacity-70 hover:opacity-100'
                }`}
              >
                {selectedCase === i && <div className="absolute top-0 left-0 w-1 h-full bg-brand-teal" />}
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-[11px] text-brand-teal font-bold tracking-tighter uppercase">{c.dispute.id}</span>
                  <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${
                    c.status === 'vote_now'
                      ? 'bg-brand-amber/10 border-brand-amber/20 text-brand-amber'
                      : 'bg-brand-teal/10 border-brand-teal/20 text-brand-teal'
                  }`}>
                    {c.status === 'vote_now' ? 'VOTE REQ' : 'ARCHIVED'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="font-sans text-base font-bold text-[#E0E0FF] tracking-tight">${c.dispute.dealValue.toLocaleString()}</p>
                  <span className="font-mono text-[10px] text-[#6060A0] font-bold uppercase tracking-tighter">{Math.round(c.nxfAtStake)} NXF</span>
                </div>
                <div className="mt-4 pt-4 border-t border-white/5 group-hover:border-white/10 transition-colors">
                  <CountdownTimer targetDate={c.dispute.votingDeadline} size="sm" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Case Detail */}
        {dispute && (
          <div className="glass p-8 space-y-10 group/case relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-teal/5 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />
            
            <div className="flex items-center justify-between border-b border-white/5 pb-8 relative z-10">
              <div>
                <h2 className="font-sans text-xl font-bold text-[#E0E0FF] tracking-tight uppercase group-hover/case:text-brand-teal transition-colors duration-500">
                  Case {dispute.id} <span className="text-[#6060A0] mx-2">/</span> Deal {dispute.dealId}
                </h2>
                <div className="flex items-center gap-6 mt-3 font-mono text-[10px] font-bold uppercase tracking-widest text-[#6060A0]">
                   <span className="flex items-center gap-2">VALUE: <span className="text-brand-teal tracking-tighter">${dispute.dealValue.toLocaleString()} USDC</span></span>
                   <span className="opacity-20">•</span>
                   <span className="flex items-center gap-2">COMPLAINANT: <span className="text-brand-pink tracking-tighter">{dispute.raisedBy}</span></span>
                </div>
              </div>
              <div className="text-right">
                <CountdownTimer targetDate={dispute.votingDeadline} label="TIME REMAINING" size="sm" />
              </div>
            </div>

            {/* Juror Pool Panel */}
            <div className="relative z-10">
              <h3 className="font-mono text-[10px] font-bold text-[#6060A0] tracking-[0.2em] uppercase mb-6">Verified Juror Pool (7)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {dispute.jurors.map((juror) => (
                  <div key={juror.id} className="bg-white/5 rounded-2xl p-4 border border-white/5 flex items-center gap-4 transition-all hover:bg-white/[0.08] hover:border-white/10">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[11px] border-2 font-mono font-bold transition-all ${
                      juror.hasVoted ? 'bg-brand-teal/10 border-brand-teal/30 text-brand-teal shadow-[0_0_15px_rgba(0,229,195,0.1)]' : 'bg-white/[0.02] border-white/10 text-[#5A5A7A]'
                    }`}>
                      {juror.id.toString().padStart(2, '0')}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-[10px] text-[#E0E0FF] truncate font-bold opacity-80">{juror.address}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-brand-teal/60 rounded-full" style={{ width: `${(juror.reputation / 1000) * 100}%` }} />
                        </div>
                        <span className="font-mono text-[9px] text-[#6060A0] font-bold">{juror.reputation}R</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
              {/* Evidence */}
              <div className="space-y-6">
                <h3 className="font-mono text-[10px] font-bold text-[#6060A0] tracking-[0.2em] uppercase">Submitted Evidence</h3>
                <div className="space-y-3">
                  {dispute.evidence.map((file, i) => (
                    <div key={i} className="flex items-center gap-4 bg-white/[0.03] rounded-2xl p-4 border border-white/5 group/file hover:bg-white/[0.06] transition-all cursor-pointer">
                      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xl group-hover/file:scale-110 transition-transform duration-500">
                        {file.type.includes('pdf') ? '📄' :
                         file.type.includes('zip') ? '📦' :
                         file.type.includes('video') ? '🎬' : '📋'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-sans text-xs font-bold text-[#E0E0FF] truncate group-hover/file:text-brand-teal transition-colors">{file.name}</p>
                        <p className="font-mono text-[9px] text-[#6060A0] uppercase font-bold tracking-tighter mt-1">{file.size} · IPFS CID {file.cid.slice(0, 12)}...</p>
                      </div>
                      <button className="p-2 rounded-lg bg-white/5 text-[#5A5A7A] hover:text-brand-teal hover:bg-brand-teal/10 opacity-0 group-hover/file:opacity-100 transition-all">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/></svg>
                      </button>
                    </div>
                  ))}
                  {dispute.evidence.length === 0 && <p className="font-sans text-sm text-[#5A5A7A] py-8 border-2 border-dashed border-white/5 rounded-2xl text-center italic">No evidence artifacts discovered in this case.</p>}
                </div>
              </div>

              {/* Case Summary */}
              <div className="space-y-6">
                <h3 className="font-mono text-[10px] font-bold text-[#6060A0] tracking-[0.2em] uppercase">Context & Arguments</h3>
                <div className="bg-white/[0.03] rounded-2xl p-6 border border-white/5 space-y-6 relative overflow-hidden group/summary">
                  <div className="absolute top-0 left-0 w-1 h-full bg-brand-pink/40 group-hover/summary:bg-brand-pink transition-colors" />
                  <div>
                    <p className="font-mono text-[9px] text-[#6060A0] font-bold uppercase tracking-widest mb-3">Grounds / Issues</p>
                    <div className="flex flex-wrap gap-2">
                      {dispute.reason.map(r => (
                        <span key={r} className="px-3 py-1 bg-brand-pink/10 border border-brand-pink/20 text-brand-pink text-[9px] font-mono font-bold rounded-lg uppercase tracking-tight">{r}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="font-mono text-[9px] text-[#6060A0] font-bold uppercase tracking-widest mb-3">Complainant Statement</p>
                    <p className="font-sans text-sm text-[#B0B0E0] leading-relaxed italic opacity-80 group-hover/summary:opacity-100 transition-opacity">
                      &quot;{dispute.description}&quot;
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Voting Panel */}
            <div className="border-t border-white/5 pt-8 relative z-10">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-mono text-[10px] font-bold text-[#6060A0] tracking-[0.2em] uppercase">Select Final Verdict</h3>
                <div className="flex items-center gap-2 px-3 py-1 bg-brand-purple/10 border border-brand-purple/20 rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-purple pulse-dot" />
                  <span className="font-mono text-[9px] text-brand-purple font-bold tracking-widest uppercase">INCENTIVE: 25.0 NXF</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { value: 'buyer_wins', label: 'BUYER WINS', color: 'brand-teal', desc: 'Protocol defaults to full refund' },
                  { value: 'split', label: 'EQUITABLE SPLIT', color: 'brand-amber', desc: 'Manual resolution adjustment' },
                  { value: 'seller_wins', label: 'SELLER WINS', color: 'brand-purple', desc: 'Release escrow funds to seller' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setSelectedVerdict(opt.value)}
                    className={`p-6 rounded-2xl text-left transition-all border-2 relative overflow-hidden group/btn ${
                      selectedVerdict === opt.value
                        ? `bg-${opt.color}/10 border-${opt.color}/40 shadow-xl`
                        : `bg-white/[0.02] border-white/5 hover:border-white/20`
                    }`}
                  >
                    <span className={`block font-sans text-sm font-bold tracking-widest mb-1 transition-colors ${
                      selectedVerdict === opt.value ? `text-${opt.color}` : 'text-[#6060A0] group-hover/btn:text-[#B0B0E0]'
                    }`}>
                      {opt.label}
                    </span>
                    <span className="block font-mono text-[9px] text-[#5A5A7A] uppercase font-bold tracking-tighter opacity-80 group-hover/btn:opacity-100 transition-opacity">
                      {opt.desc}
                    </span>
                    {selectedVerdict === opt.value && <div className={`absolute top-0 right-0 w-16 h-16 bg-${opt.color}/10 rounded-full blur-2xl -mr-8 -mt-8`} />}
                  </button>
                ))}
              </div>

              {selectedVerdict === 'split' && (
                <div className="mt-6 p-6 glass border-brand-amber/30 animate-fade-in shadow-inner">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-mono text-[10px] text-[#6060A0] font-bold uppercase tracking-[0.2em]">Escrow Distribution</span>
                    <span className="font-bold font-sans text-sm text-brand-amber tracking-[0.1em] bg-brand-amber/10 px-3 py-1 rounded-full border border-brand-amber/20">{splitPercent}% / {100-splitPercent}%</span>
                  </div>
                  <input type="range" min={0} max={100} value={splitPercent} onChange={(e) => setSplitPercent(parseInt(e.target.value))} className="w-full h-1.5 bg-white/5 rounded-full appearance-none accent-brand-amber cursor-pointer" />
                  <div className="flex justify-between mt-4 font-mono text-[9px] text-[#6060A0] font-bold uppercase tracking-widest">
                    <span>Refund to Buyer</span>
                    <span>Payout to Seller</span>
                  </div>
                </div>
              )}

              <div className="mt-10 space-y-4">
                <button
                  onClick={handleVoteSubmit}
                  disabled={!selectedVerdict}
                  className="w-full py-5 rounded-2xl bg-gradient-to-r from-brand-teal to-brand-purple text-[#060612] font-sans text-sm font-bold tracking-widest hover:scale-[1.01] active:scale-[0.99] transition-all shadow-xl shadow-brand-teal/20 disabled:opacity-30 disabled:scale-100 disabled:shadow-none uppercase"
                >
                  Verify & Commit Verdict
                </button>
                <div className="flex items-center justify-center gap-3 text-[9px] font-mono text-[#6060A0] font-bold uppercase tracking-[0.2em] opacity-60">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  ON-CHAIN INTEGRITY SECURED
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
