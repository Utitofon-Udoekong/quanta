import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
    const JWT = process.env.supabaseJWTSecret!
    const supabaseUrl = process.env.supabaseUrl!
    const serviceRoleSecret = process.env.supabaseServiceRole!
    
    try {
        const { walletAddress } = await req.json()
        const supabase = createClient(supabaseUrl, serviceRoleSecret, {
            auth: {
              persistSession: false,
              autoRefreshToken: false,
              detectSessionInUrl: false,
            },
          })

        const { data: user, error } = await supabase.auth.admin.createUser({
            email: `${walletAddress}@wallet.local`,
            app_metadata: {
                provider: "xion",
                providers: ["xion"],
                // store authorization info in app_metadata
                // because it cannot be modified by users
                walletAddress: walletAddress,
                chain: "xion-testnet-2",
              },
            user_metadata: { address: walletAddress }
        })

        // Check if user exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('wallet_address', walletAddress)
            .single();

        if (!existingUser) {
            await supabase
                .from('users')
                .insert({
                    id: user?.user?.id,
                    wallet_address: walletAddress
                });
        } else {
            await supabase
                .from('users')
                .update({
                    last_login_at: new Date().toISOString()
                })
                .eq('wallet_address', walletAddress);
        }

        const token = jwt.sign({
            address: walletAddress, // this will be read by RLS policy
            sub: user?.user?.id,
            aud: 'authenticated'
        }, JWT, { expiresIn: 60 * 2 })

        return NextResponse.json({ token })

    } catch (error) {
        return NextResponse.json({ error: error }, { status: 500 })
    }

}