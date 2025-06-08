import { getSupabase } from '@/app/utils/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { walletAddress } = await req.json()
  const nonce = Math.floor(Math.random() * 1000000)

  const supabase = await getSupabase()

  await supabase
  .from('users')
  .update({ auth: {
              genNonce: nonce,
              lastAuth: new Date().toISOString(),
              lastAuthStatus: "pending"
          }}) 
  .eq('wallet_address', walletAddress)

  return NextResponse.json({ nonce })
}