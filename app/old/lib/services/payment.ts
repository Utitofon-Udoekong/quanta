import { supabase } from '@/app/old/lib/supabase';
import { PaymentData } from '@/app/old/lib/supabase';

export async function createPaymentRecord(data: Omit<PaymentData, 'id' | 'created_at' | 'updated_at'>) {
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

export async function updatePaymentRecord(id: string, data: Partial<PaymentData>) {
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