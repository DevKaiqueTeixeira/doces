import type { VercelRequest, VercelResponse } from '@vercel/node'

export class HttpError extends Error {
  statusCode: number

  constructor(statusCode: number, message: string) {
    super(message)
    this.name = 'HttpError'
    this.statusCode = statusCode
  }
}

export function ensureMethod(request: VercelRequest, response: VercelResponse, allowedMethods: string[]) {
  const requestMethod = request.method ?? 'GET'

  if (allowedMethods.includes(requestMethod)) {
    return true
  }

  response.setHeader('Allow', allowedMethods.join(', '))
  response.status(405).json({
    message: `Metodo ${requestMethod} nao permitido.`,
  })

  return false
}

export async function readJsonBody<T>(request: VercelRequest) {
  if (request.body !== undefined) {
    if (typeof request.body === 'string') {
      return JSON.parse(request.body) as T
    }

    if (Buffer.isBuffer(request.body)) {
      return JSON.parse(request.body.toString('utf8')) as T
    }

    return request.body as T
  }

  const chunks: Buffer[] = []

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)))
  }

  const rawBody = Buffer.concat(chunks).toString('utf8').trim()

  if (!rawBody) {
    return {} as T
  }

  return JSON.parse(rawBody) as T
}

export function getQueryParam(request: VercelRequest, key: string) {
  const value = request.query[key]

  if (typeof value === 'string') {
    return value
  }

  if (Array.isArray(value)) {
    return value[0] ?? ''
  }

  return ''
}

export function sendError(response: VercelResponse, error: unknown, fallbackMessage: string, fallbackStatus = 500) {
  if (error instanceof HttpError) {
    response.status(error.statusCode).json({
      message: error.message,
    })
    return
  }

  response.status(fallbackStatus).json({
    message: error instanceof Error ? error.message : fallbackMessage,
  })
}
