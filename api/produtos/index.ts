import type { VercelRequest, VercelResponse } from '@vercel/node'

import { requireAuth } from '../_lib/auth.js'
import { ensureMethod, readJsonBody, sendError } from '../_lib/http.js'
import { createProductRecord, listActiveProducts } from '../_lib/products.js'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (!ensureMethod(request, response, ['GET', 'POST'])) {
    return
  }

  try {
    requireAuth(request)

    if (request.method === 'GET') {
      const produtos = await listActiveProducts()
      response.status(200).json({ produtos })
      return
    }

    const produto = await createProductRecord(await readJsonBody(request))
    response.status(201).json({ produto })
  } catch (error) {
    sendError(
      response,
      error,
      request.method === 'GET' ? 'Falha ao buscar produtos.' : 'Falha ao cadastrar produto.',
      request.method === 'GET' ? 500 : 400,
    )
  }
}
