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
            user_metadata: { address: walletAddress }
        })

        await supabase
            .from('users')
            .update({
                last_login_at: new Date().toISOString(),
                id: user?.user?.id, // same uuid as auth.users table
            })
            .eq('wallet_address', walletAddress)

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