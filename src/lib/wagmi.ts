import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { polygonAmoy } from 'wagmi/chains';
import { http } from 'wagmi';

export const config = getDefaultConfig({
  appName: 'NexusForce',
  projectId: '7627b62fb6d4cdcf90620999994ca9e5', // Official WalletConnect public demo ID
  chains: [polygonAmoy],
  transports: {
    [polygonAmoy.id]: http(),
  },
  ssr: true, // If using Next.js App Router
});
