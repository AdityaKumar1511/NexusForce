'use client';

import React, { createContext, useContext, useCallback, ReactNode } from 'react';

interface WalletContextType {
  isConnected: boolean;
  address: string | null;
  shortAddress: string | null;
  nxfBalance: number;
  nxfStaked: number;
  connect: () => void;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType>({
  isConnected: false,
  address: null,
  shortAddress: null,
  nxfBalance: 847.5,
  nxfStaked: 500,
  connect: () => {},
  disconnect: () => {},
});

import { useAccount, useDisconnect } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';

export const useWalletContext = () => useContext(WalletContext);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();
  const { openConnectModal } = useConnectModal();

  const connect = useCallback(() => {
    if (openConnectModal) {
      openConnectModal();
    }
  }, [openConnectModal]);

  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : null;

  return (
    <WalletContext.Provider value={{
      isConnected,
      address: address || null,
      shortAddress,
      nxfBalance: 847.5,
      nxfStaked: 500,
      connect,
      disconnect: () => disconnect(),
    }}>
      {children}
    </WalletContext.Provider>
  );
}
