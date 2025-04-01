import { supabase } from '@/app/lib/supabase';
import { UserData } from '@/app/lib/supabase';

export const treasuryConfig = {
  treasury: process.env.NEXT_PUBLIC_TREASURY_CONTRACT_ADDRESS,
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL,
  restUrl: process.env.NEXT_PUBLIC_REST_URL,
};

export async function storeUserAccount(userId: string, data: Partial<UserData>) {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .upsert([{
        id: userId,
        ...data,
        updated_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return user;
  } catch (error) {
    console.error('Error storing user account:', error);
    throw error;
  }
}

export async function removeUserAccount(userId: string) {
  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error removing user account:', error);
    throw error;
  }
}

export async function getUser(userId: string) {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      throw error;
    }

    return user;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
}

export async function createPaymentRecord(data: {
  from_user_id: string;
  to_user_id: string;
  content_id?: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  transaction_hash?: string;
}) {
  try {
    const { data: payment, error } = await supabase
      .from('payments')
      .insert([data])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return payment;
  } catch (error) {
    console.error('Error creating payment record:', error);
    throw error;
  }
}

export async function updatePaymentRecord(id: string, data: Partial<{
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  transaction_hash?: string;
}>) {
  try {
    const { data: payment, error } = await supabase
      .from('payments')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return payment;
  } catch (error) {
    console.error('Error updating payment record:', error);
    throw error;
  }
}

export async function getPaymentHistory(userId: string) {
  try {
    const { data: payments, error } = await supabase
      .from('payments')
      .select(`
        *,
        from_user:from_user_id (id, full_name, email),
        to_user:to_user_id (id, full_name, email),
        content:content_id (id, title, type)
      `)
      .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return payments;
  } catch (error) {
    console.error('Error fetching payment history:', error);
    throw error;
  }
}

export async function getPayment(id: string) {
  try {
    const { data: payment, error } = await supabase
      .from('payments')
      .select(`
        *,
        from_user:from_user_id (id, full_name, email),
        to_user:to_user_id (id, full_name, email),
        content:content_id (id, title, type)
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    return payment;
  } catch (error) {
    console.error('Error fetching payment:', error);
    throw error;
  }
} 