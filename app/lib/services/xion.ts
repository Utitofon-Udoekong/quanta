import { prisma } from '../db/client';
export const treasuryConfig = {
  treasury: process.env.NEXT_PUBLIC_TREASURY_CONTRACT_ADDRESS,
};
export const xionService = {
  // Store user's XION account info
  async storeUserAccount(userId: string, accountAddress: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { 
        metaAccountId: accountAddress,
        walletAddress: accountAddress 
      },
    });
  },

  // Remove user's XION account info
  async removeUserAccount(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { 
        metaAccountId: null,
        walletAddress: null 
      },
    });
  },

  // Get user by ID
  async getUser(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: { metaAccountId: true },
    });
  },

  // Store payment record
  async createPaymentRecord(data: {
    fromUserId: string;
    toUserId: string;
    contentId: string;
    amount: number;
    status: 'PENDING' | 'COMPLETED' | 'FAILED';
    transactionHash?: string;
  }) {
    return prisma.payment.create({
      data,
    });
  },

  // Update payment record
  async updatePaymentRecord(paymentId: string, data: {
    status: 'PENDING' | 'COMPLETED' | 'FAILED';
    transactionHash?: string;
  }) {
    return prisma.payment.update({
      where: { id: paymentId },
      data,
    });
  },

  // Get payment history
  async getPaymentHistory(userId: string) {
    return prisma.payment.findMany({
      where: {
        OR: [
          { fromUserId: userId },
          { toUserId: userId },
        ],
      },
      include: {
        content: true,
        fromUser: {
          select: {
            name: true,
            email: true,
          },
        },
        toUser: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  },

  // Get payment by ID
  async getPayment(paymentId: string) {
    return prisma.payment.findUnique({
      where: { id: paymentId },
    });
  },
}; 