// Type definitions for NovyPay integration
export type PaymentStatus = 'pending' | 'success' | 'failed' | 'cancelled';
export type TokenType = 'USDC' | 'XION';
export type SubscriptionType = 'monthly' | 'yearly' | 'one-time';

// NovyPay payment request interface
export interface NovyPayPaymentRequest {
  amount: number;
  currency: string;
  token_type: TokenType;
  email: string;
  fullname: string;
  phone_country_code?: string;
  phone_number?: string;
  address_line1?: string;
  city?: string;
  country?: string;
}

// NovyPay payment response interface
export interface NovyPayPaymentResponse {
  status: 'success' | 'error';
  reference?: string;
  redirect_url?: string;
  error?: string;
}

// Subscription payment record interface
export interface SubscriptionPaymentRecord {
  id: string;
  subscription_id: string;
  novypay_reference: string;
  amount: number;
  currency: string;
  token_type: TokenType;
  status: PaymentStatus;
  payment_date: string;
  created_at: string;
  updated_at: string;
  user_email?: string;
  user_fullname?: string;
}

// Subscription interface
export interface Subscription {
  id: string;
  creator_id: string;
  subscriber_id: string;
  type: SubscriptionType;
  status: 'pending' | 'active' | 'cancelled' | 'expired';
  amount: number;
  currency: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
  last_renewed_at?: string;
}

// Creator subscription settings interface
export interface CreatorSubscriptionSettings {
  subscription_price: number;
  subscription_currency: string;
  subscription_type: SubscriptionType;
}

// Helper function to format subscription price for display
export function formatSubscriptionPrice(price: number, currency: string): string {
  const symbol = currency === 'USD' ? '$' : currency;
  return `${symbol}${price.toFixed(2)}`;
}

// Helper function to get subscription period text
export function getSubscriptionPeriod(type: SubscriptionType): string {
  switch (type) {
    case 'monthly':
      return 'per month';
    case 'yearly':
      return 'per year';
    case 'one-time':
      return 'one-time';
    default:
      return '';
  }
}

// Helper function to check if subscription is active
export function isSubscriptionActive(subscription: Subscription): boolean {
  if (subscription.status !== 'active') return false;
  
  // Check if subscription has expired
  const expiresAt = new Date(subscription.expires_at);
  const now = new Date();
  
  return expiresAt > now;
}

// Helper function to calculate subscription expiration date
export function calculateExpirationDate(type: SubscriptionType, fromDate?: Date): Date {
  const startDate = fromDate || new Date();
  const expirationDate = new Date(startDate);
  
  switch (type) {
    case 'monthly':
      expirationDate.setMonth(expirationDate.getMonth() + 1);
      break;
    case 'yearly':
      expirationDate.setFullYear(expirationDate.getFullYear() + 1);
      break;
    case 'one-time':
      // One-time subscriptions don't expire (set to far future)
      expirationDate.setFullYear(expirationDate.getFullYear() + 100);
      break;
  }
  
  return expirationDate;
} 