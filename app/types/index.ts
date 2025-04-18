export type Article = {
    id: string;
    title: string;
    content: string;
    excerpt?: string;
    created_at: string;
    updated_at: string;
    published: boolean;
    is_premium: boolean;
    category_id?: string;
    user_id: string;
  };
  
  export type Video = {
    id: string;
    title: string;
    description?: string;
    video_url: string;
    thumbnail_url?: string;
    duration?: number;
    created_at: string;
    updated_at: string;
    published: boolean;
    is_premium: boolean;
    category_id?: string;
    user_id: string;
  };
  
  export type Audio = {
    id: string;
    title: string;
    description?: string;
    audio_url: string;
    duration?: number;
    created_at: string;
    updated_at: string;
    published: boolean;
    is_premium: boolean;
    category_id?: string;
    user_id: string;
  };
  
  export type Wallet = {
    id: string;
    user_id: string;
    wallet_address?: string;
    wallet_type: string;
    balance: number;
    created_at: string;
    updated_at: string;
  };
  
  export type Subscription = {
    id: string;
    user_id: string;
    plan_type: string;
    status: string;
    start_date: string;
    end_date: string;
    payment_method?: string;
    amount: number;
    currency: string;
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
    viewer_id?: string;
    viewed_at: string;
    created_at: string;
  };
  
  export type Earning = {
    id: string;
    user_id: string;
    content_id: string;
    content_type: 'article' | 'video' | 'audio';
    amount: number;
    currency: string;
    source: string;
    transaction_id?: string;
    created_at: string;
  };
  
  export type Database = {
    public: {
      Tables: {
        articles: {
          Row: Article;
          Insert: Omit<Article, 'id' | 'created_at' | 'updated_at'>;
          Update: Partial<Omit<Article, 'id' | 'created_at' | 'updated_at'>>;
        };
        videos: {
          Row: Video;
          Insert: Omit<Video, 'id' | 'created_at' | 'updated_at'>;
          Update: Partial<Omit<Video, 'id' | 'created_at' | 'updated_at'>>;
        };
        audio: {
          Row: Audio;
          Insert: Omit<Audio, 'id' | 'created_at' | 'updated_at'>;
          Update: Partial<Omit<Audio, 'id' | 'created_at' | 'updated_at'>>;
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
          Insert: Omit<ContentView, 'id' | 'created_at' | 'viewed_at'>;
          Update: Partial<Omit<ContentView, 'id' | 'created_at' | 'viewed_at'>>;
        };
        earnings: {
          Row: Earning;
          Insert: Omit<Earning, 'id' | 'created_at'>;
          Update: Partial<Omit<Earning, 'id' | 'created_at'>>;
        };
      };
    };
  };