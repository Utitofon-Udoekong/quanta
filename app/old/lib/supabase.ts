import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
  },
  db: {
    schema: 'public',
  },
});

// Types for our database tables
export interface ContentData {
  id: string;
  creator_id: string;
  title: string;
  description?: string;
  type: 'VIDEO' | 'AUDIO';
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  price: number;
  pricing_model: 'PER_USE' | 'PER_MINUTE' | 'CUSTOM';
  content_url: string;
  thumbnail_url?: string;
  duration?: number;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface UserData {
  id: string;
  wallet_address: string;
  meta_account_id?: string;
  full_name?: string;
  email?: string;
  is_creator: boolean;
  is_admin: boolean;
  bio?: string;
  avatar?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentData {
  id: string;
  from_user_id: string;
  to_user_id: string;
  content_id?: string;
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  transaction_hash?: string;
  created_at: string;
  updated_at: string;
}

export interface ContentUsageData {
  id: string;
  user_id: string;
  content_id: string;
  payment_id?: string;
  start_time: string;
  end_time?: string;
  duration?: number;
  created_at: string;
  updated_at: string;
} 