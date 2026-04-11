import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from 'react-hot-toast';
import { WalletProvider } from '@/providers/WalletProvider';
import { Web3Provider } from '@/providers/Web3Provider';

export const metadata: Metadata = {
  title: "NexusForce — Trustless Dispute Resolution Protocol",
  description: "Blockchain-powered escrow, automatic resolution, and DAO juror tribunal. No banks, no lawyers, no middlemen.",
  keywords: "blockchain, escrow, dispute resolution, DAO, smart contracts, Web3, DeFi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">
        {/* Background Orbs */}
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          <div 
            className="absolute top-[-150px] left-[-120px] w-[500px] h-[500px] rounded-full bg-brand-purple opacity-[0.15] blur-[100px] animate-float"
          />
          <div 
            className="absolute top-[200px] right-[-100px] w-[400px] h-[400px] rounded-full bg-brand-teal opacity-[0.12] blur-[100px] animate-float-reverse"
          />
          <div 
            className="absolute bottom-[-80px] left-[30%] w-[350px] h-[350px] rounded-full bg-brand-pink opacity-[0.12] blur-[100px] animate-float-delayed"
          />
        </div>

        {/* Content Layer */}
        <div className="relative z-1 min-h-screen">
          <Web3Provider>
            <WalletProvider>
              {children}
              <Toaster position="top-right" />
            </WalletProvider>
          </Web3Provider>
        </div>
      </body>
    </html>
  );
}
