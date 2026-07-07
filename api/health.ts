import type { VercelRequest, VercelResponse } from '@vercel/node'

import { ensureMethod } from './_lib/http.js'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (!ensureMethod(request, response, ['GET'])) {
    return
  }

  response.status(200).json({
    status: 'ok',
    service: 'vercel-api',
    timestamp: new Date().toISOString(),
  })
}
