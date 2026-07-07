import jwt from 'jsonwebtoken'
import type { VercelRequest } from '@vercel/node'

import { HttpError } from './http.js'

export interface AuthenticatedUser {
  id: string
  nome: string
}

function getAuthTokenSecret() {
  const secret = process.env.AUTH_TOKEN_SECRET ?? process.env.SUPABASE_SECRET_KEY

  if (!secret) {
    throw new HttpError(500, 'Defina AUTH_TOKEN_SECRET ou SUPABASE_SECRET_KEY no ambiente.')
  }

  return secret
}

export function createAuthToken(user: AuthenticatedUser) {
  return jwt.sign({ nome: user.nome }, getAuthTokenSecret(), {
    subject: user.id,
    expiresIn: '7d',
  })
}

export function verifyAuthToken(token: string) {
  const payload = jwt.verify(token, getAuthTokenSecret()) as jwt.JwtPayload

  if (typeof payload.sub !== 'string' || typeof payload.nome !== 'string') {
    throw new HttpError(401, 'Token invalido ou expirado.')
  }

  return {
    id: payload.sub,
    nome: payload.nome,
  }
}

export function getBearerToken(request: VercelRequest) {
  const authorizationHeader = request.headers.authorization

  if (!authorizationHeader?.startsWith('Bearer ')) {
    return ''
  }

  return authorizationHeader.slice('Bearer '.length).trim()
}

export function requireAuth(request: VercelRequest) {
  const token = getBearerToken(request)

  if (!token) {
    throw new HttpError(401, 'Sessao nao encontrada.')
  }

  return verifyAuthToken(token)
}
