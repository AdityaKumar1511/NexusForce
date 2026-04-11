'use client';

import React from 'react';

// ─── Base Skeleton Bar ───────────────────────────────────────

function SkeletonBar({
  width = '100%',
  height = '12px',
  borderRadius = '6px',
  className = '',
}: {
  width?: string;
  height?: string;
  borderRadius?: string;
  className?: string;
}) {
  return (
    <div
      className={`skeleton-shimmer ${className}`}
      style={{
        width,
        height,
        borderRadius,
        background: 'rgba(255, 255, 255, 0.04)',
      }}
    />
  );
}

// ─── Deal Row Skeleton ───────────────────────────────────────
// Mimics the 6-column deal row layout on the dashboard

export function DealRowSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <div
      className="grid grid-cols-1 lg:grid-cols-[100px_1fr_120px_160px_140px_140px] px-6 py-5 items-center gap-4 lg:gap-x-8 border-b border-white/5"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Deal ID */}
      <div>
        <SkeletonBar width="60px" height="16px" />
      </div>

      {/* Counterparty */}
      <div className="flex items-center gap-2">
        <SkeletonBar width="120px" height="14px" />
        <SkeletonBar width="48px" height="18px" borderRadius="999px" />
      </div>

      {/* Value */}
      <div>
        <SkeletonBar width="80px" height="14px" />
      </div>

      {/* Status */}
      <div>
        <SkeletonBar width="72px" height="22px" borderRadius="999px" />
      </div>

      {/* Milestone */}
      <div>
        <SkeletonBar width="100%" height="6px" borderRadius="3px" />
        <div className="mt-2">
          <SkeletonBar width="48px" height="8px" />
        </div>
      </div>

      {/* Action */}
      <div>
        <SkeletonBar width="64px" height="26px" borderRadius="7px" />
      </div>
    </div>
  );
}

// ─── Stat Card Skeleton ──────────────────────────────────────
// Mimics the stat card shape

export function StatCardSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <div
      className="glass p-6"
      style={{ animationDelay: `${delay}ms` }}
    >
      <SkeletonBar width="100px" height="32px" className="mb-3" />
      <SkeletonBar width="80px" height="10px" />
    </div>
  );
}

// ─── Dispute Row Skeleton ────────────────────────────────────
// Mimics the 6-column dispute row layout

export function DisputeRowSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <div
      className="grid grid-cols-1 lg:grid-cols-[110px_100px_140px_180px_1fr_120px] px-6 py-5 items-center gap-4 lg:gap-x-8 border-b border-white/5"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Dispute ID */}
      <div>
        <SkeletonBar width="60px" height="16px" />
      </div>

      {/* Deal ID */}
      <div>
        <SkeletonBar width="50px" height="14px" />
      </div>

      {/* Value */}
      <div>
        <SkeletonBar width="80px" height="14px" />
      </div>

      {/* Status */}
      <div>
        <SkeletonBar width="120px" height="22px" borderRadius="999px" />
      </div>

      {/* Jurors */}
      <div className="flex items-center gap-1.5">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="skeleton-shimmer"
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.04)',
            }}
          />
        ))}
        <SkeletonBar width="48px" height="10px" className="ml-2" />
      </div>

      {/* Action */}
      <div>
        <SkeletonBar width="80px" height="26px" borderRadius="7px" />
      </div>
    </div>
  );
}

// ─── Activity Feed Skeleton ──────────────────────────────────

export function ActivitySkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="p-4 space-y-0">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-start gap-3 py-3 px-2 border-b border-white/[0.03] last:border-0"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <SkeletonBar width="56px" height="12px" className="mt-1 flex-shrink-0" />
          <SkeletonBar width={`${60 + Math.random() * 30}%`} height="12px" />
        </div>
      ))}
    </div>
  );
}

// ─── Full Dashboard Skeleton ─────────────────────────────────
// Combines stat cards + deal rows for a complete loading state

export function DashboardSkeleton() {
  return (
    <>
      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} delay={i * 80} />
        ))}
      </div>

      {/* Deals Table */}
      <div className="glass mb-8 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <SkeletonBar width="120px" height="14px" />
          <SkeletonBar width="64px" height="12px" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <DealRowSkeleton key={i} delay={i * 100} />
        ))}
      </div>
    </>
  );
}
