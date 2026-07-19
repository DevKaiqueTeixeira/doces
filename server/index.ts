import 'dotenv/config'

import cors from 'cors'
import express, { type NextFunction, type Request, type Response } from 'express'
import jwt from 'jsonwebtoken'

import {
  getSupabaseAdmin,
  getSupabaseProbeConfig,
  getSupabaseQueryClient,
  hasSupabaseAdminConfig,
  hasSupabasePublicConfig,
} from './supabase.js'

const app = express()
const port = Number(process.env.PORT ?? 3333)

type AuthenticatedUser = {
  id: string
  nome: string
}

type AuthenticatedRequest = Request & {
  authUser?: AuthenticatedUser
}

type ParsedOrderItem = {
  produtoId: string
  quantidade: number
}

type ProductRow = {
  id: string
  nome: string
  preco: number
}

type OrderInsertItem = {
  id?: string
  produto_id: string
  produto_nome: string
  quantidade: number
  preco_unitario: number
  subtotal: number
}

type PedidoItemRow = {
  id: string
  produto_id: string
  produto_nome: string
  quantidade: number
  preco_unitario: number
  subtotal: number
}

type PedidoRow = {
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

const orderSelectFields = 'id, cliente_nome, forma_pagamento, total, pagamento_parcial, usuario_nome, created_at, updated_at'
const orderWithItemsSelect = `${orderSelectFields}, pedido_itens(id, produto_id, produto_nome, quantidade, preco_unitario, subtotal)`
const concurrentOrderUpdateMessage = 'O pedido foi atualizado por outra operacao. Recarregue a tela e tente novamente.'

function getAuthTokenSecret() {
  const secret = process.env.AUTH_TOKEN_SECRET ?? process.env.SUPABASE_SECRET_KEY

  if (!secret) {
    throw new Error('Defina AUTH_TOKEN_SECRET ou SUPABASE_SECRET_KEY no .env.')
  }

  return secret
}

function createAuthToken(user: AuthenticatedUser) {
  return jwt.sign({ nome: user.nome }, getAuthTokenSecret(), {
    subject: user.id,
    expiresIn: '7d',
  })
}

function verifyAuthToken(token: string) {
  const payload = jwt.verify(token, getAuthTokenSecret()) as jwt.JwtPayload

  if (typeof payload.sub !== 'string' || typeof payload.nome !== 'string') {
    throw new Error('Token invalido.')
  }

  return {
    id: payload.sub,
    nome: payload.nome,
  }
}

function getBearerToken(request: Request) {
  const authorizationHeader = request.headers.authorization

  if (!authorizationHeader?.startsWith('Bearer ')) {
    return ''
  }

  return authorizationHeader.slice('Bearer '.length).trim()
}

function requireAuth(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  const token = getBearerToken(request)

  if (!token) {
    response.status(401).json({
      message: 'Sessao nao encontrada.',
    })
    return
  }

  try {
    request.authUser = verifyAuthToken(token)
    next()
  } catch {
    response.status(401).json({
      message: 'Token invalido ou expirado.',
    })
  }
}

function parseProductPayload(body: Request['body']) {
  const nome = typeof body?.nome === 'string' ? body.nome.trim() : ''
  const preco = typeof body?.preco === 'number' ? body.preco : Number(body?.preco)

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

function formatProduto(produto: {
  id: string
  nome: string
  preco: number
  created_at: string
  updated_at: string
}) {
  return {
    id: produto.id,
    nome: produto.nome,
    preco: Number(produto.preco),
    createdAt: produto.created_at,
    updatedAt: produto.updated_at,
  }
}

function parseOrderPayload(body: Request['body']) {
  const clienteNome = typeof body?.clienteNome === 'string' ? body.clienteNome.trim() : ''
  const formaPagamento = body?.formaPagamento === 'aberto' || body?.formaPagamento === 'avista' ? body.formaPagamento : ''
  const itens = Array.isArray(body?.itens) ? body.itens : []

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

function formatPedido(pedido: {
  id: string
  cliente_nome: string
  forma_pagamento: 'aberto' | 'avista'
  total: number
  pagamento_parcial: number
  created_at: string
  usuario_nome?: string
  updated_at?: string
  pedido_itens?: PedidoItemRow[]
}) {
  return {
    id: pedido.id,
    clienteNome: pedido.cliente_nome,
    formaPagamento: pedido.forma_pagamento,
    total: Number(pedido.total),
    pagamentoParcial: Number(pedido.pagamento_parcial ?? 0),
    createdAt: pedido.created_at,
    updatedAt: pedido.updated_at,
    usuarioNome: pedido.usuario_nome ?? '',
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

function parseOrderItemsPayload(body: Request['body']) {
  const itens = Array.isArray(body?.itens) ? body.itens : []

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

function parseOrderPartialPaymentPayload(body: Request['body']) {
  const rawValue = body?.valorRecebido
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

app.use(cors())
app.use(express.json())

app.get('/health', (_request: Request, response: Response) => {
  response.json({
    status: 'ok',
    service: 'node-api',
    timestamp: new Date().toISOString(),
  })
})

app.get('/supabase/status', async (_request: Request, response: Response) => {
  if (!hasSupabasePublicConfig()) {
    response.status(500).json({
      connected: false,
      message: 'Preencha NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY no .env.',
    })
    return
  }

  try {
    const { key, mode, url } = getSupabaseProbeConfig()
    const probeResponse = await fetch(`${url}/auth/v1/settings`, {
      headers: {
        apikey: key,
      },
    })

    if (!probeResponse.ok) {
      throw new Error('Supabase respondeu com erro na validacao.')
    }

    response.json({
      connected: true,
      mode,
      message:
        mode === 'admin'
          ? 'Supabase conectado com service role.'
          : 'Supabase conectado com chave publica. Rotas administrativas continuam indisponiveis.',
    })
  } catch (error) {
    response.status(500).json({
      connected: false,
      message: error instanceof Error ? error.message : 'Falha ao validar Supabase.',
    })
  }
})

app.post('/auth/login', async (request: Request, response: Response) => {
  const nome = typeof request.body?.nome === 'string' ? request.body.nome.trim().toLowerCase() : ''
  const senha = typeof request.body?.senha === 'string' ? request.body.senha : ''

  if (!nome || !senha) {
    response.status(400).json({
      message: 'Informe nome e senha para entrar.',
    })
    return
  }

  if (!hasSupabaseAdminConfig()) {
    response.status(500).json({
      message: 'Defina SUPABASE_SECRET_KEY no .env para validar os usuarios no Supabase.',
    })
    return
  }

  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nome, senha')
      .eq('nome', nome)
      .maybeSingle()

    if (error) {
      throw error
    }

    if (!data || data.senha !== senha) {
      response.status(401).json({
        message: 'Usuario ou senha invalidos.',
      })
      return
    }

    const user = {
      id: data.id,
      nome: data.nome,
    }

    response.json({
      token: createAuthToken(user),
      user,
    })
  } catch (error) {
    response.status(500).json({
      message: error instanceof Error ? error.message : 'Falha ao autenticar usuario.',
    })
  }
})

app.get('/auth/session', requireAuth, (request: AuthenticatedRequest, response: Response) => {
  response.json({
    user: request.authUser,
  })
})

app.get('/produtos', requireAuth, async (_request: AuthenticatedRequest, response: Response) => {
  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('produtos')
      .select('id, nome, preco, created_at, updated_at')
      .eq('ativo', true)
      .order('nome', { ascending: true })

    if (error) {
      throw error
    }

    response.json({
      produtos: (data ?? []).map(formatProduto),
    })
  } catch (error) {
    response.status(500).json({
      message: error instanceof Error ? error.message : 'Falha ao buscar produtos.',
    })
  }
})

app.post('/produtos', requireAuth, async (request: AuthenticatedRequest, response: Response) => {
  try {
    const supabase = getSupabaseAdmin()
    const payload = parseProductPayload(request.body)
    const now = new Date().toISOString()

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

    response.status(201).json({
      produto: formatProduto(data),
    })
  } catch (error) {
    response.status(400).json({
      message: error instanceof Error ? error.message : 'Falha ao cadastrar produto.',
    })
  }
})

app.put('/produtos/:id', requireAuth, async (request: AuthenticatedRequest, response: Response) => {
  try {
    const productId = request.params.id
    const payload = parseProductPayload(request.body)
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

    response.json({
      produto: formatProduto(data),
    })
  } catch (error) {
    response.status(400).json({
      message: error instanceof Error ? error.message : 'Falha ao atualizar produto.',
    })
  }
})

app.delete('/produtos/:id', requireAuth, async (request: AuthenticatedRequest, response: Response) => {
  try {
    const supabase = getSupabaseAdmin()
    const { error } = await supabase
      .from('produtos')
      .update({
        ativo: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', request.params.id)

    if (error) {
      throw error
    }

    response.status(204).send()
  } catch (error) {
    response.status(400).json({
      message: error instanceof Error ? error.message : 'Falha ao excluir produto.',
    })
  }
})

app.post('/pedidos', requireAuth, async (request: AuthenticatedRequest, response: Response) => {
  try {
    const payload = parseOrderPayload(request.body)
    const authUser = request.authUser

    if (!authUser) {
      response.status(401).json({
        message: 'Sessao nao encontrada.',
      })
      return
    }

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

    response.status(201).json({
      pedido: formatPedido(createdOrder),
    })
  } catch (error) {
    response.status(400).json({
      message: error instanceof Error ? error.message : 'Falha ao cadastrar pedido.',
    })
  }
})

app.get('/pedidos', requireAuth, async (_request: AuthenticatedRequest, response: Response) => {
  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('pedidos')
      .select(orderWithItemsSelect)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    response.json({
      pedidos: (data ?? []).map((pedido: PedidoRow) => formatPedido(pedido)),
    })
  } catch (error) {
    response.status(500).json({
      message: error instanceof Error ? error.message : 'Falha ao buscar pedidos.',
    })
  }
})

app.put('/pedidos/:id/encerrar', requireAuth, async (request: AuthenticatedRequest, response: Response) => {
  try {
    const supabase = getSupabaseAdmin()
    const { data: currentOrder, error: currentOrderError } = await supabase
      .from('pedidos')
      .select(orderSelectFields)
      .eq('id', request.params.id)
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
      .eq('id', request.params.id)
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

    response.json({
      pedido: formatPedido(data),
    })
  } catch (error) {
    response.status(400).json({
      message: error instanceof Error ? error.message : 'Falha ao encerrar pedido.',
    })
  }
})

app.put('/pedidos/:id/pagamento-parcial', requireAuth, async (request: AuthenticatedRequest, response: Response) => {
  try {
    const payload = parseOrderPartialPaymentPayload(request.body)
    const supabase = getSupabaseAdmin()
    const pedidoId = request.params.id
    const { data: currentOrder, error: currentOrderError } = await supabase
      .from('pedidos')
      .select(orderSelectFields)
      .eq('id', pedidoId)
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
      .eq('id', pedidoId)
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

    response.json({
      pedido: formatPedido(data),
    })
  } catch (error) {
    response.status(400).json({
      message: error instanceof Error ? error.message : 'Falha ao registrar pagamento parcial.',
    })
  }
})

app.put('/pedidos/:id/itens', requireAuth, async (request: AuthenticatedRequest, response: Response) => {
  try {
    const payload = parseOrderItemsPayload(request.body)
    const supabase = getSupabaseAdmin()
    const pedidoId = request.params.id

    const { data: order, error: orderError } = await supabase
      .from('pedidos')
      .select(orderSelectFields)
      .eq('id', pedidoId)
      .single()

    if (orderError) {
      throw orderError
    }

    const { data: currentItems, error: itemsError } = await supabase
      .from('pedido_itens')
      .select('id, produto_id, produto_nome, quantidade, preco_unitario, subtotal')
      .eq('pedido_id', pedidoId)

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
        pedido_id: pedidoId,
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
      .eq('id', pedidoId)
      .select(orderSelectFields)
      .single()

    if (updatedOrderError) {
      throw updatedOrderError
    }

    const { data: refreshedItems, error: refreshedItemsError } = await supabase
      .from('pedido_itens')
      .select('id, produto_id, produto_nome, quantidade, preco_unitario, subtotal')
      .eq('pedido_id', pedidoId)

    if (refreshedItemsError) {
      throw refreshedItemsError
    }

    response.json({
      pedido: formatPedido({
        ...updatedOrder,
        pedido_itens: refreshedItems ?? [],
      }),
    })
  } catch (error) {
    response.status(400).json({
      message: error instanceof Error ? error.message : 'Falha ao atualizar itens do pedido.',
    })
  }
})

app.get('/projects', async (_request: Request, response: Response) => {
  if (!hasSupabasePublicConfig()) {
    response.status(500).json({
      message: 'Configure o Supabase antes de consultar projetos.',
    })
    return
  }

  try {
    const supabase = getSupabaseQueryClient()
    const { data, error } = await supabase.from('projects').select('*').limit(10)

    if (error) {
      throw error
    }

    response.json({
      data,
      mode: hasSupabaseAdminConfig() ? 'admin' : 'public',
    })
  } catch (error) {
    response.status(500).json({
      message: error instanceof Error ? error.message : 'Falha ao buscar projetos.',
    })
  }
})

app.listen(port, () => {
  console.log(`API running at http://localhost:${port}`)
})
