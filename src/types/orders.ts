export type OrderPaymentMode = 'aberto' | 'avista'

export interface OrderItem {
  id: string
  produtoId: string
  produtoNome: string
  quantidade: number
  precoUnitario: number
  subtotal: number
}

export interface OrderItemPayload {
  produtoId: string
  quantidade: number
}

export interface CreateOrderPayload {
  clienteNome: string
  formaPagamento: OrderPaymentMode
  itens: OrderItemPayload[]
}

export interface CreatedOrder {
  id: string
  clienteNome: string
  formaPagamento: OrderPaymentMode
  total: number
  usuarioNome: string
  createdAt: string
  updatedAt?: string
  items?: OrderItem[]
}

export interface OrderResponse {
  pedido: CreatedOrder
}

export interface OrderListResponse {
  pedidos: CreatedOrder[]
}

export interface UpdateOrderItemsPayload {
  itens: OrderItemPayload[]
}
