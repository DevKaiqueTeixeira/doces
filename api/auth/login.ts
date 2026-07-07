import type { VercelRequest, VercelResponse } from '@vercel/node'

import { createAuthToken } from '../_lib/auth.js'
import { ensureMethod, readJsonBody, sendError } from '../_lib/http.js'
import { getSupabaseAdmin, hasSupabaseAdminConfig } from '../../server/supabase.js'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (!ensureMethod(request, response, ['POST'])) {
    return
  }

  if (!hasSupabaseAdminConfig()) {
    response.status(500).json({
      message: 'Defina SUPABASE_SECRET_KEY no ambiente para validar os usuarios no Supabase.',
    })
    return
  }

  try {
    const body = await readJsonBody<Record<string, unknown>>(request)
    const nome = typeof body.nome === 'string' ? body.nome.trim().toLowerCase() : ''
    const senha = typeof body.senha === 'string' ? body.senha : ''

    if (!nome || !senha) {
      response.status(400).json({
        message: 'Informe nome e senha para entrar.',
      })
      return
    }

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

    response.status(200).json({
      token: createAuthToken(user),
      user,
    })
  } catch (error) {
    sendError(response, error, 'Falha ao autenticar usuario.')
  }
}
