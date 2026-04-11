'use client';

import React, { useState } from 'react';

interface TransactionHashProps {
  hash: string;
  type?: 'tx' | 'address';
}

export default function TransactionHash({ hash, type = 'address' }: TransactionHashProps) {
  const [copied, setCopied] = useState(false);
  const short = `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  const explorerUrl = type === 'tx'
    ? `https://polygonscan.com/tx/${hash}`
    : `https://polygonscan.com/address/${hash}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <span className="inline-flex items-center gap-2 group relative">
      <span className="font-mono text-xs text-nf-text-secondary group-hover:text-brand-purple-light transition-colors">
        {short}
      </span>
      <button onClick={handleCopy} className="text-nf-text-muted hover:text-brand-teal transition-colors" title="Copy">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      </button>
      <a href={explorerUrl} target="_blank" rel="noopener noreferrer" className="text-nf-text-muted hover:text-brand-teal transition-colors" title="View on Polygonscan">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      </a>
      {copied && (
        <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-mono text-brand-teal bg-dark-800 px-2 py-0.5 rounded border border-brand-teal/20 animate-fade-in">
          COPIED
        </span>
      )}
    </span>
  );
}
