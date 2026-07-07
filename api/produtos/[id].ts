import type { VercelRequest, VercelResponse } from '@vercel/node'

import { requireAuth } from '../_lib/auth.js'
import { ensureMethod, getQueryParam, readJsonBody, sendError } from '../_lib/http.js'
import { softDeleteProductRecord, updateProductRecord } from '../_lib/products.js'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (!ensureMethod(request, response, ['PUT', 'DELETE'])) {
    return
  }

  try {
    requireAuth(request)

    const productId = getQueryParam(request, 'id')

    if (!productId) {
      response.status(400).json({
        message: 'Informe o produto que deve ser atualizado.',
      })
      return
    }

    if (request.method === 'DELETE') {
      await softDeleteProductRecord(productId)
      response.status(204).send('')
      return
    }

    const produto = await updateProductRecord(productId, await readJsonBody(request))
    response.status(200).json({ produto })
  } catch (error) {
    sendError(
      response,
      error,
      request.method === 'DELETE' ? 'Falha ao excluir produto.' : 'Falha ao atualizar produto.',
      400,
    )
  }
}
