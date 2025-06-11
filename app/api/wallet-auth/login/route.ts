
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import cookie from "cookie";
import { createClient } from '@supabase/supabase-js'
import { cookieName } from '@/app/utils/supabase';

const expToExpiresIn = (exp: number) => exp - Math.floor(Date.now() / 1000);

export async function POST(req: NextRequest) {
    const JWT = process.env.supabaseJWTSecret!
    const supabaseUrl = process.env.supabaseUrl!
    const serviceRoleSecret = process.env.supabaseServiceRole!

    try {
        const { wallet_address } = await req.json()
        console.log('wallet_address', wallet_address)
        
        const supabase = createClient(supabaseUrl, serviceRoleSecret, {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false,
            },
        })

        // First check if user exists in our users table (which means auth user exists too)
        const { data: existingUser } = await supabase
            .from('users')
            .select('id, wallet_address')
            .eq('wallet_address', wallet_address)
            .single();

        let authUserId: string;

        if (!existingUser) {
            // Create user in auth.users - trigger will create profile
            const { data: authUser, error: createError } = await supabase.auth.admin.createUser({
                email: `${wallet_address}@wallet.local`,
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
                console.error('Auth user creation error:', createError);
                return NextResponse.json({ error: createError.message }, { status: 500 });
            }

            authUserId = authUser.user.id;
            
            // Wait a moment for trigger to complete, then update login time
            setTimeout(async () => {
                await supabase
                    .from('users')
                    .update({ last_login_at: new Date().toISOString() })
                    .eq('id', authUserId);
            }, 100);

        } else {
            authUserId = existingUser.id;
            
            // Update last login for existing user
            await supabase
                .from('users')
                .update({ last_login_at: new Date().toISOString() })
                .eq('id', authUserId);
        }

        const now = Math.floor(Date.now() / 1000);
        const exp = now + (60 * 60); // 1 hour

        const payload = {
            aud: 'authenticated',
            sub: authUserId,
            email: `${wallet_address}@wallet.local`,
            app_metadata: {
                provider: 'xion',
                providers: ['xion'],
                wallet_address: wallet_address,
            },
            user_metadata: {
                wallet_address: wallet_address,
                address: wallet_address
            },
            role: 'authenticated',
            iss: "supabase",
            iat: now,
            exp: exp
        }

        const token = jwt.sign(payload, JWT);
        
        return new Response(JSON.stringify({ 
            token,
            user: {
                id: authUserId,
                wallet_address: wallet_address
            }
        }), {
            status: 200,
            headers: { 
                'Content-Type': 'application/json',
                'Set-Cookie': cookie.serialize(cookieName, token, {
                    path: "/",
                    secure: process.env.NODE_ENV !== "development",
                    httpOnly: false,
                    sameSite: "strict",
                    maxAge: expToExpiresIn(exp),
                }) 
            },
        });

    } catch (error) {
        console.error('Login route error:', error);
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : 'Unknown error' 
        }, { status: 500 });
    }
}