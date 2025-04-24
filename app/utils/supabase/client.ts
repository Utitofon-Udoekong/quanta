import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.supabaseUrl!,
    process.env.supabaseAnonKey!
  )
}