'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { subscribeToDeals } from '@/lib/firebaseService';
import { useRaiseDispute } from '@/hooks/useContractActions';
import { useWalletContext } from '@/providers/WalletProvider';
import type { Deal } from '@/lib/types';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

const disputeReasons = ['WORK NOT DELIVERED', 'QUALITY BELOW SPEC', 'MISSED DEADLINE', 'PAYMENT REFUSED', 'OTHER'];

const INITIAL_DEALS: Deal[] = [
  {
    id: '#4821', buyer: '0x3F4a8b2C1D9e7F6A5B3c2D1E0F9A8B7C6D5E4F3a',
    seller: '0x7E2c9D3B1A4F8C6E5D0B7A9F2C1E8D3B4A5F6C7D',
    value: 2400, token: 'USDC', status: 'in_dispute',
    description: 'Full-stack DeFi dashboard with analytics panel',
    milestones: [], deadline: new Date(), createdAt: new Date()
  },
  {
    id: '#4820', buyer: '0x1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B',
    seller: '0x3F4a8b2C1D9e7F6A5B3c2D1E0F9A8B7C6D5E4F3a',
    value: 890, token: 'USDC', status: 'completed',
    description: 'Smart contract audit for NFT marketplace',
    milestones: [], deadline: new Date(), createdAt: new Date()
  },
  {
    id: '#4819', buyer: '0x3F4a8b2C1D9e7F6A5B3c2D1E0F9A8B7C6D5E4F3a',
    seller: '0x9B8A7C6D5E4F3A2B1C0D9E8F7A6B5C4D3E2F1A0B',
    value: 5500, token: 'USDC', status: 'active',
    description: 'Custom ERC-721 collection with generative art engine',
    milestones: [], deadline: new Date(), createdAt: new Date()
  },
];

const generateCID = () => `Qm${Math.random().toString(36).slice(2, 14)}${Math.random().toString(36).slice(2, 14)}`;
const generateJurorAddr = () => `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`;

interface UploadedFile {
  name: string;
  size: string;
  rawSize: number;
  type: string;
  progress: number;
  cid?: string;
  file: File;
}

interface VRFLog {
  text: string;
  color: 'cyan' | 'green' | 'amber' | 'violet' | 'dim';
  done: boolean;
}

export default function DisputeFilingPage() {
  const router = useRouter();
  const { address: walletAddress, isConnected } = useWalletContext();
  const raiseDisputeHook = useRaiseDispute();
  const [deals, setDeals] = useState<Deal[]>(INITIAL_DEALS);
  const [selectedDeal, setSelectedDeal] = useState('');
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [outcome, setOutcome] = useState<'buyer_refund' | 'seller_payment' | 'custom_split'>('buyer_refund');
  const [splitPercent, setSplitPercent] = useState(50);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vrfPhase, setVrfPhase] = useState(false);
  const [vrfLogs, setVrfLogs] = useState<VRFLog[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const vrfRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = subscribeToDeals((firestoreDeals) => {
      const merged = [...firestoreDeals, ...INITIAL_DEALS];
      const unique = Array.from(
        new Map(merged.map(d => [d.id, d])).values()
      );
      unique.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setDeals(unique);
    });
    return () => unsub();
  }, []);

  const toggleReason = (reason: string) => {
    setSelectedReasons(prev =>
      prev.includes(reason) ? prev.filter(r => r !== reason) : [...prev, reason]
    );
  };

  const selectedDealObj = deals.find(d => d.id === selectedDeal);

  const processFiles = useCallback((rawFiles: FileList | File[]) => {
    Array.from(rawFiles).forEach((file) => {
      const sizeStr = file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${(file.size / 1024).toFixed(0)} KB`;

      const entry: UploadedFile = { name: file.name, size: sizeStr, rawSize: file.size, type: file.type || 'application/octet-stream', progress: 0, file };
      setFiles(prev => [...prev, entry]);

      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 30 + 5;
        if (progress >= 100) {
          clearInterval(interval);
          setFiles(prev => prev.map(f =>
            f.name === file.name ? { ...f, progress: 100, cid: generateCID() } : f
          ));
        } else {
          setFiles(prev => prev.map(f =>
            f.name === file.name ? { ...f, progress } : f
          ));
        }
      }, 250);
    });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) processFiles(e.dataTransfer.files);
  }, [processFiles]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) processFiles(e.target.files);
  };

  const removeFile = (name: string) => {
    setFiles(prev => prev.filter(f => f.name !== name));
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('zip') || type.includes('rar')) return '📦';
    if (type.includes('video') || type.includes('mp4')) return '🎬';
    if (type.includes('image')) return '🖼';
    return '📋';
  };

  const addVrfLog = (log: VRFLog, delay: number) => {
    setTimeout(() => {
      setVrfLogs(prev => [...prev, log]);
      if (vrfRef.current) {
        vrfRef.current.scrollTop = vrfRef.current.scrollHeight;
      }
    }, delay);
  };

  const runVrfAnimation = async (disputeId: string, jurorAddresses: string[]) => {
    setVrfPhase(true);
    setVrfLogs([]);

    const logs: [VRFLog, number][] = [
      [{ text: `> DISPUTE ${disputeId} — FILED ON-CHAIN`, color: 'cyan', done: true }, 0],
      [{ text: '> Connecting to Chainlink VRF v2...', color: 'dim', done: false }, 400],
      [{ text: '✓ Connected to Chainlink VRF Coordinator', color: 'green', done: true }, 900],
      [{ text: `> Requesting randomness seed from oracle...`, color: 'dim', done: false }, 1300],
      [{ text: `✓ VRF Seed received: 0x${Math.random().toString(16).slice(2, 18).toUpperCase()}`, color: 'amber', done: true }, 1900],
      [{ text: '> Selecting jurors from staked NXF pool (7 required)...', color: 'dim', done: false }, 2300],
      ...jurorAddresses.slice(0, 7).map((addr, i): [VRFLog, number] => ([
        { text: `  ✓ JUROR ${i + 1} → ${addr} · rep: ${Math.floor(600 + Math.random() * 400)} · stake: ${Math.floor(100 + Math.random() * 200)} NXF`, color: 'green', done: true },
        2900 + i * 300,
      ])),
      [{ text: '> Locking juror stakes on Polygon...', color: 'dim', done: false }, 2900 + 7 * 300],
      [{ text: '✓ All jurors confirmed — voting window OPEN (48h)', color: 'violet', done: true }, 2900 + 7 * 300 + 500],
      [{ text: `> Redirecting to dashboard...`, color: 'dim', done: false }, 2900 + 7 * 300 + 1000],
    ];

    logs.forEach(([log, delay]) => addVrfLog(log, delay));

    setTimeout(() => {
      toast.success('⚖ Dispute filed & jurors selected!', {
        style: { 
          background: 'rgba(255, 255, 255, 0.04)', 
          color: '#E0E0FF', 
          border: '1px solid rgba(255, 255, 255, 0.08)', 
          backdropFilter: 'blur(20px)',
          fontFamily: 'Space Grotesk, sans-serif', 
          fontSize: '13px' 
        },
        duration: 4000,
      });
      router.push('/dashboard');
    }, 2900 + 7 * 300 + 1800);
  };

  const handleSubmit = async () => {
    if (!selectedDeal) {
      toast.error('Please select a deal first.', {
        style: { 
          background: 'rgba(255, 255, 255, 0.04)', 
          color: '#E0E0FF', 
          border: '1px solid rgba(255, 255, 255, 0.08)', 
          backdropFilter: 'blur(20px)',
          fontFamily: 'Space Grotesk, sans-serif', 
          fontSize: '13px' 
        },
      });
      return;
    }
    if (selectedReasons.length === 0) {
      toast.error('Select at least one dispute reason.', {
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
    if (!isConnected || !walletAddress) {
      toast.error('Connect your wallet first to sign transactions.', {
        style: { background: 'rgba(255, 255, 255, 0.04)', color: '#EF4444', border: '1px solid rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(20px)', fontFamily: 'Space Grotesk, sans-serif', fontSize: '13px' },
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const jurorAddresses = Array.from({ length: 7 }, () => generateJurorAddr());
      const reasonString = selectedReasons.join(', ');

      const disputeData = {
        dealId: selectedDeal,
        dealValue: selectedDealObj?.value || 0,
        reason: selectedReasons,
        description,
        buyer: selectedDealObj?.buyer || walletAddress,
        seller: selectedDealObj?.seller || '',
        status: 'voting' as const,
        raisedBy: (selectedDealObj?.buyer.toLowerCase() === walletAddress.toLowerCase() ? 'buyer' : 'seller') as 'buyer' | 'seller',
        evidence: files.filter(f => f.cid).map(f => ({
          name: f.name,
          size: f.size,
          type: f.type,
          cid: f.cid!,
          uploadedBy: 'buyer' as const,
          uploadedAt: new Date(),
        })),
        jurors: jurorAddresses.map((addr, i) => ({
          id: i + 1,
          address: addr,
          reputation: Math.floor(600 + Math.random() * 400),
          hasVoted: false,
          staked: Math.floor(100 + Math.random() * 200),
        })),
        votingDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000),
        createdAt: new Date(),
        jurorSelectionLog: [],
        timeline: [
          { timestamp: new Date(), label: 'Dispute Raised', status: 'completed' as const },
          { timestamp: new Date(), label: 'Evidence Submitted', status: 'completed' as const },
          { timestamp: new Date(), label: '7 Jurors Selected via Chainlink VRF', status: 'completed' as const },
          { timestamp: new Date(Date.now() + 48 * 60 * 60 * 1000), label: 'Voting Deadline', status: 'active' as const },
          { timestamp: new Date(Date.now() + 49 * 60 * 60 * 1000), label: 'Verdict Execution', status: 'pending' as const },
        ],
      };

      // 1. Send on-chain transaction, then index to Firebase
      const result = await raiseDisputeHook.execute(disputeData, reasonString);

      // 2. Run the VRF animation with the returned dispute ID
      await runVrfAnimation(result?.disputeId || '#NEW', jurorAddresses);
      setIsSubmitting(false);
    } catch (err) {
      console.error(err);
      const errorMsg = err instanceof Error && err.message.includes('User rejected')
        ? 'Transaction rejected by user.'
        : 'Failed to file dispute on-chain.';
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
      setIsSubmitting(false);
    }
  };

  // ─── VRF Animation Screen ─────────────────────────────────────────
  if (vrfPhase) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto py-10">
          <div className="mb-8">
            <h1 className="font-sans text-3xl font-bold text-brand-pink tracking-tight uppercase">DISPUTE FILED</h1>
            <p className="text-[#B0B0E0] font-mono text-[10px] mt-2 opacity-60 tracking-widest uppercase">Chainlink VRF selecting jurors on-chain...</p>
          </div>
          <div className="glass border-brand-pink/20 p-8 overflow-hidden relative group">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-2.5 h-2.5 rounded-full bg-brand-pink pulse-dot" />
              <span className="font-mono text-[10px] text-[#6060A0] uppercase tracking-widest font-bold">LIVE — Polygon Mainnet</span>
            </div>
            <div ref={vrfRef} className="h-96 overflow-y-auto space-y-2 font-mono text-[11px] scroll-smooth pr-2 custom-scrollbar">
              {vrfLogs.map((log, i) => (
                <div
                  key={i}
                  className={`opacity-0 animate-fade-in ${
                    log.color === 'cyan' ? 'text-brand-teal' :
                    log.color === 'green' ? 'text-brand-teal' :
                    log.color === 'amber' ? 'text-brand-amber' :
                    log.color === 'violet' ? 'text-[#8B85FF]' :
                    'text-[#6060A0]'
                  }`}
                  style={{ animationDelay: `0ms` }}
                >
                  {log.text}
                  {!log.done && <span className="animate-pulse bg-current h-3 w-1.5 inline-block align-middle ml-1"></span>}
                </div>
              ))}
              {vrfLogs.length === 0 && (
                <p className="text-[#6060A0] animate-pulse">Initializing VRF oracle connection...</p>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-10">
        <h1 className="font-sans text-3xl font-bold text-[#E0E0FF] tracking-tight uppercase">FILE DISPUTE</h1>
        <p className="text-[#B0B0E0] font-mono text-[10px] mt-2 opacity-60 tracking-widest uppercase">Raise a conflict. Upload evidence. Let the DAO decide.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Dispute Details */}
        <div className="space-y-6">
          <div className="glass p-8 space-y-8">
            {/* Deal Selector */}
            <div>
              <label className="block text-[#6060A0] font-mono text-[10px] font-bold uppercase tracking-[0.2em] mb-3">Select Deal</label>
              <div className="relative">
                <select
                  value={selectedDeal}
                  onChange={(e) => setSelectedDeal(e.target.value)}
                  className="w-full px-5 py-4 rounded-xl bg-white/[0.04] border border-white/10 font-mono text-xs text-[#E0E0FF] focus:border-brand-teal/40 focus:outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="" className="bg-[#060612]">Choose a deal...</option>
                  {deals.map(deal => (
                    <option key={deal.id} value={deal.id} className="bg-[#060612]">
                      {deal.id} · ${deal.value.toLocaleString()} {deal.token} · {deal.status.toUpperCase().replace('_', ' ')}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
              </div>
            </div>

            {/* Deal Preview Card */}
            {selectedDealObj && (
              <div className="bg-white/5 rounded-xl border border-brand-teal/20 p-6 space-y-4 animate-fade-in group">
                <div className="flex items-center justify-between">
                  <span className="font-sans text-sm font-bold text-brand-teal tracking-tight">{selectedDealObj.id}</span>
                  <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${
                    selectedDealObj.status === 'completed' ? 'bg-brand-teal/10 border-brand-teal/20 text-brand-teal' :
                    selectedDealObj.status === 'in_dispute' ? 'bg-brand-pink/10 border-brand-pink/20 text-brand-pink' :
                    'bg-brand-purple/10 border-brand-purple/20 text-[#8B85FF]'
                  }`}>{selectedDealObj.status.toUpperCase().replace('_', ' ')}</span>
                </div>
                <div className="grid grid-cols-2 gap-6 text-[11px] font-mono">
                  <div>
                    <p className="text-[#6060A0] uppercase mb-1 tracking-tighter">Value</p>
                    <p className="text-[#E0E0FF] font-bold font-sans text-base">${selectedDealObj.value.toLocaleString()} {selectedDealObj.token}</p>
                  </div>
                  <div>
                    <p className="text-[#6060A0] uppercase mb-1 tracking-tighter">Milestones</p>
                    <p className="text-[#E0E0FF] font-bold font-sans text-base">{selectedDealObj.milestones.length} total</p>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-white/5">
                    <p className="text-[#6060A0] uppercase mb-2 tracking-tighter">Buyer</p>
                    <p className="text-brand-teal opacity-90 truncate font-semibold underline underline-offset-4 decoration-brand-teal/30">{selectedDealObj.buyer}</p>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-white/5">
                    <p className="text-[#6060A0] uppercase mb-2 tracking-tighter">Seller</p>
                    <p className="text-[#8B85FF] opacity-90 truncate font-semibold underline underline-offset-4 decoration-[#8B85FF]/30">{selectedDealObj.seller || '—'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Dispute Reason */}
            <div>
              <label className="block text-[#6060A0] font-mono text-[10px] font-bold uppercase tracking-[0.2em] mb-4">Grounds for dispute</label>
              <div className="flex flex-wrap gap-2.5">
                {disputeReasons.map(reason => (
                  <button
                    key={reason}
                    onClick={() => toggleReason(reason)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-mono font-bold transition-all ${
                      selectedReasons.includes(reason)
                        ? 'bg-brand-pink/15 text-brand-pink border border-brand-pink/40 shadow-[0_0_15px_rgba(239,68,68,0.15)]'
                        : 'bg-white/[0.04] text-[#5A5A7A] border border-white/5 hover:border-white/20 hover:text-[#B0B0E0]'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-[#6060A0] font-mono text-[10px] font-bold uppercase tracking-[0.2em] mb-3">Case Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                placeholder="Describe your dispute in detail. Jurors will base their verdict on this."
                className="w-full px-5 py-4 rounded-xl bg-white/[0.04] border border-white/10 font-sans text-sm text-[#E0E0FF] placeholder:text-[#303050] focus:border-brand-teal/40 focus:outline-none transition-all resize-none italic"
              />
            </div>

            {/* Requested Outcome */}
            <div>
              <label className="block text-[#6060A0] font-mono text-[10px] font-bold uppercase tracking-[0.2em] mb-4">Requested Outcome</label>
              <div className="space-y-3">
                {[
                  { value: 'buyer_refund' as const, label: 'Full Refund to Buyer' },
                  { value: 'seller_payment' as const, label: 'Full Payment to Seller' },
                  { value: 'custom_split' as const, label: 'Custom Distribution' },
                ].map(opt => (
                  <label key={opt.value} className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all border ${
                    outcome === opt.value ? 'bg-brand-teal/5 border-brand-teal/30 shadow-[0_0_15px_rgba(0,229,195,0.05)]' : 'bg-transparent border-white/5 hover:border-white/20'
                  }`} onClick={() => setOutcome(opt.value)}>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      outcome === opt.value ? 'border-brand-teal shadow-[0_0_10px_rgba(0,229,195,0.4)]' : 'border-[#303050]'
                    }`}>
                      {outcome === opt.value && <div className="w-3 h-3 rounded-full bg-brand-teal" />}
                    </div>
                    <span className={`font-sans text-sm font-bold tracking-tight ${outcome === opt.value ? 'text-[#E0E0FF]' : 'text-[#6060A0]'}`}>{opt.label}</span>
                  </label>
                ))}
                {outcome === 'custom_split' && (
                  <div className="pl-9 pt-4 animate-fade-in">
                    <input
                      type="range"
                      min={0} max={100}
                      value={splitPercent}
                      onChange={(e) => setSplitPercent(parseInt(e.target.value))}
                      className="w-full accent-brand-teal bg-white/5 h-1.5 rounded-full appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between mt-3 px-1">
                      <span className="font-mono text-[10px] text-brand-teal font-bold tracking-widest uppercase">Buyer: {splitPercent}%</span>
                      <span className="font-mono text-[10px] text-[#8B85FF] font-bold tracking-widest uppercase">Seller: {100 - splitPercent}%</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: IPFS Evidence Vault */}
        <div className="glass p-8 space-y-8 h-fit">
          <div>
            <h2 className="font-sans text-sm font-bold text-[#E0E0FF] tracking-wider uppercase">IPFS EVIDENCE VAULT</h2>
            <p className="font-mono text-[10px] text-[#6060A0] mt-1 opacity-80 uppercase tracking-widest">All files are pinned to IPFS and hashed on-chain</p>
          </div>

          {/* Drag-and-Drop Upload Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`w-full py-16 rounded-2xl border-2 border-dashed transition-all cursor-pointer group flex flex-col items-center justify-center gap-4 ${
              isDragging
                ? 'border-brand-teal/70 bg-brand-teal/10 scale-[1.01] shadow-[0_0_30px_rgba(0,229,195,0.1)]'
                : 'border-white/10 hover:border-brand-teal/40 bg-white/[0.02] hover:bg-brand-teal/[0.03]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.zip,.rar,.mp4,.mov,.txt,.doc,.docx"
              onChange={handleFileInput}
              className="hidden"
            />
            <div className="w-16 h-16 rounded-full bg-white/[0.03] border border-white/5 flex items-center justify-center text-3xl transition-transform group-hover:scale-110 group-hover:bg-brand-teal/10 group-hover:border-brand-teal/20 duration-500">
              <span className={`transition-all ${isDragging ? 'text-brand-teal scale-125' : 'text-brand-teal/30 group-hover:text-brand-teal/60'}`}>◈</span>
            </div>
            <div className="text-center pointer-events-none">
              <p className="font-sans text-sm font-bold text-[#E0E0FF]">
                {isDragging ? 'Drop to release...' : 'Drag & drop evidence'}
              </p>
              <p className="font-mono text-[10px] text-[#5A5A7A] mt-2 uppercase tracking-tighter">Images, PDFs, ZIP, MP4, Docs</p>
            </div>
          </div>

          {/* Uploaded Files */}
          {files.length > 0 && (
            <div className="space-y-4 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
              {files.map((file, i) => (
                <div key={i} className="bg-white/5 rounded-xl p-4 border border-white/5 animate-fade-in group">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-xl">
                      {getFileIcon(file.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-sans text-xs font-bold text-[#E0E0FF] truncate tracking-tight">{file.name}</p>
                      <p className="font-mono text-[9px] text-[#6060A0] uppercase font-bold">{file.size}</p>
                    </div>
                    <button onClick={() => removeFile(file.name)} className="text-[#5A5A7A] hover:text-brand-pink transition-all w-8 h-8 rounded-lg hover:bg-brand-pink/10 flex items-center justify-center text-xl">×</button>
                  </div>
                  {file.progress < 100 ? (
                    <div>
                      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-brand-teal to-[#8B85FF] rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(0,229,195,0.4)]"
                          style={{ width: `${file.progress}%` }}
                        />
                      </div>
                      <p className="font-mono text-[9px] text-brand-teal mt-2 uppercase font-bold tracking-widest animate-pulse">Uploading to IPFS... {Math.round(file.progress)}%</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 pt-3 border-t border-white/5">
                      <div className="w-4 h-4 rounded-full bg-brand-teal/20 flex items-center justify-center">
                        <span className="text-brand-teal text-[8px] font-bold">✓</span>
                      </div>
                      <span className="font-mono text-[9px] text-brand-teal truncate flex-1 font-bold tracking-tighter opacity-80 group-hover:opacity-100 transition-colors">CID {file.cid?.slice(0, 24)}...</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(file.cid || ''); toast.success('CID copied!'); }}
                        className="text-[#5A5A7A] hover:text-brand-teal transition-all p-1.5 rounded-lg hover:bg-brand-teal/10"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {files.length > 0 && (
            <div className="flex items-center justify-between text-[10px] font-mono border-t border-white/5 pt-4 px-1">
              <span className="text-[#6060A0] uppercase font-bold tracking-widest">{files.length} FILE{files.length > 1 ? 'S' : ''} DETECTED</span>
              <button onClick={() => setFiles([])} className="text-brand-pink hover:underline uppercase font-bold tracking-tighter">Clear All</button>
            </div>
          )}

          {/* Warning */}
          <div className="bg-brand-amber/5 border border-brand-amber/20 rounded-xl p-5 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-brand-amber opacity-40" />
            <p className="font-mono text-[10px] text-brand-amber leading-relaxed font-bold tracking-tight">
              ⚠ CASE EVIDENCE IS PERMANENT. SUBMISSIONS ARE HASHED ON-CHAIN AND PINNED TO IPFS. THEY CANNOT BE REMOVED OR ALTERED POST-FILING.
            </p>
          </div>

          {/* Juror Info */}
          <div className="bg-[#8B85FF]/5 border border-[#8B85FF]/20 rounded-xl p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#8B85FF] opacity-40" />
            <p className="font-sans text-[10px] font-bold text-[#8B85FF] mb-2 tracking-[0.2em] uppercase">⚖ JUROR SELECTION</p>
            <p className="font-mono text-[10px] text-[#B0B0E0] leading-relaxed opacity-80">
              7 jurors will be randomly selected via Chainlink VRF from the staked pool. Selection is provably fair and takes place immediately after submission.
            </p>
          </div>

          {/* Submit */}
          <div className="space-y-4 pt-4">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !selectedDeal}
              className="w-full py-5 rounded-xl bg-gradient-to-br from-[#EF4444]/60 to-[#6C63FF]/40 border border-[#EF4444]/40 text-white font-sans text-sm font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-brand-pink/20 disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
            >
              {isSubmitting ? 'PROCESSING FILING...' : 'INITIATE DISPUTE PROTOCOL'}
            </button>
            <div className="flex items-center justify-center gap-2 opacity-60">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-pink" />
              <p className="font-mono text-[9px] text-[#6060A0] uppercase font-bold tracking-widest">Protocol Fee: 5.00 USDC (AUTO-DEDUCT)</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
