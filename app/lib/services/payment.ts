import { prisma } from '@/app/lib/db/client';

export const paymentService = {
  async createPayment(fromUserId: string, toUserId: string, amount: number, contentId?: string) {
    try {
      const payment = await prisma.payment.create({
        data: {
          fromUserId,
          toUserId,
          contentId,
          amount,
          status: 'PENDING',
        },
      });
      return payment;
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  },

  async updatePaymentStatus(paymentId: string, status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED') {
    try {
      const payment = await prisma.payment.update({
        where: { id: paymentId },
        data: { status },
      });
      return payment;
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  },

  async getPaymentStatus(paymentId: string) {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
      });
      return payment?.status || 'FAILED';
    } catch (error) {
      console.error('Error getting payment status:', error);
      throw error;
    }
  },

  async getPaymentHistory(userId: string) {
    try {
      const payments = await prisma.payment.findMany({
        where: {
          OR: [
            { fromUserId: userId },
            { toUserId: userId },
          ],
        },
        include: {
          fromUser: {
            select: {
              name: true,
              walletAddress: true,
            },
          },
          toUser: {
            select: {
              name: true,
              walletAddress: true,
            },
          },
          content: {
            select: {
              title: true,
              type: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      return payments;
    } catch (error) {
      console.error('Error getting payment history:', error);
      throw error;
    }
  },
}; 