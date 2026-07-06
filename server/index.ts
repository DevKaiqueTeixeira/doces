import 'dotenv/config'

import cors from 'cors'
import express, { type Request, type Response } from 'express'

import { getSupabaseAdmin, hasSupabaseConfig } from './supabase.js'

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
  if (!hasSupabaseConfig()) {
    response.status(500).json({
      connected: false,
      message: 'Preencha SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.',
    })
    return
  }

  try {
    const supabase = getSupabaseAdmin()
    const { error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 })

    if (error) {
      throw error
    }

    response.json({ connected: true, message: 'Supabase conectado com sucesso.' })
  } catch (error) {
    response.status(500).json({
      connected: false,
      message: error instanceof Error ? error.message : 'Falha ao validar Supabase.',
    })
  }
})

app.get('/projects', async (_request: Request, response: Response) => {
  if (!hasSupabaseConfig()) {
    response.status(500).json({
      message: 'Configure o Supabase antes de consultar projetos.',
    })
    return
  }

  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase.from('projects').select('*').limit(10)

    if (error) {
      throw error
    }

    response.json(data)
  } catch (error) {
    response.status(500).json({
      message: error instanceof Error ? error.message : 'Falha ao buscar projetos.',
    })
  }
})

app.listen(port, () => {
  console.log(`API running at http://localhost:${port}`)
})
