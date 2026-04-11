'use client';

import React from 'react';
import { useCountdown } from '@/hooks';

interface CountdownTimerProps {
  targetDate: Date;
  label?: string;
  size?: 'sm' | 'lg';
}

export default function CountdownTimer({ targetDate, label, size = 'lg' }: CountdownTimerProps) {
  const { hours, minutes, seconds, isExpired, total } = useCountdown(targetDate);

  // Color shifts based on urgency
  const urgencyColor = isExpired
    ? 'text-danger'
    : total < 3600000 // < 1 hour
      ? 'text-brand-pink'
      : total < 21600000 // < 6 hours
        ? 'text-brand-amber'
        : 'text-brand-teal';

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (size === 'sm') {
    return (
      <span className={`font-sans text-sm font-medium ${urgencyColor} counter-number`}>
        {isExpired ? 'EXPIRED' : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`}
      </span>
    );
  }

  return (
    <div className="text-center">
      {label && <p className="text-nf-text-secondary text-xs font-mono uppercase tracking-widest mb-3 opacity-70">{label}</p>}
      <div className={`font-sans ${urgencyColor} counter-number flex items-center justify-center gap-3`}>
        {isExpired ? (
          <span className="text-3xl font-bold tracking-tight">EXPIRED</span>
        ) : (
          <>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold tracking-tight">{pad(hours)}</span>
              <span className="text-[10px] text-nf-text-muted mt-1 font-mono">HH</span>
            </div>
            <span className="text-3xl font-bold opacity-50 mb-4">:</span>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold tracking-tight">{pad(minutes)}</span>
              <span className="text-[10px] text-nf-text-muted mt-1 font-mono">MM</span>
            </div>
            <span className="text-3xl font-bold opacity-50 mb-4">:</span>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold tracking-tight">{pad(seconds)}</span>
              <span className="text-[10px] text-nf-text-muted mt-1 font-mono">SS</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
