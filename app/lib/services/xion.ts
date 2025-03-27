import { prisma } from '../db/client';
import { hash } from 'bcryptjs';

export const treasuryConfig = {
  treasury: process.env.NEXT_PUBLIC_TREASURY_CONTRACT_ADDRESS,
};

export const xionService = {
  // Store user's XION account info
  async storeUserAccount(userId: string, accountAddress: string) {
    // First, check if the user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (existingUser) {
      // Update existing user
      return prisma.user.update({
        where: { id: userId },
        data: { 
          metaAccountId: accountAddress,
          walletAddress: accountAddress 
        },
      });
    } else {
      // Create new user with a temporary password
      const hashedPassword = await hash(Math.random().toString(36), 10);
      return prisma.user.create({
        data: {
          id: userId,
          email: `${userId}@xion.user`,
          password: hashedPassword,
          metaAccountId: accountAddress,
          walletAddress: accountAddress,
          isCreator: false,
          isAdmin: false,
        },
      });
    }
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