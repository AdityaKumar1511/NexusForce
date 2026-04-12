'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useWalletContext } from '@/providers/WalletProvider';
import StatCard from '@/components/ui/StatCard';
import { subscribeToGlobalStats, hasSeeded } from '@/lib/firebaseService';
import { seedFirestore } from '@/lib/seedData';
import type { GlobalStats } from '@/lib/types';
import toast from 'react-hot-toast';

const ForceGraph = dynamic(() => import('@/components/ForceGraph'), { ssr: false });

export default function LandingPage() {
  const { isConnected, connect } = useWalletContext();
  const [globalStats, setGlobalStats] = useState<GlobalStats>({ totalEscrowed: 4200000, dealsCompleted: 12847, autoResolutionRate: 99.2, avgReleaseTime: '<2 MIN' });

  useEffect(() => {
    const unsub1 = subscribeToGlobalStats(setGlobalStats);

    let isSeeding = false;
    const checkAndSeed = async () => {
      if (isSeeding) return;
      isSeeding = true;
      try {
        if (!(await hasSeeded())) {
          console.log('Database uninitialized. Auto-seeding...');
          await seedFirestore();
        }
      } catch (err) {
        console.error('Auto-seed check failed:', err);
      }
    };
    checkAndSeed();

    return () => { unsub1(); };
  }, []);

  const handleConnect = () => {
    connect();
    toast.success('Wallet connected successfully', {
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
  };

  return (
    <div className="min-h-screen">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-navbar">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#060612] border border-white/10 flex items-center justify-center overflow-hidden">
              <img src="/logo.png" alt="NexusForce Logo" className="w-7 h-7 object-contain" />
            </div>
            <span className="font-sans text-sm font-bold tracking-widest text-[#E0E0FF] hidden sm:block uppercase tracking-[0.2em]">NEXUSFORCE</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-[#B0B0E0] hover:text-[#E0E0FF] text-[10px] sm:text-xs font-mono transition-colors">
              Dashboard
            </Link>
            <Link href="/governance" className="text-[#B0B0E0] hover:text-[#E0E0FF] text-[10px] sm:text-xs font-mono transition-colors hidden sm:block">
              Governance
            </Link>
            {isConnected ? (
              <Link href="/dashboard" className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-[9px] border border-brand-purple/30 bg-brand-purple/10 text-[#8B85FF] font-mono text-[10px] sm:text-xs flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-teal pulse-dot" />
                <span className="hidden xs:block">0x3F4a...4F3a</span>
                <span className="xs:hidden">WALLET</span>
              </Link>
            ) : (
              <button onClick={handleConnect} className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-[9px] bg-gradient-to-br from-[#6C63FF]/60 to-[#00E5C3]/40 border border-[#6C63FF]/40 text-white font-sans text-[10px] sm:text-xs font-bold hover:scale-[1.02] active:scale-[0.97] transition-all whitespace-nowrap">
                CONNECT
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative w-full min-h-screen flex items-center justify-center overflow-hidden">
        <ForceGraph />
        
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#060612]/40 via-transparent to-[#060612] z-[1]" />
        
        {/* Hero Content */}
        <div className="relative z-[2] text-center px-6 max-w-4xl">
          <h1 className="font-sans text-4xl sm:text-5xl md:text-7xl font-bold leading-tight mb-2 tracking-tight">
            <span className="text-[#E0E0FF] block">TRUSTLESS COMMERCE.</span>
            <span className="text-brand-teal block mt-2 drop-shadow-[0_0_30px_rgba(0,229,195,0.3)]">AUTOMATIC JUSTICE.</span>
          </h1>
          <p className="text-[#B0B0E0] font-mono text-sm md:text-base mt-6 max-w-2xl mx-auto opacity-80">
            Smart contract escrow · DAO tribunal · Zero middlemen
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <Link href="/deals/new" className="px-8 py-3.5 rounded-[9px] bg-gradient-to-br from-[#6C63FF]/60 to-[#00E5C3]/40 border border-[#6C63FF]/40 text-white font-sans text-sm font-bold hover:scale-[1.05] active:scale-[0.97] transition-all shadow-xl shadow-brand-purple/20">
              POST A DEAL
            </Link>
            <Link href="/juror" className="px-8 py-3.5 rounded-[9px] bg-white/5 border border-white/10 text-brand-teal font-sans text-sm font-bold hover:bg-white/10 transition-all active:scale-[0.97]">
              BECOME A JUROR
            </Link>
          </div>
        </div>

      </section>

      {/* Stats Strip */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          <StatCard value={globalStats.totalEscrowed} prefix="$" label="Total Escrowed" delay={0} />
          <StatCard value={globalStats.dealsCompleted} label="Deals Completed" delay={80} />
          <StatCard value={globalStats.autoResolutionRate} suffix="%" label="Auto-Resolution Rate" delay={160} />
          <StatCard value={globalStats.avgReleaseTime} label="Avg Release Time" delay={240} />
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-sans text-3xl md:text-4xl font-bold text-center text-[#E0E0FF] mb-16 tracking-tight">
            HOW IT <span className="text-brand-teal">WORKS</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'LOCK FUNDS', desc: 'Payment locked in escrow on deal creation. Instant. Immutable.', color: 'text-brand-teal', icon: '◆' },
              { step: '02', title: 'DELIVER WORK', desc: 'Meet milestones. Submit evidence. Build your on-chain reputation.', color: 'text-brand-purple', icon: '◇' },
              { step: '03', title: 'GET PAID', desc: 'Smart contract releases instantly when conditions are met. No approval needed.', color: 'text-brand-teal', icon: '✓' },
              { step: '04', title: 'JURORS DECIDE', desc: 'DAO tribunal reviews evidence. Verdict in 48hr. Automatic execution.', color: 'text-brand-pink', icon: '⚖' },
            ].map((item, i) => (
              <div key={i} className={`glass p-8 shimmer-hover group transition-all duration-300 hover:border-brand-purple/30`}>
                <div className={`${item.color} font-sans text-3xl mb-4 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300`}>{item.icon}</div>
                <p className={`font-mono text-[10px] ${item.color} tracking-[0.4em] mb-3 opacity-60`}>{item.step}</p>
                <h3 className="font-sans text-lg font-bold text-[#E0E0FF] mb-3">{item.title}</h3>
                <p className="text-[#B0B0E0] font-mono text-xs leading-relaxed opacity-70 group-hover:opacity-100 transition-opacity">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-sans text-3xl md:text-4xl font-bold text-center text-[#E0E0FF] mb-4 tracking-tight">
            BUILT FOR <span className="text-brand-purple-light">TRUST</span>
          </h2>
          <p className="text-[#B0B0E0] font-mono text-sm text-center mb-16 max-w-2xl mx-auto opacity-70">
            Every component uses blockchain because it provides something a central server genuinely cannot.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: 'Smart Contract Escrow', desc: 'Funds locked in Solidity contracts on Polygon. Multi-sig release. Time-locked auto-refund.', gradient: 'from-brand-teal/10 to-transparent' },
              { title: 'IPFS Evidence Vault', desc: 'Content-addressed, tamper-proof file storage. CID changes if even one byte is altered.', gradient: 'from-brand-purple/10 to-transparent' },
              { title: 'Chainlink VRF Selection', desc: 'Cryptographically random juror selection. Provably fair. No manipulation possible.', gradient: 'from-brand-amber/10 to-transparent' },
              { title: 'On-Chain Reputation', desc: 'Every juror has an immutable score. Pure function of historical voting accuracy.', gradient: 'from-brand-teal/10 to-transparent' },
              { title: 'Tiered Appeal System', desc: '7-juror tribunal → 25-juror super-jury for high-value disputes. Bond-secured appeals.', gradient: 'from-brand-pink/10 to-transparent' },
              { title: 'Multi-Asset Payments', desc: 'USDC, USDT, MATIC. Near-zero gas fees on Polygon. Globally accessible.', gradient: 'from-brand-teal/10 to-transparent' },
            ].map((feature, i) => (
              <div key={i} className={`bg-gradient-to-br ${feature.gradient} glass p-8 shimmer-hover group transition-all duration-300`}>
                <h3 className="font-sans text-base font-bold text-[#E0E0FF] mb-4 opacity-90 group-hover:opacity-100">{feature.title}</h3>
                <p className="text-[#B0B0E0] font-mono text-xs leading-relaxed opacity-70 group-hover:opacity-100 transition-opacity">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 relative border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-sans text-4xl md:text-5xl font-bold text-[#E0E0FF] mb-6 tracking-tight">
            READY TO <span className="text-brand-teal drop-shadow-[0_0_20px_rgba(0,229,195,0.2)]">TRANSACT</span>?
          </h2>
          <p className="text-[#B0B0E0] font-mono text-sm mb-12 opacity-80">
            No sign-up needed. Connect your wallet and post your first deal in under 2 minutes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link href="/deals/new" className="px-10 py-4 rounded-[9px] bg-gradient-to-br from-[#6C63FF]/60 to-[#00E5C3]/40 border border-[#6C63FF]/40 text-white font-sans text-sm font-bold hover:scale-[1.05] transition-all shadow-xl shadow-brand-purple/20">
              LAUNCH APP
            </Link>
            <Link href="/governance" className="px-10 py-4 rounded-[9px] bg-white/5 border border-white/10 text-[#8B85FF] font-sans text-sm font-bold hover:bg-white/10 transition-all">
              VIEW GOVERNANCE
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 relative border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="text-[#6060A0] hover:text-[#B0B0E0] text-[11px] font-mono tracking-wider transition-colors uppercase">Dashboard</Link>
            <Link href="/disputes/new" className="text-[#6060A0] hover:text-[#B0B0E0] text-[11px] font-mono tracking-wider transition-colors uppercase">Disputes</Link>
            <Link href="/governance" className="text-[#6060A0] hover:text-[#B0B0E0] text-[11px] font-mono tracking-wider transition-colors uppercase">Governance</Link>
            <Link href="/juror" className="text-[#6060A0] hover:text-[#B0B0E0] text-[11px] font-mono tracking-wider transition-colors uppercase">Juror Panel</Link>
          </div>
          <p className="text-[#5A5A7A] text-[10px] font-mono tracking-[0.2em] flex items-center gap-3 uppercase">
            Built on <span className="text-brand-purple">Polygon</span> · <span className="text-brand-teal">Chainlink</span> · <span className="text-brand-pink">IPFS</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
