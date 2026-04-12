'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWalletContext } from '@/providers/WalletProvider';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '◆' },
  { href: '/deals/new', label: 'My Deals', icon: '◇' },
  { href: '/disputes/new', label: 'Disputes', icon: '⚖' },
  { href: '/juror', label: 'Juror Panel', icon: '⚡' },
  { href: '/vault', label: 'Evidence Vault', icon: '◈' },
  { href: '/governance', label: 'Governance', icon: '⬡' },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { isConnected, shortAddress, nxfBalance } = useWalletContext();

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      <aside className={`
        glass-sidebar sidebar-full fixed left-0 top-0 bottom-0 w-[240px] flex flex-col z-50
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Close button for mobile */}
        <button 
          onClick={onClose}
          className="lg:hidden absolute top-4 right-4 p-2 text-[#6060A0] hover:text-[#E0E0FF]"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Logo */}
        <Link href="/" className="p-6 pb-2" onClick={onClose}>
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-brand-purple to-brand-teal rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative w-12 h-12 rounded-xl bg-[#060612] border border-white/10 flex items-center justify-center overflow-hidden shadow-2xl">
                <img 
                  src="/logo.png" 
                  alt="NexusForce Logo" 
                  className="w-10 h-10 object-contain hover:scale-110 transition-transform duration-500"
                />
              </div>
            </div>
            <div className="sidebar-label">
              <p className="font-sans text-[13px] font-black tracking-[0.2em] text-white uppercase bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent">NEXUSFORCE</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-1 h-1 rounded-full bg-brand-teal animate-pulse" />
                <p className="font-mono text-[9px] text-[#6060A0] uppercase tracking-widest font-bold">V2 PROTOCOL</p>
              </div>
            </div>
          </div>
        </Link>

        {/* Wallet Info */}
        {isConnected && (
          <div className="px-6 pb-4 border-b border-white/[0.06]">
            <p className="font-mono text-[11px] text-[#B0B0E0] truncate sidebar-label">{shortAddress}</p>
            <p className="font-sans text-sm text-brand-amber mt-1 font-semibold sidebar-label">{nxfBalance} NXF</p>
          </div>
        )}

        {/* Nav Items */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                  ${isActive
                    ? 'nav-item-active'
                    : 'text-[#B0B0E0] hover:text-[#E0E0FF] hover:bg-white/[0.03]'
                  }
                `}
              >
                <span className="text-base w-5 text-center opacity-70">{item.icon}</span>
                <span className="sidebar-label">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Network Status */}
        <div className="p-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-2 sidebar-label">
            <div className="w-2 h-2 rounded-full bg-brand-teal pulse-dot" />
            <span className="font-mono text-[11px] text-[#6060A0]">POLYGON MAINNET</span>
          </div>
          <p className="font-mono text-[11px] text-[#6060A0] mt-1 sidebar-label">GAS: 32 GWEI</p>
        </div>
      </aside>
    </>
  );
}
