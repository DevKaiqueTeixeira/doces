import type { ProductListResponse, ProductPayload, ProductResponse } from '../types/products'
import { apiUrl } from './api'

function getErrorMessage(payload: { message?: string } | ProductListResponse | ProductResponse | null) {
  if (payload && 'message' in payload && typeof payload.message === 'string') {
    return payload.message
  }

  return 'Nao foi possivel processar a solicitacao.'
}

function createAuthHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

export async function fetchProducts(token: string) {
  const response = await fetch(`${apiUrl}/produtos`, {
    headers: createAuthHeaders(token),
  })

  const payload = (await response.json().catch(() => null)) as ProductListResponse | { message?: string } | null

  if (!response.ok) {
    throw new Error(getErrorMessage(payload))
  }

  if (!payload || !('produtos' in payload)) {
    throw new Error('Resposta de produtos invalida.')
  }

  return payload.produtos
}

export async function createProduct(token: string, product: ProductPayload) {
  const response = await fetch(`${apiUrl}/produtos`, {
    method: 'POST',
    headers: createAuthHeaders(token),
    body: JSON.stringify(product),
  })

  const payload = (await response.json().catch(() => null)) as ProductResponse | { message?: string } | null

  if (!response.ok) {
    throw new Error(getErrorMessage(payload))
  }

  if (!payload || !('produto' in payload)) {
    throw new Error('Resposta de cadastro invalida.')
  }

  return payload.produto
}

export async function updateProduct(token: string, productId: string, product: ProductPayload) {
  const response = await fetch(`${apiUrl}/produtos/${productId}`, {
    method: 'PUT',
    headers: createAuthHeaders(token),
    body: JSON.stringify(product),
  })

  const payload = (await response.json().catch(() => null)) as ProductResponse | { message?: string } | null

  if (!response.ok) {
    throw new Error(getErrorMessage(payload))
  }

  if (!payload || !('produto' in payload)) {
    throw new Error('Resposta de atualizacao invalida.')
  }

  return payload.produto
}

export async function deleteProduct(token: string, productId: string) {
  const response = await fetch(`${apiUrl}/produtos/${productId}`, {
    method: 'DELETE',
    headers: createAuthHeaders(token),
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null
    throw new Error(getErrorMessage(payload))
  }
}
