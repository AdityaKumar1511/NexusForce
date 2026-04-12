'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useWalletContext } from '@/providers/WalletProvider';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useDisconnect } from 'wagmi';
import toast from 'react-hot-toast';
import NotificationHub from '@/components/ui/NotificationHub';

interface TopBarProps {
  onOpenSidebar: () => void;
}

export default function TopBar({ onOpenSidebar }: TopBarProps) {
  const { shortAddress } = useWalletContext();
  const { disconnect } = useDisconnect();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopy = async () => {
    if (shortAddress) {
      await navigator.clipboard.writeText(shortAddress);
      toast.success('Address copied!', {
        style: {
          background: 'rgba(255, 255, 255, 0.04)',
          color: '#E0E0FF',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(20px)',
          fontFamily: 'Space Grotesk, sans-serif',
          fontSize: '13px',
        },
      });
    }
    setShowDropdown(false);
  };

  return (
    <header className="glass-navbar fixed top-0 right-0 left-0 lg:left-[240px] h-16 flex items-center justify-between lg:justify-end px-4 lg:px-6 z-30">
      <div className="flex items-center gap-3">
        <button 
          onClick={onOpenSidebar}
          className="lg:hidden p-2 text-[#B0B0E0] hover:text-[#E0E0FF] transition-colors"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <div className="flex lg:hidden items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#060612] border border-white/10 flex items-center justify-center overflow-hidden">
            <img src="/logo.png" alt="Logo" className="w-6 h-6 object-contain" />
          </div>
          <span className="font-sans text-[11px] font-black tracking-widest text-[#E0E0FF] uppercase">NEXUSFORCE</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <NotificationHub />
        
        <div className="relative" ref={dropdownRef}>
          <ConnectButton.Custom>
            {({
              account,
              chain,
              openChainModal,
              openConnectModal,
              authenticationStatus,
              mounted,
            }) => {
              const ready = mounted && authenticationStatus !== 'loading';
              const connected =
                ready &&
                account &&
                chain &&
                (!authenticationStatus || authenticationStatus === 'authenticated');

              return (
                <div
                  {...(!ready && {
                    'aria-hidden': true,
                    'style': {
                      opacity: 0,
                      pointerEvents: 'none',
                      userSelect: 'none',
                    },
                  })}
                >
                  {(() => {
                    if (!connected) {
                      return (
                        <button 
                          onClick={openConnectModal} 
                          className="px-4 lg:px-5 py-2 lg:py-2.5 rounded-[9px] bg-gradient-to-br from-[#6C63FF]/60 to-[#00E5C3]/40 border border-[#6C63FF]/40 text-white font-sans text-[10px] lg:text-xs font-bold hover:scale-[1.02] active:scale-[0.97] transition-all whitespace-nowrap"
                        >
                          CONNECT WALLET
                        </button>
                      );
                    }

                    if (chain.unsupported) {
                      return (
                        <button 
                          onClick={openChainModal} 
                          className="px-4 lg:px-5 py-2 lg:py-2.5 rounded-[9px] bg-danger/10 border border-danger/30 text-danger font-sans text-[10px] lg:text-xs font-bold hover:scale-[1.02] active:scale-[0.97] transition-all"
                        >
                          WRONG NETWORK
                        </button>
                      );
                    }

                    return (
                      <>
                        <button
                          onClick={() => setShowDropdown(!showDropdown)}
                          className="flex items-center gap-2 px-3 lg:px-4 py-1.5 lg:py-2 rounded-[9px] border border-[#6C63FF]/30 bg-[#6C63FF]/10 text-[#8B85FF] hover:border-[#6C63FF]/50 transition-all font-mono text-sm"
                        >
                          <div className="w-1.5 lg:w-2 h-1.5 lg:h-2 rounded-full bg-brand-teal pulse-dot" />
                          <span className="font-mono text-[10px] lg:text-xs">{shortAddress}</span>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-50">
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </button>

                        {showDropdown && (
                          <div className="absolute right-0 mt-2 w-44 lg:w-48 glass shadow-2xl overflow-hidden animate-fade-in z-50">
                            <button onClick={handleCopy} className="w-full px-4 py-3 text-left text-[11px] font-mono text-[#B0B0E0] hover:bg-white/[0.05] hover:text-[#E0E0FF] transition-colors">
                              Copy Address
                            </button>
                            <button
                              onClick={() => { disconnect(); setShowDropdown(false); toast.success('Wallet disconnected', { style: { background: 'rgba(255, 255, 255, 0.04)', color: '#E0E0FF', border: '1px solid rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(20px)', fontFamily: 'Space Grotesk, sans-serif', fontSize: '13px' } }); }}
                              className="w-full px-4 py-3 text-left text-[11px] font-mono text-danger hover:bg-white/[0.05] transition-colors border-t border-white/[0.08]"
                            >
                              Disconnect
                            </button>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              );
            }}
          </ConnectButton.Custom>
        </div>
      </div>
    </header>
  );
}
