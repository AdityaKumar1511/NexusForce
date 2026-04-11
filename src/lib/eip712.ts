export const DOMAIN = {
  name: 'NexusForce',
  version: '1',
  chainId: 80002, // Polygon Amoy
} as const;

export const TYPES = {
  DealRequest: [
    { name: 'dealId', type: 'string' },
    { name: 'amount', type: 'uint256' },
    { name: 'buyer', type: 'address' },
    { name: 'seller', type: 'address' },
  ],
} as const;
