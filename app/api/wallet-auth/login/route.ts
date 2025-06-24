import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { createClient } from '@supabase/supabase-js'
import { cookieName } from '@/app/utils/supabase';

const expToExpiresIn = (exp: number) => exp - Math.floor(Date.now() / 1000);

// Helper function to create Supabase client with better timeout settings
const createSupabaseClient = (supabaseUrl: string, serviceRoleSecret: string) => {
    return createClient(supabaseUrl, serviceRoleSecret, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
        },
        global: {
            headers: {
                'X-Client-Info': 'quanta-wallet-auth'
            }
        }
    });
};

// Helper function to check if user exists with retry logic
const checkUserExists = async (supabase: any, wallet_address: string, maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const { data: existingUser, error } = await supabase
                .from('users')
                .select('id, wallet_address')
                .eq('wallet_address', wallet_address)
                .single();
            
            if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
                throw error;
            }
            
            return { existingUser, error: null };
        } catch (error) {
            console.warn(`User check attempt ${attempt} failed:`, error);
            if (attempt === maxRetries) {
                throw error;
            }
            // Wait before retry with exponential backoff
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
    }
};

// Helper function to create auth user with retry logic
const createAuthUser = async (supabase: any, wallet_address: string, maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
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
                // If user already exists, try to get the existing user
                if (createError.message.includes('already been registered') || createError.status === 422) {
                    console.log('User already exists, attempting to sign in...');
                    const { data: existingAuthUser, error: signInError } = await supabase.auth.admin.getUserByEmail(
                        `${wallet_address}@wallet.local`
                    );
                    
                    if (signInError) {
                        throw signInError;
                    }
                    
                    return { authUser: existingAuthUser, error: null };
                }
                throw createError;
            }

            return { authUser, error: null };
        } catch (error) {
            console.warn(`Auth user creation attempt ${attempt} failed:`, error);
            if (attempt === maxRetries) {
                throw error;
            }
            // Wait before retry with exponential backoff
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
    }
};

export async function POST(req: NextRequest) {
    // Validate required environment variables
    const JWT = process.env.SUPABASE_JWT_SECRET;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleSecret = process.env.SUPABASE_SERVICE_ROLE;
    
    if (!JWT) {
        console.error('Missing SUPABASE_JWT_SECRET environment variable');
        return NextResponse.json({ error: 'Server configuration error: JWT secret not found' }, { status: 500 });
    }
    
    if (!supabaseUrl) {
        console.error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
        return NextResponse.json({ error: 'Server configuration error: Supabase URL not found' }, { status: 500 });
    }
    
    if (!serviceRoleSecret) {
        console.error('Missing SUPABASE_SERVICE_ROLE environment variable');
        return NextResponse.json({ error: 'Server configuration error: Service role secret not found' }, { status: 500 });
    }
    
    try {
        const { wallet_address } = await req.json()
        
        if (!wallet_address) {
            return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
        }
        
        const supabase = createSupabaseClient(supabaseUrl, serviceRoleSecret);

        // Check if user exists with retry logic
        const existingUserCheck = await checkUserExists(supabase, wallet_address);

        let authUserId: string;

        if (!existingUserCheck?.existingUser) {
            // Create user in auth.users - trigger will create profile
            const authUserCheck = await createAuthUser(supabase, wallet_address);

            if (authUserCheck?.error) {
                console.error('Auth user creation error:', authUserCheck.error);
                return NextResponse.json({ 
                    error: 'Failed to create user account. Please try again.' 
                }, { status: 500 });
            }

            authUserId = authUserCheck?.authUser?.user?.id;
            
            // Wait a moment for trigger to complete, then check if profile was created
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Check if the trigger created the user profile
            const { data: triggerCreatedUser, error: checkError } = await supabase
                .from('users')
                .select('id, wallet_address')
                .eq('wallet_address', wallet_address)
                .single();
                
            if (!triggerCreatedUser && !checkError) {
                console.log('Trigger did not create user profile, creating manually...');
                // Fallback: manually create the user profile
                const { data: manualUser, error: manualError } = await supabase
                    .from('users')
                    .insert({
                        id: authUserId,
                        wallet_address: wallet_address,
                        wallet_chain: 'xion-testnet-2',
                        wallet_metadata: { address: wallet_address },
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                        last_login_at: new Date().toISOString(),
                        avatar_url: `https://robohash.org/${wallet_address.slice(0, 8)}?set=set4&size=200x200`
                    })
                    .select('id, wallet_address')
                    .single();
                    
                if (manualError) {
                    console.error('Manual user creation error:', manualError);
                    // Don't fail the auth, just log the error
                } else {
                    console.log('Manually created user profile:', manualUser);
                }
            } else if (triggerCreatedUser) {
                console.log('Trigger successfully created user profile:', triggerCreatedUser);
            }
            
            // Update login time
            await supabase
                .from('users')
                .update({ last_login_at: new Date().toISOString() })
                .eq('id', authUserId);

        } else {
            authUserId = existingUserCheck.existingUser?.id;
            
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
        
        const response = NextResponse.json({ 
            token,
            user: {
                id: authUserId,
                wallet_address: wallet_address
            }
        });
        
        // Set the cookie using Next.js Response
        response.cookies.set(cookieName, token, {
            path: "/",
            secure: process.env.NODE_ENV !== "development",
            httpOnly: false,
            sameSite: "strict",
            maxAge: expToExpiresIn(exp),
        });
        
        return response;

    } catch (error) {
        console.error('Login route error:', error);
        
        // Handle specific error types
        if (error instanceof Error) {
            // Check for network/DNS errors
            if (error.message.includes('fetch failed') || 
                error.message.includes('ENOTFOUND') || 
                error.message.includes('ConnectTimeoutError') ||
                error.message.includes('UND_ERR_CONNECT_TIMEOUT')) {
                return NextResponse.json({ 
                    error: 'Unable to connect to database. Please check your internet connection and try again.' 
                }, { status: 503 });
            }
            
            // Check for authentication errors
            if (error.message.includes('AuthRetryableFetchError') || 
                error.message.includes('AuthApiError')) {
                return NextResponse.json({ 
                    error: 'Database connection failed. Please try again in a moment.' 
                }, { status: 503 });
            }
            
            // Check for user already exists error
            if (error.message.includes('already been registered') || 
                error.message.includes('email_exists')) {
                return NextResponse.json({ 
                    error: 'User account already exists. Please try signing in again.' 
                }, { status: 409 });
            }
            
            return NextResponse.json({ 
                error: error.message 
            }, { status: 500 });
        }
        
        return NextResponse.json({ 
            error: 'An unexpected error occurred. Please try again.' 
        }, { status: 500 });
    }
}