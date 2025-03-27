"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { useUserStore } from '@/app/store/use-user-store';
import { xionService } from '@/app/lib/services/xion';

interface XionContextType {
  storeAccount: (account: any) => Promise<void>;
  removeAccount: () => Promise<void>;
  processPayment: (to: string, amount: number) => Promise<void>;
  getPaymentStatus: (paymentId: string) => Promise<string>;
  getPaymentHistory: () => Promise<any[]>;
}

const XionContext = createContext<XionContextType | null>(null);

export function XionProvider({ children }: { children: React.ReactNode }) {
  const { setUser, clearUser } = useUserStore();
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  useEffect(() => {
    const handleAccountCreation = async (account: any) => {
      if (account && pendingUserId) {
        try {
          await storeAccount(account);
          setPendingUserId(null);
        } catch (error) {
          console.error('Error handling account creation:', error);
        }
      }
    };

    handleAccountCreation(pendingUserId);
  }, [pendingUserId]);

  const storeAccount = async (account: any) => {
    try {
      const user = await xionService.storeUserAccount(pendingUserId!, account.bech32Address);
      setUser(user);
    } catch (error) {
      console.error('Error storing account:', error);
      throw error;
    }
  };

  const removeAccount = async () => {
    try {
      await xionService.removeUserAccount(pendingUserId!);
      clearUser();
    } catch (error) {
      console.error('Error removing account:', error);
      throw error;
    }
  };

  const processPayment = async (to: string, amount: number) => {
    try {
      const payment = await xionService.createPaymentRecord({
        fromUserId: pendingUserId!,
        toUserId: to,
        contentId: 'temp',
        amount,
        status: 'PENDING',
      });
      await xionService.updatePaymentRecord(payment.id, {
        status: 'COMPLETED',
      });
    } catch (error) {
      console.error('Error processing payment:', error);
      throw error;
    }
  };

  const getPaymentStatus = async (paymentId: string) => {
    try {
      const payment = await xionService.getPayment(paymentId);
      return payment?.status || 'FAILED';
    } catch (error) {
      console.error('Error getting payment status:', error);
      throw error;
    }
  };

  const getPaymentHistory = async () => {
    try {
      return await xionService.getPaymentHistory(pendingUserId!);
    } catch (error) {
      console.error('Error getting payment history:', error);
      throw error;
    }
  };

  return (
    <XionContext.Provider
      value={{
        storeAccount,
        removeAccount,
        processPayment,
        getPaymentStatus,
        getPaymentHistory,
      }}
    >
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