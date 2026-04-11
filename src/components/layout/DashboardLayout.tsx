'use client';

import React, { useState } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen content-layer bg-[#060612]">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <TopBar onOpenSidebar={() => setIsSidebarOpen(true)} />
      
      <main className="lg:ml-[240px] pt-16 min-h-screen transition-all duration-300 ease-in-out">
        <div className="max-w-[1600px] mx-auto p-4 md:p-6 lg:p-10">
          {children}
        </div>
      </main>
    </div>
  );
}
