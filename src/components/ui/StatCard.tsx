'use client';

import React from 'react';

interface StatCardProps {
  value: number | string;
  label: string;
  prefix?: string;
  suffix?: string;
  delay?: number;
  className?: string;
}

export default function StatCard({ value, label, prefix = '', suffix = '', delay = 0, className = '' }: StatCardProps) {
  const numericValue = typeof value === 'number' ? value : 0;
  const [isInView, setIsInView] = React.useState(false);
  const [entryComplete, setEntryComplete] = React.useState(false);
  const cardRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!cardRef.current) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          setTimeout(() => setEntryComplete(true), delay + 400); // clear delay after entry anim
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    
    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={cardRef}
      style={{ 
        transitionDuration: '400ms', 
        transitionDelay: entryComplete ? '0ms' : `${delay}ms` 
      }}
      className={`glass p-6 shimmer-hover group transition-all
        ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}
        hover:-translate-y-1 hover:border-[#6C63FF]/35
        ${className}`}
    >
      <p className="font-sans text-2xl md:text-3xl font-semibold text-brand-teal group-hover:text-brand-purple-light transition-colors duration-300">
        {prefix}{typeof value === 'string' ? value : <AnimatedNumber end={numericValue} />}{suffix}
      </p>
      <p className="text-nf-text-secondary text-xs font-mono mt-2 uppercase tracking-widest opacity-80 group-hover:opacity-100 transition-opacity">
        {label}
      </p>
    </div>
  );
}

function AnimatedNumber({ end }: { end: number }) {
  const [count, setCount] = React.useState(0);
  const [isInView, setIsInView] = React.useState(false);
  const countRef = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    if (!countRef.current) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    
    observer.observe(countRef.current);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    if (!isInView) return;

    const startTime = performance.now();
    const duration = 1200;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress); // Expo ease out
      setCount(Math.floor(eased * end));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    requestAnimationFrame(animate);
  }, [end, isInView]);

  return <span ref={countRef}>{formatNumber(count)}</span>;
}

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K`;
  return n.toLocaleString();
}
