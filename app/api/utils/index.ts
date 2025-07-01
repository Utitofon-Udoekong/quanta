export const getUserIdByWalletAddress = async (supabase: any, wallet_address: string) => {
    const { data: user, error } = await supabase
        .from('users')
        .select('id')
        .eq('wallet_address', wallet_address)
        .single();
    
    if (error || !user) {
        throw new Error('User not found in database');
    }
    
    return user.id;
};