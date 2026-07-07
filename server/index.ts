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
    const { error } = await supabase.from('produtos').delete().eq('id', request.params.id)

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
