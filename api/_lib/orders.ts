import { getSupabaseAdmin } from '../../server/supabase.js'

import { formatPedido, parseOrderItemsPayload, parseOrderPartialPaymentPayload, parseOrderPayload } from './domain.js'
import type { AuthenticatedUser } from './auth.js'
import type { OrderInsertItem, ParsedOrderItem, PedidoItemRow, PedidoRow, ProductRow } from './domain.js'

const orderSelectFields = 'id, cliente_nome, forma_pagamento, total, pagamento_parcial, usuario_nome, created_at, updated_at'
const orderWithItemsSelect = `${orderSelectFields}, pedido_itens(id, produto_id, produto_nome, quantidade, preco_unitario, subtotal)`
const concurrentOrderUpdateMessage = 'O pedido foi atualizado por outra operacao. Recarregue a tela e tente novamente.'

export async function createOrderRecord(authUser: AuthenticatedUser, body: unknown) {
  const payload = parseOrderPayload(body)
  const supabase = getSupabaseAdmin()
  const productIds = payload.itens.map((item: ParsedOrderItem) => item.produtoId)
  const { data: products, error: productsError } = await supabase
    .from('produtos')
    .select('id, nome, preco')
    .in('id', productIds)

  if (productsError) {
    throw productsError
  }

  const productsMap = new Map((products ?? []).map((product: ProductRow) => [product.id, product]))

  if (productsMap.size !== productIds.length) {
    throw new Error('Um ou mais produtos do pedido nao foram encontrados.')
  }

  const itemsToInsert = payload.itens.map((item: ParsedOrderItem): OrderInsertItem => {
    const product = productsMap.get(item.produtoId)

    if (!product) {
      throw new Error('Produto nao encontrado para o pedido.')
    }

    const precoUnitario = Number(product.preco)
    const subtotal = Number((precoUnitario * item.quantidade).toFixed(2))

    return {
      produto_id: product.id,
      produto_nome: product.nome,
      quantidade: item.quantidade,
      preco_unitario: precoUnitario,
      subtotal,
    }
  })

  const total = Number(itemsToInsert.reduce((sum: number, item: OrderInsertItem) => sum + item.subtotal, 0).toFixed(2))
  const now = new Date().toISOString()

  const { data: createdOrder, error: orderError } = await supabase
    .from('pedidos')
    .insert({
      cliente_nome: payload.clienteNome,
      forma_pagamento: payload.formaPagamento,
      total,
      pagamento_parcial: payload.formaPagamento === 'avista' ? total : 0,
      usuario_id: authUser.id,
      usuario_nome: authUser.nome,
      updated_at: now,
    })
    .select(orderSelectFields)
    .single()

  if (orderError) {
    throw orderError
  }

  const { error: itemsError } = await supabase.from('pedido_itens').insert(
    itemsToInsert.map((item: OrderInsertItem) => ({
      ...item,
      pedido_id: createdOrder.id,
      updated_at: now,
    })),
  )

  if (itemsError) {
    await supabase.from('pedidos').delete().eq('id', createdOrder.id)
    throw itemsError
  }

  return formatPedido(createdOrder as PedidoRow)
}

export async function listOrders() {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('pedidos')
    .select(orderWithItemsSelect)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []).map((pedido: PedidoRow) => formatPedido(pedido))
}

export async function closeOrderRecord(orderId: string) {
  const supabase = getSupabaseAdmin()
  const { data: currentOrder, error: currentOrderError } = await supabase
    .from('pedidos')
    .select(orderSelectFields)
    .eq('id', orderId)
    .single()

  if (currentOrderError) {
    throw currentOrderError
  }

  const { data, error } = await supabase
    .from('pedidos')
    .update({
      forma_pagamento: 'avista',
      pagamento_parcial: Number(currentOrder.total),
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .eq('forma_pagamento', currentOrder.forma_pagamento)
    .eq('pagamento_parcial', currentOrder.pagamento_parcial)
    .select(orderSelectFields)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!data) {
    throw new Error(concurrentOrderUpdateMessage)
  }

  return formatPedido(data as PedidoRow)
}

export async function receivePartialPaymentRecord(orderId: string, body: unknown) {
  const payload = parseOrderPartialPaymentPayload(body)
  const supabase = getSupabaseAdmin()
  const { data: currentOrder, error: currentOrderError } = await supabase
    .from('pedidos')
    .select(orderSelectFields)
    .eq('id', orderId)
    .single()

  if (currentOrderError) {
    throw currentOrderError
  }

  const total = Number(currentOrder.total)
  const paidAmount = Number(currentOrder.pagamento_parcial)

  if (currentOrder.forma_pagamento === 'avista' || paidAmount >= total) {
    throw new Error('O pedido ja foi recebido integralmente.')
  }

  const remainingAmount = Number((total - paidAmount).toFixed(2))

  if (payload.valorRecebido > remainingAmount) {
    throw new Error('O pagamento parcial nao pode ser maior que o valor restante do pedido.')
  }

  const nextPaidAmount = Number((paidAmount + payload.valorRecebido).toFixed(2))
  const { data, error } = await supabase
    .from('pedidos')
    .update({
      forma_pagamento: nextPaidAmount >= total ? 'avista' : 'aberto',
      pagamento_parcial: nextPaidAmount,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .eq('forma_pagamento', currentOrder.forma_pagamento)
    .eq('pagamento_parcial', currentOrder.pagamento_parcial)
    .select(orderSelectFields)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!data) {
    throw new Error(concurrentOrderUpdateMessage)
  }

  return formatPedido(data as PedidoRow)
}

export async function updateOrderItemsRecord(orderId: string, body: unknown) {
  const payload = parseOrderItemsPayload(body)
  const supabase = getSupabaseAdmin()

  const { data: order, error: orderError } = await supabase
    .from('pedidos')
    .select(orderSelectFields)
    .eq('id', orderId)
    .single()

  if (orderError) {
    throw orderError
  }

  const { data: currentItems, error: itemsError } = await supabase
    .from('pedido_itens')
    .select('id, produto_id, produto_nome, quantidade, preco_unitario, subtotal')
    .eq('pedido_id', orderId)

  if (itemsError) {
    throw itemsError
  }

  const currentItemsMap = new Map((currentItems ?? []).map((item: PedidoItemRow) => [item.produto_id, item]))
  const desiredItemsMap = new Map(payload.itens.map((item: ParsedOrderItem) => [item.produtoId, item.quantidade]))

  for (const currentItem of currentItems ?? []) {
    const desiredQuantity = desiredItemsMap.get(currentItem.produto_id) ?? 0

    if (desiredQuantity < currentItem.quantidade) {
      throw new Error('Nao e permitido reduzir itens ja cadastrados no pedido.')
    }
  }

  const productIds = payload.itens.map((item: ParsedOrderItem) => item.produtoId)
  const { data: products, error: productsError } = await supabase
    .from('produtos')
    .select('id, nome, preco')
    .in('id', productIds)

  if (productsError) {
    throw productsError
  }

  const productsMap = new Map((products ?? []).map((product: ProductRow) => [product.id, product]))

  if (productsMap.size !== productIds.length) {
    throw new Error('Um ou mais produtos enviados nao foram encontrados.')
  }

  const now = new Date().toISOString()
  let total = 0

  for (const item of payload.itens) {
    const product = productsMap.get(item.produtoId)

    if (!product) {
      throw new Error('Produto nao encontrado para atualizar o pedido.')
    }

    const precoUnitario = Number(product.preco)
    const subtotal = Number((precoUnitario * item.quantidade).toFixed(2))
    total += subtotal

    const currentItem = currentItemsMap.get(item.produtoId)

    if (currentItem) {
      const { error: updateItemError } = await supabase
        .from('pedido_itens')
        .update({
          quantidade: item.quantidade,
          preco_unitario: precoUnitario,
          subtotal,
          produto_nome: product.nome,
          updated_at: now,
        })
        .eq('id', currentItem.id)

      if (updateItemError) {
        throw updateItemError
      }

      continue
    }

    const { error: insertItemError } = await supabase.from('pedido_itens').insert({
      pedido_id: orderId,
      produto_id: product.id,
      produto_nome: product.nome,
      quantidade: item.quantidade,
      preco_unitario: precoUnitario,
      subtotal,
      updated_at: now,
    })

    if (insertItemError) {
      throw insertItemError
    }
  }

  const nextTotal = Number(total.toFixed(2))
  const nextPaidAmount = order.forma_pagamento === 'avista' ? nextTotal : Number(order.pagamento_parcial)

  const { data: updatedOrder, error: updatedOrderError } = await supabase
    .from('pedidos')
    .update({
      total: nextTotal,
      pagamento_parcial: nextPaidAmount,
      updated_at: now,
    })
    .eq('id', orderId)
    .select(orderSelectFields)
    .single()

  if (updatedOrderError) {
    throw updatedOrderError
  }

  const { data: refreshedItems, error: refreshedItemsError } = await supabase
    .from('pedido_itens')
    .select('id, produto_id, produto_nome, quantidade, preco_unitario, subtotal')
    .eq('pedido_id', orderId)

  if (refreshedItemsError) {
    throw refreshedItemsError
  }

  return formatPedido({
    ...(updatedOrder as PedidoRow),
    pedido_itens: (refreshedItems ?? []) as PedidoItemRow[],
  })
}
