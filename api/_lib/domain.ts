export type ParsedOrderItem = {
  produtoId: string
  quantidade: number
}

export type ParsedOrderPartialPayment = {
  valorRecebido: number
}

export type ProductRow = {
  id: string
  nome: string
  preco: number
}

export type ProductCreateRow = ProductRow & {
  created_at: string
  updated_at: string
}

export type OrderInsertItem = {
  produto_id: string
  produto_nome: string
  quantidade: number
  preco_unitario: number
  subtotal: number
}

export type PedidoItemRow = {
  id: string
  produto_id: string
  produto_nome: string
  quantidade: number
  preco_unitario: number
  subtotal: number
}

export type PedidoRow = {
  id: string
  cliente_nome: string
  forma_pagamento: 'aberto' | 'avista'
  total: number
  pagamento_parcial: number
  usuario_nome: string
  created_at: string
  updated_at: string
  pedido_itens?: PedidoItemRow[]
}

export function parseProductPayload(body: unknown) {
  const payload = body as Record<string, unknown>
  const nome = typeof payload?.nome === 'string' ? payload.nome.trim() : ''
  const preco = typeof payload?.preco === 'number' ? payload.preco : Number(payload?.preco)

  if (!nome) {
    throw new Error('Informe o nome do produto.')
  }

  if (!Number.isFinite(preco) || preco < 0) {
    throw new Error('Informe um preco valido para o produto.')
  }

  return {
    nome,
    preco,
  }
}

export function formatProduto(produto: ProductCreateRow) {
  return {
    id: produto.id,
    nome: produto.nome,
    preco: Number(produto.preco),
    createdAt: produto.created_at,
    updatedAt: produto.updated_at,
  }
}

export function parseOrderPayload(body: unknown) {
  const payload = body as Record<string, unknown>
  const clienteNome = typeof payload?.clienteNome === 'string' ? payload.clienteNome.trim() : ''
  const formaPagamento = payload?.formaPagamento === 'aberto' || payload?.formaPagamento === 'avista' ? payload.formaPagamento : ''
  const itens = Array.isArray(payload?.itens) ? payload.itens : []

  if (!clienteNome) {
    throw new Error('Informe o nome do cliente.')
  }

  if (!formaPagamento) {
    throw new Error('Informe como o pedido deve ser salvo.')
  }

  if (!itens.length) {
    throw new Error('Selecione pelo menos um produto para o pedido.')
  }

  const normalizedItems = itens
    .map((item: Record<string, unknown>) => ({
      produtoId: typeof item.produtoId === 'string' ? item.produtoId : '',
      quantidade: Number(item.quantidade),
    }))
    .filter((item: ParsedOrderItem) => item.produtoId && Number.isInteger(item.quantidade) && item.quantidade > 0)

  if (!normalizedItems.length) {
    throw new Error('Os itens do pedido estao invalidos.')
  }

  return {
    clienteNome,
    formaPagamento,
    itens: normalizedItems,
  }
}

export function parseOrderItemsPayload(body: unknown) {
  const payload = body as Record<string, unknown>
  const itens = Array.isArray(payload?.itens) ? payload.itens : []

  if (!itens.length) {
    throw new Error('Informe os itens que devem permanecer no pedido.')
  }

  const normalizedItems = itens
    .map((item: Record<string, unknown>) => ({
      produtoId: typeof item.produtoId === 'string' ? item.produtoId : '',
      quantidade: Number(item.quantidade),
    }))
    .filter((item: ParsedOrderItem) => item.produtoId && Number.isInteger(item.quantidade) && item.quantidade > 0)

  if (!normalizedItems.length) {
    throw new Error('Os itens enviados para o pedido estao invalidos.')
  }

  return {
    itens: normalizedItems,
  }
}

export function parseOrderPartialPaymentPayload(body: unknown) {
  const payload = body as Record<string, unknown>
  const rawValue = payload?.valorRecebido
  const valorRecebido =
    typeof rawValue === 'number'
      ? rawValue
      : typeof rawValue === 'string'
        ? Number(rawValue.trim().replace(',', '.'))
        : Number.NaN
  const normalizedAmount = Number.isFinite(valorRecebido) ? Number(valorRecebido.toFixed(2)) : Number.NaN

  if (!Number.isFinite(valorRecebido) || normalizedAmount <= 0) {
    throw new Error('Informe um valor valido para o pagamento parcial.')
  }

  return {
    valorRecebido: normalizedAmount,
  }
}

export function formatPedido(pedido: PedidoRow) {
  return {
    id: pedido.id,
    clienteNome: pedido.cliente_nome,
    formaPagamento: pedido.forma_pagamento,
    total: Number(pedido.total),
    pagamentoParcial: Number(pedido.pagamento_parcial ?? 0),
    createdAt: pedido.created_at,
    updatedAt: pedido.updated_at,
    usuarioNome: pedido.usuario_nome,
    items: (pedido.pedido_itens ?? []).map((item) => ({
      id: item.id,
      produtoId: item.produto_id,
      produtoNome: item.produto_nome,
      quantidade: item.quantidade,
      precoUnitario: Number(item.preco_unitario),
      subtotal: Number(item.subtotal),
    })),
  }
}
