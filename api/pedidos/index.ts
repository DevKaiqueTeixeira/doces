import type { VercelRequest, VercelResponse } from '@vercel/node'

import { requireAuth } from '../_lib/auth.js'
import { ensureMethod, readJsonBody, sendError } from '../_lib/http.js'
import { createOrderRecord, listOrders } from '../_lib/orders.js'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (!ensureMethod(request, response, ['GET', 'POST'])) {
    return
  }

  try {
    const authUser = requireAuth(request)

    if (request.method === 'GET') {
      const pedidos = await listOrders()
      response.status(200).json({ pedidos })
      return
    }

    const pedido = await createOrderRecord(authUser, await readJsonBody(request))
    response.status(201).json({ pedido })
  } catch (error) {
    sendError(
      response,
      error,
      request.method === 'GET' ? 'Falha ao buscar pedidos.' : 'Falha ao cadastrar pedido.',
      request.method === 'GET' ? 500 : 400,
    )
  }
}
