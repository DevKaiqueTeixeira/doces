import type {
  CreateOrderPayload,
  OrderListResponse,
  OrderResponse,
  UpdateOrderItemsPayload,
} from '../types/orders'

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

function getErrorMessage(payload: { message?: string } | OrderResponse | OrderListResponse | null) {
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

export async function fetchOrders(token: string) {
  const response = await fetch(`${apiUrl}/pedidos`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const responsePayload = (await response.json().catch(() => null)) as OrderListResponse | { message?: string } | null

  if (!response.ok) {
    throw new Error(getErrorMessage(responsePayload))
  }

  if (!responsePayload || !('pedidos' in responsePayload)) {
    throw new Error('Resposta de pedidos invalida.')
  }

  return responsePayload.pedidos
}

export async function closeOrder(token: string, orderId: string) {
  const response = await fetch(`${apiUrl}/pedidos/${orderId}/encerrar`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const responsePayload = (await response.json().catch(() => null)) as OrderResponse | { message?: string } | null

  if (!response.ok) {
    throw new Error(getErrorMessage(responsePayload))
  }

  if (!responsePayload || !('pedido' in responsePayload)) {
    throw new Error('Resposta de encerramento invalida.')
  }

  return responsePayload.pedido
}

export async function addItemsToOrder(token: string, orderId: string, payload: UpdateOrderItemsPayload) {
  const response = await fetch(`${apiUrl}/pedidos/${orderId}/itens`, {
    method: 'PUT',
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
    throw new Error('Resposta de atualizacao do pedido invalida.')
  }

  return responsePayload.pedido
}
