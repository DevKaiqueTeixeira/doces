import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.NEXT_PUBLIC_SUPABASE_URL
const supabasePublishableKey = import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

export function hasSupabasePublicConfig() {
  return Boolean(supabaseUrl && supabasePublishableKey)
}

export const supabase =
  hasSupabasePublicConfig()
    ? createClient(supabaseUrl, supabasePublishableKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      })
    : null

export function getSupabasePublicEnv() {
  return {
    supabaseUrl,
    supabasePublishableKey,
  }
}
