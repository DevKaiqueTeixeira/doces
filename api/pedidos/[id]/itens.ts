import type { VercelRequest, VercelResponse } from '@vercel/node'

import { requireAuth } from '../../_lib/auth.js'
import { ensureMethod, getQueryParam, readJsonBody, sendError } from '../../_lib/http.js'
import { updateOrderItemsRecord } from '../../_lib/orders.js'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (!ensureMethod(request, response, ['PUT'])) {
    return
  }

  try {
    requireAuth(request)

    const orderId = getQueryParam(request, 'id')

    if (!orderId) {
      response.status(400).json({
        message: 'Informe o pedido que deve ser atualizado.',
      })
      return
    }

    const pedido = await updateOrderItemsRecord(orderId, await readJsonBody(request))
    response.status(200).json({ pedido })
  } catch (error) {
    sendError(response, error, 'Falha ao atualizar itens do pedido.', 400)
  }
}
