import { getSupabaseAdmin } from '../../server/supabase.js'

import { formatPedido, parseOrderItemsPayload, parseOrderPayload } from './domain.js'
import type { AuthenticatedUser } from './auth.js'
import type { OrderInsertItem, ParsedOrderItem, PedidoItemRow, PedidoRow, ProductRow } from './domain.js'

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
      usuario_id: authUser.id,
      usuario_nome: authUser.nome,
      updated_at: now,
    })
    .select('id, cliente_nome, forma_pagamento, total, usuario_nome, created_at, updated_at')
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
    .select(
      'id, cliente_nome, forma_pagamento, total, usuario_nome, created_at, updated_at, pedido_itens(id, produto_id, produto_nome, quantidade, preco_unitario, subtotal)',
    )
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []).map((pedido: PedidoRow) => formatPedido(pedido))
}

export async function closeOrderRecord(orderId: string) {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('pedidos')
    .update({
      forma_pagamento: 'avista',
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .select('id, cliente_nome, forma_pagamento, total, usuario_nome, created_at, updated_at')
    .single()

  if (error) {
    throw error
  }

  return formatPedido(data as PedidoRow)
}

export async function updateOrderItemsRecord(orderId: string, body: unknown) {
  const payload = parseOrderItemsPayload(body)
  const supabase = getSupabaseAdmin()

  const { error: orderError } = await supabase
    .from('pedidos')
    .select('id')
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

  const { data: updatedOrder, error: updatedOrderError } = await supabase
    .from('pedidos')
    .update({
      total: Number(total.toFixed(2)),
      updated_at: now,
    })
    .eq('id', orderId)
    .select('id, cliente_nome, forma_pagamento, total, usuario_nome, created_at, updated_at')
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
