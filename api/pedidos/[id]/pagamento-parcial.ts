import type { VercelRequest, VercelResponse } from '@vercel/node'

import { requireAuth } from '../../_lib/auth.js'
import { ensureMethod, getQueryParam, readJsonBody, sendError } from '../../_lib/http.js'
import { receivePartialPaymentRecord } from '../../_lib/orders.js'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (!ensureMethod(request, response, ['PUT'])) {
    return
  }

  try {
    requireAuth(request)

    const orderId = getQueryParam(request, 'id')

    if (!orderId) {
      response.status(400).json({
        message: 'Informe o pedido que deve receber o pagamento parcial.',
      })
      return
    }

    const pedido = await receivePartialPaymentRecord(orderId, await readJsonBody(request))
    response.status(200).json({ pedido })
  } catch (error) {
    sendError(response, error, 'Falha ao registrar pagamento parcial.', 400)
  }
}
