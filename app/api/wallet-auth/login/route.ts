import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { createClient } from '@supabase/supabase-js'
import { cookieName } from '@/app/utils/supabase';

const expToExpiresIn = (exp: number) => exp - Math.floor(Date.now() / 1000);

// Xion wallet address validation
const isValidWalletAddress = (address: string): boolean => {
    const isValid = typeof address === 'string' && 
           address.length >= 40 && 
           address.length <= 70 &&
           /^xion1[a-zA-Z0-9]{35,60}$/.test(address);
    
    return isValid;
};

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

// Helper function to check if user exists - simplified without retry logic
const checkUserExists = async (supabase: any, wallet_address: string) => {
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
        console.warn('User check failed:', error);
        throw error;
    }
};

// Helper function to create auth user - simplified without retry logic
const createAuthUser = async (supabase: any, wallet_address: string) => {
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
            // If user already exists, get the user ID from our database
            if (createError.message.includes('already been registered') || createError.status === 422) {
                //console.log('User already exists in auth system, proceeding with existing user...');
                
                const userId = await getUserIdByWalletAddress(supabase, wallet_address);
                return { 
                    authUser: { 
                        user: {
                            id: userId,
                            email: `${wallet_address}@wallet.local`,
                            app_metadata: {
                                provider: "xion",
                                providers: ["xion"],
                                wallet_address: wallet_address,
                                chain: "xion-testnet-2",
                            },
                            user_metadata: { 
                                address: wallet_address 
                            }
                        }
                    }, 
                    error: null 
                };
            }
            throw createError;
        }

        return { authUser, error: null };
    } catch (error) {
        console.warn('Auth user creation failed:', error);
        throw error;
    }
};

// Helper function to get user ID by wallet address
const getUserIdByWalletAddress = async (supabase: any, wallet_address: string) => {
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

export async function POST(req: NextRequest) {
    // Validate required environment variables
    const JWT = process.env.SUPABASE_JWT_SECRET;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleSecret = process.env.SUPABASE_SERVICE_ROLE;
    
    if (!JWT || !supabaseUrl || !serviceRoleSecret) {
        console.error('Missing required environment variables');
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    
    try {
        const { wallet_address } = await req.json()
        
        // Input validation
        if (!wallet_address || !isValidWalletAddress(wallet_address)) {
            return NextResponse.json({ error: 'Invalid wallet address format' }, { status: 400 });
        }
        
        const supabase = createSupabaseClient(supabaseUrl, serviceRoleSecret);

        // Check if user exists
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
            
            // Check if the trigger created the user profile (without waiting)
            const { data: triggerCreatedUser, error: checkError } = await supabase
                .from('users')
                .select('id, wallet_address')
                .eq('wallet_address', wallet_address)
                .single();
                
            if (!triggerCreatedUser && !checkError) {
                //console.log('Trigger did not create user profile, creating manually...');
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
                    //console.log('Manually created user profile:', manualUser);
                }
            } else if (triggerCreatedUser) {
                //console.log('Trigger successfully created user profile:', triggerCreatedUser);
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
        
        // Secure cookie settings
        response.cookies.set(cookieName, token, {
            path: "/",
            secure: process.env.NODE_ENV === "production", // Only HTTPS in production
            httpOnly: true, // ✅ Prevent XSS attacks
            sameSite: "strict", // ✅ Prevent CSRF attacks
            maxAge: expToExpiresIn(exp),
        });
        
        return response;

    } catch (error) {
        console.error('Login route error:', error);
        
        // Generic error response for security
        return NextResponse.json({ 
            error: 'Authentication failed. Please try again.' 
        }, { status: 500 });
    }
}