import type { VercelRequest, VercelResponse } from '@vercel/node'

import { ensureMethod, sendError } from '../_lib/http.js'
import { requireAuth } from '../_lib/auth.js'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (!ensureMethod(request, response, ['GET'])) {
    return
  }

  try {
    const user = requireAuth(request)
    response.status(200).json({ user })
  } catch (error) {
    sendError(response, error, 'Falha ao validar sessao.', 401)
  }
}
