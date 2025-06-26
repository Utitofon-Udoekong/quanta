import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
    }
    
    try {
        const { wallet_address } = await req.json();
        
        if (!wallet_address) {
            return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
        }
        
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceRoleSecret = process.env.SUPABASE_SERVICE_ROLE;
        
        if (!supabaseUrl || !serviceRoleSecret) {
            return NextResponse.json({ error: 'Missing environment variables' }, { status: 500 });
        }
        
        const supabase = createClient(supabaseUrl, serviceRoleSecret, {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false,
            },
        });
        
        // Check if user already exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('id, wallet_address, created_at')
            .eq('wallet_address', wallet_address)
            .single();
            
        if (existingUser) {
            return NextResponse.json({
                message: 'User already exists',
                user: existingUser,
                trigger_status: 'existing_user'
            });
        }
        
        // Create test user to trigger the function
        const { data: authUser, error: createError } = await supabase.auth.admin.createUser({
            email: `${wallet_address}-test@wallet.local`,
            email_confirm: true,
            app_metadata: {
                provider: "xion",
                providers: ["xion"],
                wallet_address: wallet_address,
                chain: "xion-testnet-2",
            },
            user_metadata: { 
                address: wallet_address 
            }
        });
        
        if (createError) {
            return NextResponse.json({ error: createError.message }, { status: 500 });
        }
        
        // Wait for trigger
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if profile was created
        const { data: createdUser, error: checkError } = await supabase
            .from('users')
            .select('id, wallet_address, created_at')
            .eq('wallet_address', wallet_address)
            .single();
            
        // Clean up test user
        await supabase.auth.admin.deleteUser(authUser.user.id);
        
        return NextResponse.json({
            message: 'Trigger test completed',
            auth_user_created: !!authUser,
            profile_created: !!createdUser,
            user: createdUser,
            trigger_status: createdUser ? 'success' : 'failed',
            error: checkError?.message
        });
        
    } catch (error) {
        // console.error('Trigger debug error:', error);
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : 'Unknown error' 
        }, { status: 500 });
    }
} 