export type OrderPaymentMode = 'aberto' | 'avista'

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
  createdAt: string
}

export interface OrderResponse {
  pedido: CreatedOrder
}
