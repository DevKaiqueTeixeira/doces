import { createClient } from '@supabase/supabase-js'

function getSupabaseEnv() {
  return {
    url: process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey:
      process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    secretKey: process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY,
  }
}

export function hasSupabasePublicConfig() {
  const { publishableKey, url } = getSupabaseEnv()
  return Boolean(url && publishableKey)
}

export function hasSupabaseAdminConfig() {
  const { secretKey, url } = getSupabaseEnv()
  return Boolean(url && secretKey)
}

function createSupabaseClient(url: string, key: string) {
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export function getSupabasePublicClient() {
  const { publishableKey, url } = getSupabaseEnv()

  if (!url || !publishableKey) {
    throw new Error('Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY no .env.')
  }

  return createSupabaseClient(url, publishableKey)
}

export function getSupabaseAdmin() {
  const { secretKey, url } = getSupabaseEnv()

  if (!url || !secretKey) {
    throw new Error('Defina SUPABASE_URL e SUPABASE_SECRET_KEY no arquivo .env.')
  }

  return createSupabaseClient(url, secretKey)
}

export function getSupabaseQueryClient() {
  if (hasSupabaseAdminConfig()) {
    return getSupabaseAdmin()
  }

  return getSupabasePublicClient()
}

export function getSupabaseProbeConfig() {
  const { publishableKey, secretKey, url } = getSupabaseEnv()

  if (!url) {
    throw new Error('Defina NEXT_PUBLIC_SUPABASE_URL no .env.')
  }

  if (secretKey) {
    return {
      key: secretKey,
      mode: 'admin' as const,
      url,
    }
  }

  if (!publishableKey) {
    throw new Error('Defina NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY no .env.')
  }

  return {
    key: publishableKey,
    mode: 'public' as const,
    url,
  }
}
