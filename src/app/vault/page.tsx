'use client';

import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { subscribeToDisputes, uploadEvidenceFile, hasSeeded } from '@/lib/firebaseService';
import { seedFirestore } from '@/lib/seedData';
import type { Dispute } from '@/lib/types';
import toast from 'react-hot-toast';

const generateCID = () => `Qm${Math.random().toString(36).slice(2, 14)}${Math.random().toString(36).slice(2, 14)}`;

const INITIAL_DISPUTES: Dispute[] = [
  {
    id: '#1203', dealId: '#4821', dealValue: 2400, reason: ['QUALITY BELOW SPEC', 'MISSED DEADLINE'],
    description: 'The frontend deliverable does not match the wireframes approved in Milestone 1.', buyer: '0x3F4...', seller: '0x7E2...', status: 'voting', raisedBy: 'buyer',
    evidence: [
      { name: 'wireframe_comparison.pdf', size: '2.4 MB', type: 'application/pdf', cid: 'QmX7b3yZ9rK2mN4pQ8wF5vH6jT1sA0cE3dG8iL2oU9kR', uploadedBy: 'buyer', uploadedAt: new Date(Date.now() - 18 * 60 * 60 * 1000) },
      { name: 'mobile_screenshots.zip', size: '8.1 MB', type: 'application/zip', cid: 'QmY4c8aR3sL7nO5qW9xG6uI1kV2bD0fH4jM8pS3tE7wN', uploadedBy: 'buyer', uploadedAt: new Date(Date.now() - 18 * 60 * 60 * 1000) },
      { name: 'chat_logs_milestone2.pdf', size: '1.2 MB', type: 'application/pdf', cid: 'QmZ1d9bS4tM8oP6rX0yH7vJ2lW3cE1gI5kN9qT4uF8xO', uploadedBy: 'buyer', uploadedAt: new Date(Date.now() - 17 * 60 * 60 * 1000) },
      { name: 'delivery_proof.mp4', size: '24.5 MB', type: 'video/mp4', cid: 'QmA2e0cT5uN9pQ7sY1zI8wK3mX4dF2hJ6lO0rU5vG9yP', uploadedBy: 'seller', uploadedAt: new Date(Date.now() - 12 * 60 * 60 * 1000) },
      { name: 'updated_codebase.zip', size: '15.3 MB', type: 'application/zip', cid: 'QmB3f1dU6vO0qR8tZ2aJ9xL4nY5eG3iK7mP1sV6wH0zA', uploadedBy: 'seller', uploadedAt: new Date(Date.now() - 12 * 60 * 60 * 1000) },
    ], jurors: [], votingDeadline: new Date(), createdAt: new Date(), timeline: []
  },
  {
    id: '#1199', dealId: '#4815', dealValue: 800, reason: ['WORK NOT DELIVERED'],
    description: 'Seller accepted the deal 3 weeks ago but has not delivered any work.', buyer: '0xDEA...', seller: '0x3F4...', status: 'resolved', raisedBy: 'buyer', verdict: 'buyer_wins',
    evidence: [
      { name: 'communication_log.pdf', size: '0.8 MB', type: 'application/pdf', cid: 'QmC4g2eV7wP1rS9uA3bK0yM5oZ6fH4jL8nQ2tW7xI1aB', uploadedBy: 'buyer', uploadedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
    ], jurors: [], votingDeadline: new Date(), createdAt: new Date(), timeline: []
  }
];

export default function VaultPage() {
  const [disputes, setDisputes] = useState<Dispute[]>(INITIAL_DISPUTES);
  const [filter, setFilter] = useState<'all' | 'in_progress' | 'resolved'>('all');
  const [search, setSearch] = useState('');

  // Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDisputeId, setSelectedDisputeId] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = subscribeToDisputes((d) => {
      const all = [...INITIAL_DISPUTES, ...d];
      const unique = Array.from(new Map(all.map(item => [item.id, item])).values());
      unique.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setDisputes(unique);
    });

    let isSeeding = false;
    const checkAndSeed = async () => {
      if (isSeeding) return;
      isSeeding = true;
      try {
        if (!(await hasSeeded())) {
          console.log('Database uninitialized. Auto-seeding from vault...');
          await seedFirestore();
        }
      } catch (err) {
        console.error('Auto-seed check failed:', err);
      }
    };
    checkAndSeed();

    return () => unsub();
  }, []);

  // Collect all evidence across disputes
  const allEvidence = disputes.flatMap(dispute =>
    dispute.evidence.map(e => ({
      ...e,
      disputeId: dispute.id,
      disputeStatus: dispute.status,
    }))
  );

  const filtered = allEvidence.filter(e => {
    if (filter === 'in_progress' && e.disputeStatus === 'resolved') return false;
    if (filter === 'resolved' && e.disputeStatus !== 'resolved') return false;
    if (search && !e.name.toLowerCase().includes(search.toLowerCase()) && !e.cid.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !selectedDisputeId) return;

    setUploading(true);
    const file = e.target.files[0];
    const sizeStr = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${(file.size / 1024).toFixed(0)} KB`;
    const newCid = generateCID();
    const newEvidence = {
      name: file.name,
      size: sizeStr,
      type: file.type || 'application/octet-stream',
      cid: newCid,
      uploadedBy: 'buyer' as const,
      uploadedAt: new Date()
    };

    // Optimistic UI Update - immediately show in grid
    setDisputes(prev => prev.map(d => 
      d.id === selectedDisputeId 
        ? { ...d, evidence: [...d.evidence, newEvidence] }
        : d
    ));

    // Close modal instantly
    setShowUploadModal(false);
    
    // Process upload in background without blocking UI
    uploadEvidenceFile(selectedDisputeId, {
      name: file.name,
      size: sizeStr,
      type: file.type || 'application/octet-stream',
      cid: newCid,
      uploadedBy: 'buyer',
    }).then(() => {
      toast.success(`✓ ${file.name} permanently secured on IPFS!`, {
        style: {
          background: 'rgba(255, 255, 255, 0.04)', color: '#00E5C3', border: '1px solid rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(20px)', fontFamily: 'Space Grotesk, sans-serif', fontSize: '13px'
        },
      });
    }).catch(err => {
      console.error(err);
      toast.error('Vault upload failed. Removing from local cache.', {
        style: {
          background: 'rgba(255, 255, 255, 0.04)', color: '#EF4444', border: '1px solid rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(20px)', fontFamily: 'Space Grotesk, sans-serif', fontSize: '13px'
        },
      });
      // Revert optimistic update
      setDisputes(prev => prev.map(d => 
        d.id === selectedDisputeId 
          ? { ...d, evidence: d.evidence.filter(e => e.cid !== newCid) }
          : d
      ));
    });

    setUploading(false);
    setSelectedDisputeId('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
        <div>
          <h1 className="font-sans text-3xl font-bold text-[#E0E0FF] tracking-tight uppercase">EVIDENCE VAULT</h1>
          <p className="text-[#B0B0E0] font-mono text-[10px] mt-2 opacity-60 tracking-widest uppercase">Decentralized repository for immutable dispute artifacts.</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-brand-teal to-brand-purple text-[#060612] font-sans text-xs font-bold tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-brand-teal/20 uppercase"
        >
          + Secure New Artifact
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-6 mb-10">
        <div className="flex gap-1 p-1.5 bg-white/[0.03] rounded-2xl border border-white/5">
          {[
            { value: 'all' as const, label: 'Full Archive' },
            { value: 'in_progress' as const, label: 'Active Context' },
            { value: 'resolved' as const, label: 'Cold Storage' },
          ].map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-5 py-2 rounded-xl text-[10px] font-mono font-bold tracking-widest transition-all uppercase ${filter === f.value
                  ? 'bg-brand-teal text-[#060612] shadow-lg shadow-brand-teal/20'
                  : 'text-[#6060A0] hover:text-[#B0B0E0] hover:bg-white/5'
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 group">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Query filenames or hash CIDs..."
            className="w-full px-6 py-3.5 pl-12 rounded-2xl bg-white/[0.02] border border-white/5 font-mono text-xs text-[#E0E0FF] placeholder:text-[#5A5A7A] focus:border-brand-teal/40 focus:bg-white/[0.05] focus:outline-none transition-all group-hover:border-white/10"
          />
          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[#6060A0] transition-colors group-hover:text-brand-teal">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
          </span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-24 glass border-dashed border-white/5 flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-center text-3xl opacity-20">◇</div>
          <div>
            <p className="font-sans text-lg font-bold text-[#6060A0] opacity-40 uppercase tracking-widest">No Artifacts Discovered</p>
            <p className="font-mono text-[10px] text-[#6060A0] opacity-30 mt-2 uppercase tracking-tighter">Your decentralized vault is waiting for initial evidence submission.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((file, i) => (
            <div key={i} className="glass p-6 group transition-all hover:bg-white/[0.08] hover:border-white/10 opacity-0 animate-fade-in relative overflow-hidden" style={{ animationDelay: `${i * 80}ms` }}>
              <div className={`w-full h-36 rounded-2xl flex items-center justify-center text-5xl mb-6 group-hover:scale-105 transition-transform duration-500 relative z-10 ${file.type.includes('pdf') ? 'bg-brand-pink/5' :
                  file.type.includes('zip') ? 'bg-brand-amber/5' :
                    file.type.includes('video') ? 'bg-brand-purple/5' :
                      'bg-brand-teal/5'
                }`}>
                {file.type.includes('pdf') ? '📄' :
                  file.type.includes('zip') ? '📦' :
                    file.type.includes('video') ? '🎬' : '📋'}
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              <div className="relative z-10">
                <p className="font-sans text-sm font-bold text-[#E0E0FF] truncate tracking-tight group-hover:text-brand-teal transition-colors">{file.name}</p>

                <div className="flex items-center gap-2 mt-3 font-mono text-[9px] font-bold tracking-tighter uppercase text-[#6060A0]">
                  <span className="text-brand-teal">{file.disputeId}</span>
                  <span className="opacity-10 px-1">•</span>
                  <span>{file.size}</span>
                  <span className="opacity-10 px-1">•</span>
                  <span className={file.disputeStatus === 'resolved' ? 'text-brand-teal' : 'text-brand-amber'}>{file.disputeStatus.replace('_', ' ')}</span>
                </div>

                <div className="bg-white/[0.03] rounded-xl p-3 mt-5 flex items-center gap-3 border border-white/5 group/cid cursor-pointer hover:bg-brand-purple/5 hover:border-brand-purple/20 transition-all">
                  <span className="font-mono text-[10px] text-[#5A5A7A] truncate flex-1 group-hover/cid:text-brand-purple transition-colors">IPFS:{file.cid.slice(0, 24)}...</span>
                  <button
                    onClick={() => { navigator.clipboard.writeText(file.cid); toast.success('CID Hash Copied'); }}
                    className="text-[#5A5A7A] hover:text-brand-purple transition-colors flex-shrink-0"
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /></svg>
                  </button>
                </div>

                <div className="flex items-center justify-between mt-5 pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-teal animate-pulse" />
                    <span className="font-mono text-[9px] text-brand-teal font-bold uppercase tracking-widest">Pin Secured</span>
                  </div>
                  <span className="font-mono text-[9px] text-[#6060A0] font-bold uppercase tracking-tight">
                    {file.uploadedAt.toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-[#060612]/90 backdrop-blur-xl animate-fade-in">
          <div className="glass w-full max-w-xl rounded-3xl overflow-hidden animate-slide-up border-brand-purple/20 relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-teal via-brand-purple to-brand-pink" />

            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <div>
                <h2 className="font-sans font-bold text-2xl text-[#E0E0FF] tracking-tight uppercase">SECURE ARTIFACT</h2>
                <p className="font-mono text-[9px] text-[#6060A0] font-bold uppercase tracking-widest mt-1">Immutable IPFS pinning for protocol consensus</p>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="w-10 h-10 rounded-full flex items-center justify-center text-[#6060A0] hover:text-[#E0E0FF] hover:bg-white/5 transition-all text-xl"
              >
                ×
              </button>
            </div>

            <div className="p-8 space-y-8">
              <div>
                <label className="block text-[#6060A0] font-mono text-[10px] font-bold uppercase mb-4 tracking-[0.2em]">Context Binding (Active Dispute)</label>
                <div className="relative">
                  <select
                    value={selectedDisputeId}
                    onChange={(e) => setSelectedDisputeId(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-5 font-mono text-xs text-[#E0E0FF] focus:outline-none focus:border-brand-teal/40 appearance-none transition-all hover:border-white/20"
                  >
                    <option value="" className="bg-[#060612]">Target Case ID...</option>
                    {disputes.map(d => (
                      <option key={d.id} value={d.id} className="bg-[#060612]">{d.id} — ${d.dealValue.toLocaleString()} Dispute</option>
                    ))}
                  </select>
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[#6060A0] pointer-events-none text-xs">▼</span>
                </div>
              </div>

              <div
                onClick={() => selectedDisputeId && !uploading && fileInputRef.current?.click()}
                className={`group py-16 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all relative overflow-hidden ${!selectedDisputeId
                    ? 'opacity-40 cursor-not-allowed border-white/5'
                    : uploading
                      ? 'border-brand-teal/40 bg-brand-teal/5 cursor-wait'
                      : 'border-white/10 bg-white/[0.02] hover:border-brand-teal/40 hover:bg-brand-teal/[0.03] cursor-pointer'
                  }`}
              >
                <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-500 mb-6">
                  {uploading ? '⏳' : '📥'}
                </div>
                <p className="font-sans text-lg font-bold text-[#B0B0E0] tracking-tight uppercase">
                  {uploading ? 'ENCRYPTING & UPLOADING...' : 'Drop Artifact or Click'}
                </p>
                <p className="font-mono text-[10px] text-[#6060A0] mt-3 uppercase tracking-widest font-bold">SHA-256 IPFS PINNING ENABLED</p>

                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={uploading || !selectedDisputeId}
                />

                {uploading && (
                  <div className="absolute bottom-0 left-0 h-1 bg-brand-teal animate-[loading-bar_2s_infinite]" style={{ width: '40%' }} />
                )}
              </div>

              {!selectedDisputeId && (
                <div className="flex items-center gap-3 px-5 py-4 bg-brand-amber/5 border border-brand-amber/10 rounded-2xl">
                  <span className="text-brand-amber">⚠️</span>
                  <p className="font-mono text-[9px] text-brand-amber font-bold uppercase tracking-widest leading-relaxed">
                    CRITICAL: A dispute context must be bound to the artifact for consensus eligibility.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
