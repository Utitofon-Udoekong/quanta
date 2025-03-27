"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useAbstraxionAccount, useAbstraxionSigningClient, useAbstraxionClient } from "@burnt-labs/abstraxion";
import { xionService } from '@/app/lib/services/xion';
import { signIn } from 'next-auth/react';

const TOKEN_DENOM = "factory/xion1ka5gdcv4m7kfzxkllapqdflenwe0fv8ftm357r/emp";
const DENOM_DISPLAY_NAME = "EMP";

interface XionContextType {
  account: any;
  loading: boolean;
  storeAccount: (userId: string) => Promise<any>;
  removeAccount: (userId: string) => Promise<any>;
  processPayment: (fromUserId: string, toUserId: string, amount: number, contentId: string) => Promise<any>;
  getPaymentStatus: (paymentId: string) => Promise<string>;
  getPaymentHistory: (userId: string) => Promise<any>;
  pendingUserId: string | null;
  setPendingUserId: (userId: string | null) => void;
}

const XionContext = createContext<XionContextType | null>(null);

export function XionProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const { data: account } = useAbstraxionAccount();
  const { client: signingClient } = useAbstraxionSigningClient();
  const { client: queryClient } = useAbstraxionClient();

  // Handle account creation
  useEffect(() => {
    if (account?.bech32Address && pendingUserId) {
      console.log('creating account', account.bech32Address, pendingUserId);
      handleAccountCreation(account.bech32Address, pendingUserId);
    }
  }, [account?.bech32Address, pendingUserId]);

  const handleAccountCreation = async (accountAddress: string, userId: string) => {
    try {
      // Store the account in our database
      const user = await storeAccount(userId);
      
      // Sign in the user with NextAuth
      const result = await signIn('credentials', {
        email: user.email,
        password: user.password,
        redirect: false,
      });

      if (result?.error) {
        console.error('Failed to sign in:', result.error);
        throw new Error('Failed to sign in');
      }

      setPendingUserId(null);
    } catch (error) {
      console.error('Error handling account creation:', error);
      setPendingUserId(null);
    }
  };

  const storeAccount = async (userId: string) => {
    if (!account?.bech32Address) {
      throw new Error('No Abstraxion account found');
    }
    return xionService.storeUserAccount(userId, account.bech32Address);
  };

  const removeAccount = async (userId: string) => {
    return xionService.removeUserAccount(userId);
  };

  const processPayment = async (
    fromUserId: string,
    toUserId: string,
    amount: number,
    contentId: string
  ) => {
    setLoading(true);
    try {
      // Create payment record
      const payment = await xionService.createPaymentRecord({
        fromUserId,
        toUserId,
        contentId,
        amount,
        status: 'PENDING',
      });

      if (!signingClient) {
        throw new Error('Abstraxion client not initialized');
      }

      // Get user addresses
      const fromUser = await xionService.getUser(fromUserId);
      const toUser = await xionService.getUser(toUserId);

      if (!fromUser?.metaAccountId || !toUser?.metaAccountId) {
        throw new Error('Meta accounts not found for one or both users');
      }

      // Process payment using Abstraxion client
      const result = await signingClient.sendTokens(
        fromUser.metaAccountId,
        toUser.metaAccountId,
        [{ denom: TOKEN_DENOM, amount: amount.toString() }],
        1.5
      );

      if (result.code !== 0) {
        throw new Error('Transaction failed');
      }

      // Update payment record
      await xionService.updatePaymentRecord(payment.id, {
        status: 'COMPLETED',
        transactionHash: result.transactionHash,
      });

      return payment;
    } catch (error) {
      console.error('Error processing payment:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getPaymentStatus = async (paymentId: string) => {
    const payment = await xionService.getPayment(paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.transactionHash && queryClient) {
      const tx = await queryClient.getTx(payment.transactionHash);
      if (!tx) {
        return 'FAILED';
      }
      return tx.code === 0 ? 'COMPLETED' : 'FAILED';
    }

    return payment.status;
  };

  const value = {
    account,
    loading,
    storeAccount,
    removeAccount,
    processPayment,
    getPaymentStatus,
    getPaymentHistory: xionService.getPaymentHistory,
    pendingUserId,
    setPendingUserId,
  };

  return (
    <XionContext.Provider value={value}>
      {children}
    </XionContext.Provider>
  );
}

export function useXion() {
  const context = useContext(XionContext);
  if (!context) {
    throw new Error('useXion must be used within a XionProvider');
  }
  return context;
} 