export interface UserData {
  id: string;
  email?: string;
  created_at?: string;
  updated_at?: string;
  full_name?: string;
  avatar_url?: string;
  wallet_address?: string;
  bio?: string;
  is_admin?: boolean;
}

export type Article = {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  category?: string;
  created_at: string;
  updated_at: string;
  published: boolean;
  is_premium: boolean;
  user_id: string;
  thumbnail_url?: string;
  author?: {
    id: string;
    full_name?: string;
    avatar_url?: string;
    wallet_address?: string;
  };
};

export type Video = {
  id: string;
  title: string;
  description?: string;
  video_url: string;
  thumbnail_url?: string;
  duration?: number;
  category?: string;
  created_at: string;
  updated_at: string;
  published: boolean;
  is_premium: boolean;
  user_id: string;
  author?: {
    id: string;
    full_name?: string;
    avatar_url?: string;
    wallet_address?: string;
  };
};

export type Audio = {
  id: string;
  title: string;
  description?: string;
  audio_url: string;
  duration?: number;
  category?: string;
  created_at: string;
  updated_at: string;
  published: boolean;
  is_premium: boolean;
  user_id: string;
  thumbnail_url?: string;
  author?: {
    id: string;
    full_name?: string;
    avatar_url?: string;
    wallet_address?: string;
  };
};

export type Wallet = {
  id: string;
  user_id: string;
  wallet_address: string;
  wallet_type: string;
  balance: number;
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: string;
  name: string;
  description?: string;
  created_at: string;
};

export type Transaction = {
  id: string;
  user_id: string;
  wallet_id: string;
  amount: number;
  currency: string;
  transaction_type: string;
  status: string;
  reference?: string;
  created_at: string;
};

export type ContentView = {
  id: string;
  content_id: string;
  content_type: 'article' | 'video' | 'audio';
  user_id: string;
  viewed_at: string;
};

export type Earning = {
  id: string;
  user_id: string;
  content_id: string;
  content_type: 'article' | 'video' | 'audio';
  amount: number;
  currency: string;
  source: string;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      users: {
        Row: UserData;
        Insert: Omit<UserData, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserData, 'id' | 'created_at' | 'updated_at'>>;
      };
      articles: {
        Row: Article;
        Insert: Omit<Article, 'id' | 'created_at' | 'updated_at' | 'author'>;
        Update: Partial<Omit<Article, 'id' | 'created_at' | 'updated_at' | 'author'>>;
      };
      videos: {
        Row: Video;
        Insert: Omit<Video, 'id' | 'created_at' | 'updated_at' | 'author'>;
        Update: Partial<Omit<Video, 'id' | 'created_at' | 'updated_at' | 'author'>>;
      };
      audio: {
        Row: Audio;
        Insert: Omit<Audio, 'id' | 'created_at' | 'updated_at' | 'author'>;
        Update: Partial<Omit<Audio, 'id' | 'created_at' | 'updated_at' | 'author'>>;
      };
      wallets: {
        Row: Wallet;
        Insert: Omit<Wallet, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Wallet, 'id' | 'created_at' | 'updated_at'>>;
      };
      subscriptions: {
        Row: Subscription;
        Insert: Omit<Subscription, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Subscription, 'id' | 'created_at' | 'updated_at'>>;
      };
      categories: {
        Row: Category;
        Insert: Omit<Category, 'id' | 'created_at'>;
        Update: Partial<Omit<Category, 'id' | 'created_at'>>;
      };
      transactions: {
        Row: Transaction;
        Insert: Omit<Transaction, 'id' | 'created_at'>;
        Update: Partial<Omit<Transaction, 'id' | 'created_at'>>;
      };
      content_views: {
        Row: ContentView;
        Insert: Omit<ContentView, 'id' | 'viewed_at'>;
        Update: Partial<Omit<ContentView, 'id' | 'viewed_at'>>;
      };
      earnings: {
        Row: Earning;
        Insert: Omit<Earning, 'id' | 'created_at'>;
        Update: Partial<Omit<Earning, 'id' | 'created_at'>>;
      };
    };
  };
};

// Subscription types
export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: {
    features: string[];
  };
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'canceled' | 'expired' | 'past_due';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  created_at: string;
  updated_at: string;
  payment_method: string | null;
  payment_status: 'succeeded' | 'failed' | 'pending' | null;
  last_payment_date: string | null;
  next_payment_date: string | null;
  plan?: SubscriptionPlan;
}

export interface SubscriptionPayment {
  id: string;
  subscription_id: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'failed' | 'pending' | 'refunded';
  payment_method: string | null;
  payment_date: string;
  created_at: string;
}