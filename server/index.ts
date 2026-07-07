import 'dotenv/config'

import cors from 'cors'
import express, { type Request, type Response } from 'express'

import {
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
