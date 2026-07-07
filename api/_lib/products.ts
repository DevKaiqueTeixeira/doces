import { getSupabaseAdmin } from '../../server/supabase.js'

import { formatProduto, parseProductPayload } from './domain.js'
import type { ProductCreateRow } from './domain.js'

export async function listActiveProducts() {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('produtos')
    .select('id, nome, preco, created_at, updated_at')
    .eq('ativo', true)
    .order('nome', { ascending: true })

  if (error) {
    throw error
  }

  return (data ?? []).map((produto) => formatProduto(produto as ProductCreateRow))
}

export async function createProductRecord(body: unknown) {
  const payload = parseProductPayload(body)
  const now = new Date().toISOString()
  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase
    .from('produtos')
    .insert({
      ...payload,
      updated_at: now,
    })
    .select('id, nome, preco, created_at, updated_at')
    .single()

  if (error) {
    throw error
  }

  return formatProduto(data as ProductCreateRow)
}

export async function updateProductRecord(productId: string, body: unknown) {
  const payload = parseProductPayload(body)
  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase
    .from('produtos')
    .update({
      ...payload,
      updated_at: new Date().toISOString(),
    })
    .eq('id', productId)
    .select('id, nome, preco, created_at, updated_at')
    .single()

  if (error) {
    throw error
  }

  return formatProduto(data as ProductCreateRow)
}

export async function softDeleteProductRecord(productId: string) {
  const supabase = getSupabaseAdmin()
  const { error } = await supabase
    .from('produtos')
    .update({
      ativo: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', productId)

  if (error) {
    throw error
  }
}
