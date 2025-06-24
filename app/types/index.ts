export interface WalletUser {
  bech32Address: string;
  wallet_chain?: string;
  wallet_metadata?: Record<string, any>;
}

export interface UserData {
  id: string;
  wallet_address: string;
  wallet_chain?: string;
  wallet_metadata?: Record<string, any>;
  username?: string;
  avatar_url?: string;
  bio?: string;
  last_login_at?: string;
  created_at?: string;
  updated_at?: string;
  is_admin?: boolean;
  subscription_price?: number;
  subscription_currency?: string;
  subscription_type?: string;
}


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
  status: 'succeeded' | 'failed' | 'pending' | 'refunded' | null;
  payment_method: string;
  payment_date: string;
  created_at: string;
  transaction_hash?: string | null;
}

export interface Token {
  base: string;
  symbol: string;
  icon: string;
}

export type ContentKind = 'article' | 'video' | 'audio';

export interface ContentBase {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  published: boolean;
  is_premium: boolean;
  user_id: string;
  author?: {
    id: string;
    username?: string;
    avatar_url?: string;
    wallet_address?: string;
    subscription_price?: number;
    subscription_currency?: string;
    subscription_type?: string;
  };
  kind: ContentKind;
  views?: number;
  release_date?: string;
  likeCount?: number;
  likedByUser?: boolean;
  commentsCount?: number;
}

export interface ArticleContent extends ContentBase {
  kind: 'article';
  content?: string;
  excerpt?: string;
  category?: string;
  thumbnail_url?: string;
}

export interface VideoContent extends ContentBase {
  kind: 'video';
  description?: string;
  video_url?: string;
  thumbnail_url?: string;
  duration?: number;
  category?: string;
}

export interface AudioContent extends ContentBase {
  kind: 'audio';
  description?: string;
  audio_url?: string;
  duration?: number;
  category?: string;
  thumbnail_url?: string;
}

export type Content = ArticleContent | VideoContent | AudioContent;
