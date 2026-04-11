'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useSignDeal } from '@/hooks/useContractActions';
import { useWalletContext } from '@/providers/WalletProvider';
import { createDeal as indexCreateDeal } from '@/lib/firebaseService';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface MilestoneInput {
  title: string;
  percentage: number;
  deadline: string;
}

const steps = ['PARTIES', 'MILESTONES', 'PAYMENT', 'REVIEW & SIGN'];

export default function CreateDealPage() {
  const router = useRouter();
  const { address: walletAddress, isConnected } = useWalletContext();
  const signDealHook = useSignDeal();
  const [currentStep, setCurrentStep] = useState(0);
  const [role, setRole] = useState<'buyer' | 'seller'>('buyer');
  const [counterparty, setCounterparty] = useState('');
  const [milestones, setMilestones] = useState<MilestoneInput[]>([
    { title: '', percentage: 50, deadline: '' },
    { title: '', percentage: 50, deadline: '' },
  ]);
  const [token, setToken] = useState('USDC');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdDealId, setCreatedDealId] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const addMilestone = () => {
    setMilestones([...milestones, { title: '', percentage: 0, deadline: '' }]);
  };

  const removeMilestone = (index: number) => {
    if (milestones.length > 1) {
      setMilestones(milestones.filter((_, i) => i !== index));
    }
  };

  const updateMilestone = (index: number, field: keyof MilestoneInput, value: string | number) => {
    const updated = [...milestones];
    updated[index] = { ...updated[index], [field]: value };
    setMilestones(updated);
  };

  const handleSign = async () => {
    if (!isConnected || !walletAddress) {
      toast.error('Connect your wallet first to sign transactions.', {
        style: { background: 'rgba(255, 255, 255, 0.04)', color: '#EF4444', border: '1px solid rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(20px)', fontFamily: 'Space Grotesk, sans-serif', fontSize: '13px' },
      });
      return;
    }

    setIsSubmitting(true);
    setIsSuccess(false);
    toast.dismiss(); // dismiss any overlaps
    const toastId = toast.loading('🔐 Sign typed data to propose the deal...', {
      style: { 
        background: 'rgba(255, 255, 255, 0.04)', color: '#E0E0FF', border: '1px solid rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(20px)', fontFamily: 'Space Grotesk, sans-serif', fontSize: '13px' 
      },
    });

    const hardTimeout = setTimeout(() => {
      toast.dismiss(toastId);
      toast.loading('Pending confirmation...', { id: toastId, duration: 2000, style: { background: 'rgba(255, 255, 255, 0.04)', color: '#E0E0FF', border: '1px solid rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(20px)', fontFamily: 'Space Grotesk, sans-serif', fontSize: '13px' }});
    }, 3000);

    try {
      const buyer = role === 'buyer' ? walletAddress : (counterparty || '0x0000000000000000000000000000000000000000');
      const seller = role === 'seller' ? walletAddress : (counterparty || '0x0000000000000000000000000000000000000000');

      const lastDeadline = milestones
        .filter(m => m.deadline)
        .map(m => new Date(m.deadline))
        .sort((a, b) => b.getTime() - a.getTime())[0] || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      const dealId = `#${Math.floor(4800 + Math.random() * 200)}`;

      // 1. Create deal in DB
      await indexCreateDeal({
        id: dealId,
        buyer,
        seller,
        value: parseFloat(amount) || 0,
        token,
        status: 'pending_signatures',
        description,
        deadline: lastDeadline,
        createdAt: new Date(),
        milestones: milestones.map(m => ({
          title: m.title || 'Untitled Milestone',
          percentage: m.percentage,
          status: 'pending' as const,
          deadline: m.deadline ? new Date(m.deadline) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        })),
      });

      // 2. Sign the data (also saves signature to DB via hook)
      const signature = await signDealHook.execute(dealId, amount || '0', buyer, seller, role);

      clearTimeout(hardTimeout);
      toast.dismiss(toastId);
      
      setTxHash(signature);
      setCreatedDealId(dealId);
      setIsSuccess(true); 
      setIsSubmitting(false);

      setTimeout(() => {
        router.push('/dashboard');
      }, 3000);
    } catch (err) {
      clearTimeout(hardTimeout);
      console.error(err);
      toast.dismiss(toastId);
      const errorMsg = err instanceof Error && err.message.includes('rejected')
        ? 'Signature rejected by user.'
        : 'Failed to create deal off-chain.';
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

  const totalPercentage = milestones.reduce((sum, m) => sum + m.percentage, 0);
  const amountNum = parseFloat(amount) || 0;

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        {createdDealId ? (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-24 h-24 bg-brand-teal/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-brand-teal/30 shadow-[0_0_30px_rgba(0,229,195,0.2)]">
              <span className="text-4xl text-brand-teal">✓</span>
            </div>
            <h1 className="font-sans text-4xl font-bold text-[#E0E0FF] tracking-tight mb-3">DEAL PROPOSED</h1>
            <p className="font-mono text-[11px] text-[#B0B0E0] opacity-60 uppercase tracking-[0.2em] mb-10">Awaiting counterparty signature</p>
            <div className="glass p-8 max-w-lg mx-auto mb-10 text-left space-y-4 border-brand-teal/20">
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <span className="font-mono text-[10px] text-[#6060A0] uppercase tracking-widest font-bold">Deal Reference</span>
                <p className="font-mono text-sm text-brand-teal font-bold">{createdDealId}</p>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="font-mono text-[10px] text-[#6060A0] uppercase tracking-widest font-bold">Your Signature</span>
                <p className="font-mono text-xs text-[#E0E0FF]/80 truncate max-w-[200px]">{txHash}</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3">
              <div className="w-2 h-2 rounded-full bg-brand-teal pulse-dot" />
              <p className="font-mono text-[10px] text-[#6060A0] uppercase tracking-widest font-bold">Redirecting to dashboard in 3 seconds...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="mb-10">
              <h1 className="font-sans text-3xl font-bold text-[#E0E0FF] tracking-tight uppercase">CREATE DEAL</h1>
              <p className="text-[#B0B0E0] font-mono text-[10px] mt-2 opacity-60 tracking-widest uppercase">Lock funds in trustless escrow — backed by smart contracts</p>
            </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-3 mb-12">
          {steps.map((step, i) => (
            <React.Fragment key={i}>
              <button
                onClick={() => setCurrentStep(i)}
                className={`flex items-center gap-3 px-5 py-2.5 rounded-xl text-[10px] font-mono font-bold tracking-widest transition-all ${
                  i === currentStep
                    ? 'bg-brand-teal/10 text-brand-teal border border-brand-teal/30 shadow-[0_0_15px_rgba(0,229,195,0.1)] scale-105'
                    : i < currentStep
                      ? 'bg-brand-teal/5 text-brand-teal/60 border border-brand-teal/10'
                      : 'bg-white/[0.02] text-[#5A5A7A] border border-white/5 opacity-60'
                }`}
              >
                <div className={`w-5 h-5 rounded-lg flex items-center justify-center text-[9px] ${
                  i === currentStep ? 'bg-brand-teal text-[#060612]' :
                  i < currentStep ? 'bg-brand-teal/20 text-brand-teal' :
                  'bg-white/5 text-[#5A5A7A]'
                }`}>
                  {i < currentStep ? '✓' : i + 1}
                </div>
                <span className="hidden sm:inline uppercase">{step}</span>
              </button>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-[1px] min-w-[20px] ${i < currentStep ? 'bg-brand-teal/30' : 'bg-white/5'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
          {/* Main Form */}
          <div className="glass p-8">
            {/* Step 1: Parties */}
            {currentStep === 0 && (
              <div className="space-y-8 animate-fade-in shadow-inner">
                <div>
                  <label className="block text-[#6060A0] font-mono text-[10px] font-bold uppercase tracking-[0.2em] mb-3">Your Secure Identity</label>
                  <div className="w-full px-5 py-4 rounded-xl bg-white/[0.04] border border-white/5 font-mono text-xs text-[#6060A0] opacity-80 shadow-inner">
                    {isConnected && walletAddress ? walletAddress : <span className="text-brand-pink">Wallet not connected — connect via navbar</span>}
                  </div>
                </div>
                <div>
                  <label className="block text-[#6060A0] font-mono text-[10px] font-bold uppercase tracking-[0.2em] mb-3">Counterparty Address</label>
                  <input
                    type="text"
                    value={counterparty}
                    onChange={(e) => setCounterparty(e.target.value)}
                    placeholder="0x... or ENS / Lens name"
                    className="w-full px-5 py-4 rounded-xl bg-white/[0.04] border border-white/10 font-mono text-xs text-[#E0E0FF] placeholder:text-[#303050] focus:border-brand-teal/40 focus:outline-none transition-all shadow-inner"
                  />
                </div>
                <div>
                  <label className="block text-[#6060A0] font-mono text-[10px] font-bold uppercase tracking-[0.2em] mb-4">Your Primary Role</label>
                  <div className="flex gap-4">
                    {(['buyer', 'seller'] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => setRole(r)}
                        className={`flex-1 py-4 rounded-xl text-[10px] font-mono font-bold tracking-[0.1em] transition-all border ${
                          role === r
                            ? 'bg-brand-teal/10 text-brand-teal border-brand-teal/40 shadow-[0_0_15px_rgba(0,229,195,0.05)]'
                            : 'bg-white/[0.02] text-[#5A5A7A] border-white/5 hover:border-white/20'
                        }`}
                      >
                        {r.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[#6060A0] font-mono text-[10px] font-bold uppercase tracking-[0.2em] mb-3">Service Scope / Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    placeholder="Provide a detailed overview of the agreed deliverables..."
                    className="w-full px-5 py-4 rounded-xl bg-white/[0.04] border border-white/10 font-sans text-sm text-[#E0E0FF] placeholder:text-[#303050] focus:border-brand-teal/40 focus:outline-none transition-all resize-none italic shadow-inner"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Milestones */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-fade-in">
                {milestones.map((milestone, i) => (
                  <div key={i} className="bg-white/5 rounded-2xl border border-white/5 p-6 relative group overflow-hidden transition-all hover:bg-white/[0.08]">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-brand-teal/10 flex items-center justify-center font-sans font-bold text-xs text-brand-teal shadow-inner">
                          {i + 1}
                        </div>
                        <span className="font-mono text-[10px] font-bold text-[#B0B0E0] uppercase tracking-widest">Protocol Milestone</span>
                      </div>
                      {milestones.length > 1 && (
                        <button onClick={() => removeMilestone(i)} className="text-[#5A5A7A] hover:text-brand-pink transition-all w-8 h-8 rounded-lg hover:bg-brand-pink/10 flex items-center justify-center text-xl">×</button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={milestone.title}
                      onChange={(e) => updateMilestone(i, 'title', e.target.value)}
                      placeholder="Defining deliverable title (e.g. UI/UX Prototype)"
                      className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/5 font-sans text-sm text-[#E0E0FF] placeholder:text-[#303050] focus:border-brand-teal/40 focus:outline-none transition-all mb-6 italic shadow-inner"
                    />
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[#6060A0] font-mono text-[9px] font-bold uppercase tracking-[0.2em] mb-2 uppercase">Target Deadline</label>
                        <input
                          type="date"
                          value={milestone.deadline}
                          onChange={(e) => updateMilestone(i, 'deadline', e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 font-mono text-xs text-[#E0E0FF] focus:border-brand-teal/40 focus:outline-none transition-all shadow-inner"
                        />
                      </div>
                      <div>
                        <label className="block text-[#6060A0] font-mono text-[9px] font-bold uppercase tracking-[0.2em] mb-2 uppercase">Payment Logic %</label>
                        <div className="relative">
                          <input
                            type="number"
                            value={milestone.percentage}
                            onChange={(e) => updateMilestone(i, 'percentage', parseInt(e.target.value) || 0)}
                            min={0} max={100}
                            className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 font-sans font-bold text-sm text-[#E0E0FF] focus:border-brand-teal/40 focus:outline-none transition-all shadow-inner pr-10"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-[10px] text-brand-teal font-bold">%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <button onClick={addMilestone} className="w-full py-5 rounded-2xl border-2 border-dashed border-white/5 text-[#6060A0] font-mono text-[10px] font-bold tracking-[0.2em] hover:border-brand-teal/30 hover:text-brand-teal hover:bg-brand-teal/[0.02] transition-all uppercase">
                  + Add Protocol Milestone
                </button>
                {totalPercentage !== 100 && (
                  <div className="flex items-center gap-2 px-4 py-3 bg-brand-pink/5 border border-brand-pink/20 rounded-xl relative">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-pink pulse-dot" />
                    <p className="text-brand-pink text-[10px] font-mono font-bold uppercase tracking-widest">Logic Error: Total Allocation must equal 100% (Present: {totalPercentage}%)</p>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Payment */}
            {currentStep === 2 && (
              <div className="space-y-8 animate-fade-in shadow-inner">
                <div>
                  <label className="block text-[#6060A0] font-mono text-[10px] font-bold uppercase tracking-[0.2em] mb-4">Settlement Asset</label>
                  <div className="grid grid-cols-3 gap-4">
                    {['USDC', 'USDT', 'MATIC'].map((t) => (
                      <button
                        key={t}
                        onClick={() => setToken(t)}
                        className={`py-4 rounded-xl text-[10px] font-mono font-bold tracking-[0.1em] transition-all border ${
                          token === t
                            ? 'bg-brand-teal/10 text-brand-teal border-brand-teal/40 shadow-[0_0_15px_rgba(0,229,195,0.05)] shadow-inner'
                            : 'bg-white/[0.02] text-[#5A5A7A] border-white/5 hover:border-white/20'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[#6060A0] font-mono text-[10px] font-bold uppercase tracking-[0.2em] mb-4">Locked Deal Amount</label>
                  <div className="relative group">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-6 py-6 rounded-2xl bg-white/[0.04] border border-white/10 font-sans text-4xl font-bold text-[#E0E0FF] placeholder:text-[#303050] focus:border-brand-teal/40 focus:outline-none transition-all shadow-inner"
                    />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 font-sans font-bold text-2xl text-brand-teal group-focus-within:shadow-[0_0_20px_rgba(0,229,195,0.4)] transition-all">
                      {token}
                    </div>
                  </div>
                  {amountNum > 0 && (
                    <div className="mt-4 flex items-center justify-between px-1 opacity-60">
                      <p className="font-mono text-[10px] text-[#6060A0] font-bold uppercase tracking-widest">Global Est. Value</p>
                      <p className="font-sans text-sm font-bold text-[#B0B0E0]">₹{(amountNum * 83.4).toLocaleString()} INR</p>
                    </div>
                  )}
                </div>
                <div className="bg-white/5 rounded-2xl p-6 border border-white/5 space-y-3 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-brand-teal/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-brand-teal/10 transition-all duration-700" />
                  <div className="flex justify-between items-center relative z-10">
                    <span className="font-mono text-[10px] text-[#6060A0] uppercase tracking-widest font-bold">Protocol Gas (Est.)</span>
                    <span className="font-mono text-[11px] text-[#E0E0FF] opacity-60 uppercase">~0.002 MATIC</span>
                  </div>
                  <div className="flex justify-between items-center relative z-10">
                    <span className="font-mono text-[10px] text-[#6060A0] uppercase tracking-widest font-bold">Platform Fee (1.5%)</span>
                    <span className="font-mono text-[11px] text-brand-teal font-bold uppercase">{(amountNum * 0.015).toFixed(2)} {token}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Review & Sign */}
            {currentStep === 3 && (
              <div className="space-y-8 animate-fade-in">
                <div className="bg-white/5 rounded-2xl p-8 border border-white/10 space-y-6 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-brand-teal/5 rounded-full blur-[80px] -mr-24 -mt-24 group-hover:bg-brand-teal/10 transition-all duration-1000" />
                  
                  <div className="flex justify-between items-center relative z-10 border-b border-white/5 pb-4">
                    <span className="font-mono text-[10px] text-[#6060A0] uppercase tracking-widest font-bold">System Buyer</span>
                    <span className="font-mono text-xs text-brand-teal font-bold">{role === 'buyer' ? 'YOU (Initiator)' : 'COUNTERPARTY'}</span>
                  </div>
                  <div className="flex justify-between items-center relative z-10 border-b border-white/5 pb-4">
                    <span className="font-mono text-[10px] text-[#6060A0] uppercase tracking-widest font-bold">System Seller</span>
                    <span className="font-mono text-xs text-[#8B85FF] font-bold">{role === 'seller' ? 'YOU (Initiator)' : 'COUNTERPARTY'}</span>
                  </div>
                  <div className="flex justify-between items-center relative z-10 border-b border-white/5 pb-4">
                    <span className="font-mono text-[10px] text-[#6060A0] uppercase tracking-widest font-bold">Protocol Value</span>
                    <span className="font-sans text-xl font-bold text-brand-teal">{amountNum.toLocaleString()} {token}</span>
                  </div>
                  
                  <div className="space-y-4 relative z-10 pt-2">
                    <p className="font-mono text-[10px] text-[#6060A0] uppercase tracking-[0.2em] font-bold">Execution Plan:</p>
                    {milestones.map((m, i) => (
                      <div key={i} className="flex items-center justify-between py-3 px-4 bg-white/[0.03] rounded-xl border border-white/5 group-hover:border-brand-teal/20 transition-all">
                        <span className="font-sans text-xs font-bold text-[#E0E0FF] tracking-tight">{m.title || `Phase ${i + 1}`}</span>
                        <div className="text-right">
                          <span className="font-mono text-[10px] text-brand-amber font-bold">{m.percentage}%</span>
                          <span className="font-mono text-[10px] text-[#6060A0] ml-2 font-bold select-none opacity-40">→</span>
                          <span className="font-mono text-[10px] text-[#B0B0E0] ml-2 font-bold uppercase tracking-tighter">{((amountNum * m.percentage) / 100).toFixed(2)} {token}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-4 p-5 bg-brand-amber/5 border border-brand-amber/10 rounded-2xl relative shadow-inner">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-amber mt-1.5 pulse-dot" />
                  <p className="text-[#B0B0E0] font-sans text-xs leading-relaxed opacity-80 italic">
                    &quot;By signing, you authorize the NexusForce protocol to lock these parameters into the Polygon network. Terms are Immutable once shared with counterparty.&quot;
                  </p>
                </div>

                <button
                  onClick={handleSign}
                  disabled={isSubmitting || isSuccess}
                  className={`w-full py-5 rounded-2xl font-sans text-sm font-bold transition-all shadow-xl disabled:scale-100 uppercase tracking-widest ${
                    isSuccess 
                      ? 'bg-brand-teal text-[#060612] shadow-brand-teal/20' 
                      : 'bg-gradient-to-r from-brand-teal to-[#8B85FF] text-[#060612] hover:scale-[1.02] active:scale-[0.98] shadow-brand-teal/20 disabled:opacity-50 disabled:shadow-none'
                  }`}
                >
                  {isSuccess ? 'DEAL SENT ✓' : isSubmitting ? 'PROPOSING DEAL...' : 'SIGN & PROPOSE DEAL'}
                </button>
              </div>
            )}

            {/* Step Navigation */}
            <div className="flex justify-between mt-12 pt-8 border-t border-white/5 relative z-10">
              <button
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                className="px-8 py-3 rounded-xl text-[10px] font-mono font-bold text-[#6060A0] hover:text-[#B0B0E0] hover:bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed transition-all uppercase tracking-widest"
              >
                ← PREVIOUS PHASE
              </button>
              {currentStep < 3 && (
                <button
                  onClick={() => setCurrentStep(Math.min(3, currentStep + 1))}
                  className="px-10 py-3 rounded-xl bg-brand-teal/10 text-brand-teal text-[10px] font-mono font-bold border border-brand-teal/20 hover:bg-brand-teal/20 transition-all shadow-lg shadow-brand-teal/5 uppercase tracking-widest"
                >
                  NEXT PHASE →
                </button>
              )}
            </div>
          </div>

          {/* Live Deal Preview */}
          <div className="glass p-8 h-fit sticky top-24 border-brand-teal/10 overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-teal/5 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-brand-teal/10 transition-all duration-700 pointer-events-none" />
            <h3 className="font-mono text-[10px] font-bold text-[#6060A0] mb-8 tracking-[0.2em] uppercase">PROTOCOL PREVIEW</h3>
            <div className="space-y-6 relative z-10">
              <div>
                <p className="font-mono text-[9px] text-[#6060A0] uppercase font-bold tracking-widest mb-1">CONTRACT STATUS</p>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-teal pulse-dot" />
                  <p className="font-mono text-xs text-brand-teal font-bold tracking-tighter uppercase">INITIALIZING...</p>
                </div>
              </div>
              <div className="pt-4 border-t border-white/5">
                <p className="font-mono text-[9px] text-[#6060A0] uppercase font-bold tracking-widest mb-2">IDENTITIES</p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-mono text-[10px] text-[#5A5A7A] uppercase font-bold tracking-tighter">BUYER:</span>
                    <span className="font-mono text-[10px] text-[#B0B0E0] font-bold truncate max-w-[120px]">{role === 'buyer' ? 'YOU (Verified)' : (counterparty || 'TBD')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-mono text-[10px] text-[#5A5A7A] uppercase font-bold tracking-tighter">SELLER:</span>
                    <span className="font-mono text-[10px] text-[#B0B0E0] font-bold truncate max-w-[120px]">{role === 'seller' ? 'YOU (Verified)' : (counterparty || 'TBD')}</span>
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-white/5">
                <p className="font-mono text-[9px] text-[#6060A0] uppercase font-bold tracking-widest mb-2">LOCKED VALUE</p>
                <p className="font-sans text-2xl font-bold text-brand-teal tracking-tighter">{amountNum > 0 ? `${amountNum.toLocaleString()} ${token}` : '0.00'}</p>
              </div>
              <div className="pt-4 border-t border-white/5">
                <p className="font-mono text-[9px] text-[#6060A0] uppercase font-bold tracking-widest mb-4">MILESTONE ALLOCATION</p>
                <div className="space-y-3">
                  {milestones.map((m, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 max-w-[180px]">
                        <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                        <span className="font-mono text-[10px] text-[#B0B0E0] truncate uppercase font-bold tracking-tighter">{m.title || `PHASE ${i + 1}`}</span>
                      </div>
                      <span className="font-mono text-[10px] text-brand-amber font-bold">{m.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        </>
        )}
      </div>
    </DashboardLayout>
  );
}
