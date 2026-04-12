'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWalletContext } from '@/providers/WalletProvider';
import { subscribeToNotifications, markAsRead, markAllAsRead } from '@/lib/notificationService';
import { Notification } from '@/lib/types';

function formatTimeAgo(date: Date) {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return Math.floor(seconds) + " seconds ago";
}

export default function NotificationHub() {
  const router = useRouter();
  const { address } = useWalletContext();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    if (!address) {
      setNotifications([]);
      return;
    }

    const unsubscribe = subscribeToNotifications(address, (newNotes) => {
      setNotifications(newNotes);
    });

    return () => unsubscribe();
  }, [address]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (n: Notification) => {
    if (!n.isRead) {
      await markAsRead(n.id);
    }
    setIsOpen(false);
    if (n.link) {
      router.push(n.link);
    }
  };

  const handleMarkAllRead = async () => {
    if (address) {
      await markAllAsRead(address, notifications);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-lg transition-all border ${
          isOpen ? 'bg-white/10 border-white/20' : 'bg-transparent border-transparent hover:bg-white/5'
        }`}
      >
        <div className="relative">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#B0B0E0]">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-danger text-[8px] font-bold text-white border-2 border-[#060612]">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 glass shadow-2xl overflow-hidden animate-fade-in z-50 origin-top-right">
          <div className="px-4 py-3 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
            <h3 className="font-sans text-xs font-bold text-[#E0E0FF] uppercase tracking-wider">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllRead}
                className="text-[10px] font-mono text-brand-teal hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>
          
          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-xs font-mono text-nf-text-muted">No alerts at the moment.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`w-full text-left p-4 border-b border-white/5 hover:bg-white/[0.03] transition-colors flex gap-3 ${
                    !n.isRead ? 'bg-white/[0.01]' : 'opacity-60'
                  }`}
                >
                  <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
                    n.type === 'dispute' ? 'bg-danger' : 
                    n.type === 'milestone' ? 'bg-brand-amber' : 
                    n.type === 'juror' ? 'bg-[#8B85FF]' :
                    'bg-brand-teal'
                  } ${!n.isRead ? 'pulse-dot' : ''}`} />
                  
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs ${!n.isRead ? 'text-[#E0E0FF] font-bold' : 'text-[#8B85FF]'} truncate`}>
                      {n.title}
                    </p>
                    <p className="text-[11px] text-[#A0A0C0] mt-1 line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>
                    <p className="text-[9px] font-mono text-nf-text-muted mt-2 uppercase tracking-tighter">
                      {formatTimeAgo(n.timestamp)}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
          
          {notifications.length > 0 && (
            <div className="px-4 py-3 bg-white/[0.02] text-center border-t border-white/5">
              <button className="text-[10px] font-mono text-[#8B85FF] hover:text-[#E0E0FF] transition-colors uppercase tracking-widest font-bold">
                View All Activity
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
