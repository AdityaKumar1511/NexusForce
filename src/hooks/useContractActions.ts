'use client';

import { useState, useCallback } from 'react';
import { useWriteContract, useSignTypedData } from 'wagmi';
import { parseEther } from 'viem';
import { NEXUS_ESCROW_ABI, NEXUS_ESCROW_ADDRESS } from '@/lib/contract';
import {
  createDeal as indexCreateDeal,
  completeDeal as indexCompleteDeal,
  createDispute as indexCreateDispute,
  submitJurorVote as indexSubmitJurorVote,
  saveDealSignature,
  submitMilestone as indexSubmitMilestone,
  approveMilestone as indexApproveMilestone,
  rejectMilestone as indexRejectMilestone,
} from '@/lib/firebaseService';
import type { Deal, Dispute } from '@/lib/types';
import { DOMAIN, TYPES } from '@/lib/eip712';

// ─── Types ───────────────────────────────────────────────────

interface ContractActionResult {
  isPending: boolean;
  isSuccess: boolean;
  txHash: string | null;
  error: string | null;
}

// ─── useCreateDeal ───────────────────────────────────────────
// Sends a createDeal transaction on-chain, then indexes to Firebase.

export function useCreateDeal() {
  const { writeContractAsync } = useWriteContract();
  const [state, setState] = useState<ContractActionResult>({
    isPending: false,
    isSuccess: false,
    txHash: null,
    error: null,
  });

  const execute = useCallback(
    async (deal: Omit<Deal, 'id'>, sellerAddress: string, valueInMatic: string) => {
      setState({ isPending: true, isSuccess: false, txHash: null, error: null });

      try {
        // 1. Send on-chain transaction
        const dealId = `#${Math.floor(4800 + Math.random() * 200)}`;

        const milestoneTitles = deal.milestones.map(m => m.title);
        const milestonePercentages = deal.milestones.map(m => BigInt(m.percentage));

        const txHash = await writeContractAsync({
          address: NEXUS_ESCROW_ADDRESS,
          abi: NEXUS_ESCROW_ABI,
          functionName: 'createDeal',
          args: [
            sellerAddress as `0x${string}`, 
            dealId, 
            milestoneTitles, 
            milestonePercentages
          ],
          value: parseEther(valueInMatic),
        });

        // 2. Index to Firebase (so UI updates via existing subscriptions)
        await indexCreateDeal({
          ...deal,
          txHash,
        });

        setState({ isPending: false, isSuccess: true, txHash, error: null });
        return { dealId, txHash };
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Transaction failed';
        // Check for user rejection
        const isUserRejection = errorMessage.includes('User rejected') || errorMessage.includes('user rejected');
        setState({
          isPending: false,
          isSuccess: false,
          txHash: null,
          error: isUserRejection ? 'Transaction rejected by user' : errorMessage,
        });
        throw err;
      }
    },
    [writeContractAsync]
  );

  return { execute, ...state };
}

// ─── useSubmitMilestone ─────────────────────────────────────
// Seller submits proof of work for a milestone on-chain.

export function useSubmitMilestone() {
  const { writeContractAsync } = useWriteContract();
  const [state, setState] = useState<ContractActionResult>({
    isPending: false,
    isSuccess: false,
    txHash: null,
    error: null,
  });

  const execute = useCallback(
    async (dealId: string, index: number, proof: string) => {
      setState({ isPending: true, isSuccess: false, txHash: null, error: null });

      try {
        const txHash = await writeContractAsync({
          address: NEXUS_ESCROW_ADDRESS,
          abi: NEXUS_ESCROW_ABI,
          functionName: 'submitMilestone',
          args: [dealId, BigInt(index), proof],
        });

        await indexSubmitMilestone(dealId, index, proof);

        setState({ isPending: false, isSuccess: true, txHash, error: null });
        return txHash;
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Transaction failed';
        setState({ isPending: false, isSuccess: false, txHash: null, error: errorMessage });
        throw err;
      }
    },
    [writeContractAsync]
  );

  return { execute, ...state };
}

// ─── useApproveMilestone ────────────────────────────────────
// Buyer approves a milestone on-chain, triggering payment release.

export function useApproveMilestone() {
  const { writeContractAsync } = useWriteContract();
  const [state, setState] = useState<ContractActionResult>({
    isPending: false,
    isSuccess: false,
    txHash: null,
    error: null,
  });

  const execute = useCallback(
    async (dealId: string, index: number) => {
      setState({ isPending: true, isSuccess: false, txHash: null, error: null });

      try {
        const txHash = await writeContractAsync({
          address: NEXUS_ESCROW_ADDRESS,
          abi: NEXUS_ESCROW_ABI,
          functionName: 'approveMilestone',
          args: [dealId, BigInt(index)],
        });

        await indexApproveMilestone(dealId, index);

        setState({ isPending: false, isSuccess: true, txHash, error: null });
        return txHash;
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Transaction failed';
        setState({ isPending: false, isSuccess: false, txHash: null, error: errorMessage });
        throw err;
      }
    },
    [writeContractAsync]
  );

  return { execute, ...state };
}

// ─── useRejectMilestone ─────────────────────────────────────
// Buyer requests revision/rejects a milestone on-chain.

export function useRejectMilestone() {
  const { writeContractAsync } = useWriteContract();
  const [state, setState] = useState<ContractActionResult>({
    isPending: false,
    isSuccess: false,
    txHash: null,
    error: null,
  });

  const execute = useCallback(
    async (dealId: string, index: number, reason: string) => {
      setState({ isPending: true, isSuccess: false, txHash: null, error: null });

      try {
        const txHash = await writeContractAsync({
          address: NEXUS_ESCROW_ADDRESS,
          abi: NEXUS_ESCROW_ABI,
          functionName: 'rejectMilestone',
          args: [dealId, BigInt(index), reason],
        });

        await indexRejectMilestone(dealId, index, reason);

        setState({ isPending: false, isSuccess: true, txHash, error: null });
        return txHash;
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Transaction failed';
        setState({ isPending: false, isSuccess: false, txHash: null, error: errorMessage });
        throw err;
      }
    },
    [writeContractAsync]
  );

  return { execute, ...state };
}

// ─── useRaiseDispute ─────────────────────────────────────────
// File a dispute on-chain, then index to Firebase.

export function useRaiseDispute() {
  const { writeContractAsync } = useWriteContract();
  const [state, setState] = useState<ContractActionResult>({
    isPending: false,
    isSuccess: false,
    txHash: null,
    error: null,
  });

  const execute = useCallback(
    async (dispute: Omit<Dispute, 'id'>, reasonString: string) => {
      setState({ isPending: true, isSuccess: false, txHash: null, error: null });

      try {
        // 1. Send on-chain transaction
        const txHash = await writeContractAsync({
          address: NEXUS_ESCROW_ADDRESS,
          abi: NEXUS_ESCROW_ABI,
          functionName: 'raiseDispute',
          args: [dispute.dealId, reasonString],
        });

        // 2. Index to Firebase
        const disputeId = await indexCreateDispute(dispute);

        setState({ isPending: false, isSuccess: true, txHash, error: null });
        return { disputeId, txHash };
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Transaction failed';
        const isUserRejection = errorMessage.includes('User rejected') || errorMessage.includes('user rejected');
        setState({
          isPending: false,
          isSuccess: false,
          txHash: null,
          error: isUserRejection ? 'Transaction rejected by user' : errorMessage,
        });
        throw err;
      }
    },
    [writeContractAsync]
  );

  return { execute, ...state };
}

// ─── useSubmitJurorVote ──────────────────────────────────────
// Juror votes on a dispute on-chain.

export function useSubmitJurorVote() {
  const { writeContractAsync } = useWriteContract();
  const [state, setState] = useState<ContractActionResult>({
    isPending: false,
    isSuccess: false,
    txHash: null,
    error: null,
  });

  const execute = useCallback(
    async (
      disputeId: string,
      dealId: string,
      jurorIndex: number,
      vote: 'buyer_wins' | 'seller_wins' | 'split'
    ) => {
      setState({ isPending: true, isSuccess: false, txHash: null, error: null });

      // Map vote string to contract uint8  (1=BuyerWins, 2=SellerWins, 3=Split)
      const voteMap = { buyer_wins: 1, seller_wins: 2, split: 3 } as const;
      const voteValue = voteMap[vote];

      try {
        // 1. Send on-chain transaction
        const txHash = await writeContractAsync({
          address: NEXUS_ESCROW_ADDRESS,
          abi: NEXUS_ESCROW_ABI,
          functionName: 'submitVote',
          args: [dealId, voteValue],
        });

        // 2. Index to Firebase
        await indexSubmitJurorVote(disputeId, jurorIndex, vote);

        setState({ isPending: false, isSuccess: true, txHash, error: null });
        return txHash;
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Transaction failed';
        const isUserRejection = errorMessage.includes('User rejected') || errorMessage.includes('user rejected');
        setState({
          isPending: false,
          isSuccess: false,
          txHash: null,
          error: isUserRejection ? 'Transaction rejected by user' : errorMessage,
        });
        throw err;
      }
    },
    [writeContractAsync]
  );

  return { execute, ...state };
}

// ─── useSignDeal ─────────────────────────────────────────────
// Off-chain EIP-712 signing for 2-party confirmation

export function useSignDeal() {
  const { signTypedDataAsync } = useSignTypedData();
  const [state, setState] = useState<{ isPending: boolean; error: string | null }>({
    isPending: false,
    error: null,
  });

  const execute = useCallback(
    async (
      dealId: string,
      amount: string,
      buyer: string,
      seller: string,
      role: 'buyer' | 'seller'
    ) => {
      setState({ isPending: true, error: null });

      try {
        const signature = await signTypedDataAsync({
          domain: DOMAIN,
          types: TYPES,
          primaryType: 'DealRequest',
          message: {
            dealId,
            amount: parseEther(amount || '0'),
            buyer: buyer as `0x${string}`,
            seller: seller as `0x${string}`,
          },
        });

        await saveDealSignature(dealId, role, signature);

        setState({ isPending: false, error: null });
        return signature;
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Signature failed';
        setState({
          isPending: false,
          error: errorMessage.includes('User rejected') ? 'Signature rejected by user' : errorMessage,
        });
        throw err;
      }
    },
    [signTypedDataAsync]
  );

  return { execute, ...state };
}
