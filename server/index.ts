import 'dotenv/config'

import cors from 'cors'
import express, { type Request, type Response } from 'express'

import {
  getSupabaseAdmin,
  getSupabaseProbeConfig,
  getSupabaseQueryClient,
  hasSupabaseAdminConfig,
  hasSupabasePublicConfig,
} from './supabase.js'

const app = express()
const port = Number(process.env.PORT ?? 3333)

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

    response.json({
      user: {
        id: data.id,
        nome: data.nome,
      },
    })
  } catch (error) {
    response.status(500).json({
      message: error instanceof Error ? error.message : 'Falha ao autenticar usuario.',
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
