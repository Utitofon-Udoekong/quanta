'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../utils/supabase/client';
import Script from 'next/script'
import google, { CredentialResponse } from 'google-one-tap'

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const supabase = createClient();
  // generate nonce to use for google id token sign-in
  // const generateNonce = async (): Promise<string[]> => {
  //   const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))))
  //   const encoder = new TextEncoder()
  //   const encodedNonce = encoder.encode(nonce)
  //   const hashBuffer = await crypto.subtle.digest('SHA-256', encodedNonce)
  //   const hashArray = Array.from(new Uint8Array(hashBuffer))
  //   const hashedNonce = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  //   return [nonce, hashedNonce]
  // }
  
  // async function handleSignInWithGoogle(response: CredentialResponse) {
  //   const [nonce, hashedNonce] = await generateNonce();
  //   setHashedNonce(hashedNonce);
  //   const { data, error } = await supabase.auth.signInWithIdToken({
  //     provider: 'google',
  //     token: response.credential,
  //     nonce: nonce,
  //   })
  // }
  // useEffect(() => {
  //   const initializeGoogleOneTap = () => {
  //     console.log('Initializing Google One Tap')
  //     window.addEventListener('load', async () => {
  //       const [nonce, hashedNonce] = await generateNonce()
  //       console.log('Nonce: ', nonce, hashedNonce)
  //       // check if there's already an existing session before initializing the one-tap UI
  //       const { data, error } = await supabase.auth.getSession()
  //       if (error) {
  //         console.error('Error getting session', error)
  //       }
  //       if (data.session) {
  //         router.push('/')
  //         return
  //       }
  //       /* global google */
  //       google.accounts.id.initialize({
  //         client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
  //         callback: async (response: CredentialResponse) => {
  //           try {
  //             // send id token returned in response.credential to supabase
  //             const { data, error } = await supabase.auth.signInWithIdToken({
  //               provider: 'google',
  //               token: response.credential,
  //               nonce,
  //             })
  //             if (error) throw error
  //             console.log('Session data: ', data)
  //             console.log('Successfully logged in with Google One Tap')
  //             // redirect to protected page
  //             router.push('/')
  //           } catch (error) {
  //             console.error('Error logging in with Google One Tap', error)
  //           }
  //         },
  //         nonce: hashedNonce,
  //         // with chrome's removal of third-party cookiesm, we need to use FedCM instead (https://developers.google.com/identity/gsi/web/guides/fedcm-migration)
  //         use_fedcm_for_prompt: true,
  //       })
  //       google.accounts.id.prompt() // Display the One Tap UI
  //     })
  //   }
  //   initializeGoogleOneTap()
  //   return () => window.removeEventListener('load', initializeGoogleOneTap)
  // }, [])
  
  // const handleAuth = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setLoading(true);
  //   setError(null);
    
  //   try {
  //     if (isSignUp) {
  //       const { error } = await supabase.auth.signUp({
  //         email,
  //         password,
  //         options: {
  //           emailRedirectTo: `${window.location.origin}/api/auth/callback`,
  //         },
  //       });
        
  //       if (error) throw error;
  //       alert('Check your email for the confirmation link!');
  //     } else {
  //       const { error } = await supabase.auth.signInWithPassword({
  //         email,
  //         password,
  //       });
        
  //       if (error) throw error;
  //       router.push('/dashboard');
  //       router.refresh();
  //     }
  //   } catch (err: any) {
  //     setError(err.message || 'An error occurred during authentication');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleSignInWithGoogle = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    // console.log(`${window.location.origin}/api/auth/callback`)
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:3000/api/auth/callback',
      },
    })
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      window.location.href = data.url;
    }
  }

  
  
  return (
    // <>
    //   <div id="g_id_onload"
    //     data-client_id="504005348021-mg07cuielfsi3n49bcg6164173g10ha9.apps.googleusercontent.com"
    //     data-context="signin"
    //     data-ux_mode="popup"
    //     data-callback="handleSignInWithGoogle"
    //     data-nonce={hashedNonce}
    //     data-auto_prompt="false">
    //   </div>

    //   <div className="g_id_signin"
    //       data-type="standard"
    //       data-shape="rectangular"
    //       data-theme="outline"
    //       data-text="continue_with"
    //       data-size="large"
    //       data-logo_alignment="left">
    //   </div>
    // </>
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isSignUp ? 'Create your account' : 'Sign in to your account'}
          </h2>
        </div>
        
        {error && (
          <div className="bg-red-50 p-4 rounded-md">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        
        <form className="mt-8 space-y-6">

          <button 
          type="submit"
          disabled={loading}
          className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          onClick={handleSignInWithGoogle}>Sign in with Google</button>

          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {loading ? 'Processing...' : isSignUp ? 'Sign up' : 'Sign in'}
            </button>
          </div>
          
          <div className="text-center">
            <button
              type="button"
              className="text-sm text-indigo-600 hover:text-indigo-500"
              onClick={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}