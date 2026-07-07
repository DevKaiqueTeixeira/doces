import type { VercelRequest, VercelResponse } from '@vercel/node'

import { requireAuth } from '../../_lib/auth.js'
import { closeOrderRecord } from '../../_lib/orders.js'
import { ensureMethod, getQueryParam, sendError } from '../../_lib/http.js'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (!ensureMethod(request, response, ['PUT'])) {
    return
  }

  try {
    requireAuth(request)

    const orderId = getQueryParam(request, 'id')

    if (!orderId) {
      response.status(400).json({
        message: 'Informe o pedido que deve ser encerrado.',
      })
      return
    }

    const pedido = await closeOrderRecord(orderId)
    response.status(200).json({ pedido })
  } catch (error) {
    sendError(response, error, 'Falha ao encerrar pedido.', 400)
  }
}
