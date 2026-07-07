import type { CreateOrderPayload, OrderResponse } from '../types/orders'

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

function getErrorMessage(payload: { message?: string } | OrderResponse | null) {
  if (payload && 'message' in payload && typeof payload.message === 'string') {
    return payload.message
  }

  return 'Nao foi possivel cadastrar o pedido.'
}

export async function createOrder(token: string, payload: CreateOrderPayload) {
  const response = await fetch(`${apiUrl}/pedidos`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const responsePayload = (await response.json().catch(() => null)) as OrderResponse | { message?: string } | null

  if (!response.ok) {
    throw new Error(getErrorMessage(responsePayload))
  }

  if (!responsePayload || !('pedido' in responsePayload)) {
    throw new Error('Resposta de pedido invalida.')
  }

  return responsePayload.pedido
}
