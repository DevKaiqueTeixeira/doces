import { createClient } from '@supabase/supabase-js'

function getSupabaseEnv() {
  return {
    url: process.env.SUPABASE_URL,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  }
}

export function hasSupabaseConfig() {
  const { url, serviceRoleKey } = getSupabaseEnv()
  return Boolean(url && serviceRoleKey)
}

export function getSupabaseAdmin() {
  const { url, serviceRoleKey } = getSupabaseEnv()

  if (!url || !serviceRoleKey) {
    throw new Error('Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no arquivo .env.')
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
