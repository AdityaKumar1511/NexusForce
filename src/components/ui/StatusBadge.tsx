'use client';

import React from 'react';

interface StatusBadgeProps {
  status: 'active' | 'in_dispute' | 'voting' | 'resolved' | 'completed' | 'pending' | 'pending_signature' | 'pending_signatures' | 'confirmed';
  size?: 'sm' | 'md';
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string; borderColor: string; pulse: boolean }> = {
  active: { label: 'ACTIVE', color: 'text-[#00E5C3]', bgColor: 'bg-[rgba(0,229,195,0.12)]', borderColor: 'border-[rgba(0,229,195,0.22)]', pulse: true },
  in_dispute: { label: 'IN DISPUTE', color: 'text-[#EF4444]', bgColor: 'bg-[rgba(239,68,68,0.15)]', borderColor: 'border-[rgba(239,68,68,0.25)]', pulse: true },
  voting: { label: 'VOTING', color: 'text-[#F59E0B]', bgColor: 'bg-[rgba(245,158,11,0.12)]', borderColor: 'border-[rgba(245,158,11,0.22)]', pulse: true },
  resolved: { label: 'RESOLVED', color: '#00E5C3', bgColor: 'bg-[rgba(0,229,195,0.12)]', borderColor: 'border-[rgba(0,229,195,0.22)]', pulse: false },
  completed: { label: 'COMPLETED', color: 'text-[#8B85FF]', bgColor: 'bg-[rgba(108,99,255,0.15)]', borderColor: 'border-[rgba(108,99,255,0.25)]', pulse: false },
  pending: { label: 'PENDING', color: 'text-[#F59E0B]', bgColor: 'bg-[rgba(245,158,11,0.12)]', borderColor: 'border-[rgba(245,158,11,0.22)]', pulse: false },
  pending_signature: { label: 'PENDING SIGNATURE', color: 'text-[#F59E0B]', bgColor: 'bg-[rgba(245,158,11,0.12)]', borderColor: 'border-[rgba(245,158,11,0.22)]', pulse: false },
  pending_signatures: { label: 'PENDING SIGNATURES', color: 'text-[#F59E0B]', bgColor: 'bg-[rgba(245,158,11,0.12)]', borderColor: 'border-[rgba(245,158,11,0.22)]', pulse: true },
  confirmed: { label: 'CONFIRMED', color: 'text-[#00E5C3]', bgColor: 'bg-[rgba(0,229,195,0.12)]', borderColor: 'border-[rgba(0,229,195,0.22)]', pulse: false },
};

// Map hex strings to tailwind text- classes if possible or use inline style for resolved
const getTextColorClass = (color: string) => color.startsWith('text-') ? color : '';
const getTextStyle = (color: string) => color.startsWith('text-') ? {} : { color };

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.pending;
  const sizeClasses = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-3 py-1';

  return (
    <span 
      className={`
        inline-flex items-center gap-1.5 rounded-full font-mono font-medium border
        ${config.bgColor} ${getTextColorClass(config.color)} ${config.borderColor} ${sizeClasses}
      `}
      style={getTextStyle(config.color)}
    >
      <span className={`w-1.5 h-1.5 rounded-full bg-current ${config.pulse ? 'pulse-dot' : ''}`} />
      {config.label}
    </span>
  );
}
