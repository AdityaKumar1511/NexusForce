'use client';

import React from 'react';

import { Milestone } from '@/lib/types';

interface MilestoneProgressBarProps {
  milestones: Milestone[];
  showLabels?: boolean;
}

export default function MilestoneProgressBar({ milestones, showLabels = false }: MilestoneProgressBarProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-1">
        {milestones.map((m, i) => (
          <div
            key={i}
            className={`
              h-1.5 flex-1 rounded-full transition-all duration-300
              ${m.status === 'completed' ? 'bg-brand-teal' :
                m.status === 'active' ? 'bg-brand-teal pulse-dot' :
                m.status === 'under_review' ? 'bg-brand-amber animate-pulse' :
                m.status === 'rejected' ? 'bg-brand-pink' :
                m.status === 'auto_released' ? 'bg-[#8B85FF]' :
                'bg-white/10'}
            `}
            title={m.title}
          />
        ))}
      </div>
      {showLabels && (
        <div className="flex gap-1">
          {milestones.map((m, i) => (
            <div key={i} className="flex-1 text-center">
              <span className={`text-[9px] font-mono tracking-tighter ${
                m.status === 'completed' ? 'text-brand-teal font-bold' :
                (m.status === 'active' || m.status === 'under_review') ? 'text-brand-amber font-bold' :
                m.status === 'rejected' ? 'text-brand-pink font-bold' :
                m.status === 'auto_released' ? 'text-[#8B85FF] font-bold' :
                'text-nf-text-muted'
              }`}>
                {i + 1}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
