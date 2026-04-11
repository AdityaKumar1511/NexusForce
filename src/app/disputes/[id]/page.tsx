'use client';

import React, { useEffect, useState, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import CountdownTimer from '@/components/ui/CountdownTimer';
import TransactionHash from '@/components/ui/TransactionHash';
import { subscribeToDisputes, uploadEvidenceFile } from '@/lib/firebaseService';
import type { Dispute } from '@/lib/types';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';

const generateCID = () => `Qm${Math.random().toString(36).slice(2, 14)}${Math.random().toString(36).slice(2, 14)}`;

export default function ActiveDisputePage() {
  const { id } = useParams();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = subscribeToDisputes((d) => {
      setDisputes(d);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const dispute = disputes.find(d => d.id === decodeURIComponent(id as string)) || null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !dispute) return;
    
    setUploading(true);
    const file = e.target.files[0];
    const sizeStr = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${(file.size / 1024).toFixed(0)} KB`;

    const toastId = toast.loading('Uploading evidence to IPFS...', {
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
      await uploadEvidenceFile(dispute.id, {
        name: file.name,
        size: sizeStr,
        type: file.type || 'application/octet-stream',
        cid: generateCID(),
        uploadedBy: 'buyer', // Simplified for demo
      });
      toast.dismiss(toastId);
      toast.success('✓ Evidence uploaded successfully!', {
        style: { 
          background: 'rgba(255, 255, 255, 0.04)', 
          color: '#00E5C3', 
          border: '1px solid rgba(255, 255, 255, 0.08)', 
          backdropFilter: 'blur(20px)',
          fontFamily: 'Space Grotesk, sans-serif', 
          fontSize: '13px' 
        },
      });
    } catch (err) {
      console.error(err);
      toast.dismiss(toastId);
      toast.error('Failed to upload evidence.', {
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
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <p className="font-mono text-xs text-nf-text-tertiary animate-pulse">Loading dispute data...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!dispute) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <span className="text-4xl text-nf-text-tertiary">⚖</span>
          <p className="font-orbitron text-sm text-nf-text-tertiary mt-4">DISPUTE NOT FOUND</p>
          <p className="font-mono text-xs text-nf-text-tertiary mt-2">Dispute ID: {id}</p>
        </div>
      </DashboardLayout>
    );
  }

  const votedCount = dispute.jurors.filter(j => j.hasVoted).length;
  const buyerVotes = dispute.jurors.filter(j => j.vote === 'buyer_wins').length;
  const sellerVotes = dispute.jurors.filter(j => j.vote === 'seller_wins').length;
  const splitVotes = dispute.jurors.filter(j => j.vote === 'split').length;

  return (
    <DashboardLayout>
      {/* Top Banner */}
      <div className="glass border-brand-pink/20 p-6 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 overflow-hidden relative">
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-xl bg-brand-pink/10 flex items-center justify-center text-2xl">⚖</div>
          <div>
            <h1 className="font-sans text-xl font-bold text-[#E0E0FF] tracking-tight whitespace-nowrap">
              DISPUTE {dispute.id} <span className="text-[#6060A0] mx-2">/</span> DEAL {dispute.dealId}
            </h1>
            <p className="font-mono text-[10px] text-brand-pink mt-1 tracking-[0.2em] font-bold uppercase">
              ${dispute.dealValue.toLocaleString()} USDC AT STAKE
            </p>
          </div>
        </div>
        <CountdownTimer targetDate={dispute.votingDeadline} label="VOTING ENDS IN" size="sm" />
      </div>

      {/* Three Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Case Details */}
        <div className="glass p-6 space-y-6 h-fit">
          <h2 className="font-mono text-[10px] font-bold text-[#6060A0] tracking-[0.2em] uppercase">Case Details</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-[#6060A0] uppercase">Buyer</span>
              <div className="flex items-center gap-2">
                <TransactionHash hash={dispute.buyer} />
                <span className="text-[8px] font-mono px-2 py-0.5 rounded-full border border-brand-teal/20 bg-brand-teal/10 text-brand-teal uppercase font-bold tracking-tighter">CLAIMANT</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-[#6060A0] uppercase">Seller</span>
              <div className="flex items-center gap-2">
                <TransactionHash hash={dispute.seller} />
                <span className="text-[8px] font-mono px-2 py-0.5 rounded-full border border-brand-purple/20 bg-brand-purple/10 text-[#8B85FF] uppercase font-bold tracking-tighter">RESPONDENT</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-[#6060A0] uppercase">Deal Value</span>
              <span className="font-sans text-base font-bold text-brand-teal">${dispute.dealValue.toLocaleString()} USDC</span>
            </div>
          </div>

          <div>
            <p className="font-mono text-[10px] text-[#6060A0] uppercase tracking-wider mb-3">Grounds for dispute</p>
            <div className="flex flex-wrap gap-2">
              {dispute.reason.map(r => (
                <span key={r} className="px-2 py-1 bg-brand-pink/10 border border-brand-pink/20 text-brand-pink text-[9px] font-mono font-bold rounded-md uppercase tracking-tight">{r}</span>
              ))}
            </div>
          </div>

          <div>
            <p className="font-mono text-[10px] text-[#6060A0] uppercase tracking-wider mb-3">Case Description</p>
            <p className="font-sans text-xs text-[#B0B0E0] leading-relaxed bg-white/[0.02] p-4 rounded-xl border border-white/5 italic opacity-80">
              &quot;{dispute.description || 'No description provided.'}&quot;
            </p>
          </div>

          <div>
            <p className="font-mono text-[10px] text-nf-text-tertiary uppercase mb-3">Timeline</p>
            <div className="space-y-0">
              {dispute.timeline.map((event, i) => (
                <div key={i} className="flex gap-3 relative">
                  {i < dispute.timeline.length - 1 && (
                    <div className="absolute left-[5px] top-[14px] w-[1px] h-full bg-[rgba(255,255,255,0.06)]" />
                  )}
                  <div className={`w-[11px] h-[11px] rounded-full border-2 mt-0.5 z-10 flex-shrink-0 ${
                    event.status === 'completed' ? 'border-nf-green bg-nf-green/20' :
                    event.status === 'active' ? 'border-nf-amber bg-nf-amber/20 animate-pulse-slow' :
                    'border-nf-text-tertiary bg-transparent'
                  }`} />
                  <div className="pb-4">
                    <p className={`font-mono text-xs ${
                      event.status === 'completed' ? 'text-nf-text-secondary' :
                      event.status === 'active' ? 'text-nf-amber' :
                      'text-nf-text-tertiary'
                    }`}>{event.label}</p>
                    <p className="font-code text-[9px] text-nf-text-tertiary mt-0.5 uppercase">
                      {event.timestamp.toLocaleDateString()} {event.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Column 2: Evidence Vault */}
        <div className="glass p-6 space-y-6 h-fit">
          <div className="flex items-center justify-between">
            <h2 className="font-mono text-[10px] font-bold text-[#6060A0] tracking-[0.2em] uppercase">Evidence Vault</h2>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-[10px] font-sans font-bold text-brand-teal hover:underline uppercase tracking-tighter transition-all"
              disabled={uploading}
            >
              {uploading ? 'WAITING...' : '+ Upload'}
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
          
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
            {dispute.evidence.length === 0 ? (
              <p className="font-mono text-[10px] text-[#5A5A7A] text-center py-12 uppercase tracking-widest bg-white/[0.01] rounded-xl border border-white/[0.03]">No evidence detected</p>
            ) : (
              dispute.evidence.map((file, i) => (
                <div key={i} className="bg-white/5 rounded-xl p-4 border border-white/5 group hover:border-brand-teal/30 hover:bg-white/[0.08] transition-all duration-300">
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-inner ${
                      file.type.includes('pdf') ? 'bg-brand-pink/10 text-brand-pink' :
                      file.type.includes('zip') ? 'bg-brand-amber/10 text-brand-amber' :
                      file.type.includes('video') ? 'bg-brand-purple/10 text-[#8B85FF]' :
                      'bg-brand-teal/10 text-brand-teal'
                    }`}>
                      {file.type.includes('pdf') ? '📄' :
                       file.type.includes('zip') ? '📦' :
                       file.type.includes('video') ? '🎬' : '📋'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-sans text-xs font-bold text-[#E0E0FF] truncate tracking-tight">{file.name}</p>
                      <p className="font-mono text-[9px] text-[#6060A0] uppercase font-semibold">{file.size}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2 pt-3 border-t border-white/5">
                    <span className={`text-[8px] font-mono px-2 py-0.5 rounded-full border ${
                      file.uploadedBy === 'buyer' ? 'bg-brand-teal/10 border-brand-teal/20 text-brand-teal' : 'bg-brand-purple/10 border-brand-purple/20 text-[#8B85FF]'
                    }`}>
                      {file.uploadedBy.toUpperCase()}
                    </span>
                    <button
                      onClick={() => { navigator.clipboard.writeText(file.cid); toast.success('CID copied!'); }}
                      className="font-mono text-[9px] text-brand-teal hover:underline opacity-50 group-hover:opacity-100 transition-all font-bold tracking-tighter"
                    >
                      CID {file.cid.slice(0, 10)}...
                    </button>
                    <button className="text-[9px] font-sans font-bold text-brand-teal hover:underline uppercase tracking-tighter">View</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 3: Jury Status */}
        <div className="glass p-6 space-y-6 h-fit">
          <h2 className="font-mono text-[10px] font-bold text-[#6060A0] tracking-[0.2em] uppercase">Jury Status</h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <p className="font-mono text-[10px] text-[#6060A0] uppercase tracking-widest">Election Quorum</p>
                <p className="font-sans text-2xl font-bold text-brand-amber tracking-tight">{votedCount}/7 <span className="text-[10px] text-[#5A5A7A] uppercase tracking-widest font-semibold">Decisions</span></p>
              </div>
              <p className="font-mono text-[9px] text-brand-amber animate-pulse font-bold tracking-[0.1em]">LIVE VOTING</p>
            </div>
            
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
              <div className="h-full bg-brand-amber rounded-full shadow-[0_0_10px_rgba(255,191,0,0.4)] transition-all duration-700" style={{ width: `${(votedCount / 7) * 100}%` }} />
            </div>
          </div>

          {/* Juror List */}
          <div className="space-y-3">
            {dispute.jurors.map((juror) => (
              <div key={juror.id} className="bg-white/5 rounded-xl p-4 border border-white/5 group hover:bg-white/[0.08] transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-sans text-[10px] font-bold text-[#6060A0] group-hover:text-brand-teal group-hover:border-brand-teal/30 transition-all">
                      {juror.id}
                    </div>
                    <span className="font-mono text-[10px] text-[#B0B0E0] tracking-tighter">{juror.address.slice(0, 8)}...{juror.address.slice(-6)}</span>
                  </div>
                  <span className={`text-[8px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                    juror.hasVoted ? 'bg-brand-teal/10 border-brand-teal/20 text-brand-teal' : 'bg-white/5 border-white/10 text-[#5A5A7A]'
                  }`}>
                    {juror.hasVoted ? 'VOTED' : 'PENDING'}
                  </span>
                </div>
                {/* Reputation Bar */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-teal/30 rounded-full group-hover:bg-brand-teal transition-all duration-500" style={{ width: `${(juror.reputation / 1000) * 100}%` }} />
                  </div>
                  <span className="font-mono text-[9px] text-[#5A5A7A] font-bold">{juror.reputation} REP</span>
                </div>
              </div>
            ))}
          </div>

          {/* Tally */}
          <div className="border-t border-white/5 pt-6">
            <h3 className="font-mono text-[9px] font-bold text-[#6060A0] tracking-[0.2em] uppercase mb-6">Real-time Tally</h3>
            <div className="space-y-5">
              {[
                { label: 'BUYER WINS', color: 'bg-brand-teal', textColor: 'text-brand-teal', votes: buyerVotes },
                { label: 'SELLER WINS', color: 'bg-[#8B85FF]', textColor: 'text-[#8B85FF]', votes: sellerVotes },
                { label: 'SPLIT 50/50', color: 'bg-brand-amber', textColor: 'text-brand-amber', votes: splitVotes },
              ].map((opt) => (
                <div key={opt.label}>
                  <div className="flex justify-between items-center mb-2">
                    <span className={`font-mono text-[10px] font-bold ${opt.textColor} uppercase tracking-tight`}>{opt.label}</span>
                    <span className="font-mono text-[10px] text-[#B0B0E0] font-bold">{opt.votes} VOTES</span>
                  </div>
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <div className={`h-full ${opt.color} rounded-full transition-all duration-700 shadow-lg`} style={{ width: `${(opt.votes / 7) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
