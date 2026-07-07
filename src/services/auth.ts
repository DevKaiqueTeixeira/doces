import type { LoginCredentials, LoginResponse, VerifySessionResponse } from '../types/auth'
import { apiUrl } from './api'

function getErrorMessage(payload: LoginResponse | VerifySessionResponse | { message?: string } | null) {
  if (payload && 'message' in payload && typeof payload.message === 'string') {
    return payload.message
  }

  return 'Nao foi possivel autenticar o usuario.'
}

function createAuthHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
  }
}

export async function loginWithPassword(credentials: LoginCredentials) {
  const response = await fetch(`${apiUrl}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  })

  const payload = (await response.json().catch(() => null)) as
    | LoginResponse
    | { message?: string }
    | null

  if (!response.ok) {
    throw new Error(getErrorMessage(payload))
  }

  if (!payload || !('user' in payload) || !('token' in payload)) {
    throw new Error('Resposta de login invalida.')
  }

  return payload
}

export async function verifySessionToken(token: string) {
  const response = await fetch(`${apiUrl}/auth/session`, {
    headers: createAuthHeaders(token),
  })

  const payload = (await response.json().catch(() => null)) as
    | VerifySessionResponse
    | { message?: string }
    | null

  if (!response.ok) {
    throw new Error(getErrorMessage(payload))
  }

  if (!payload || !('user' in payload)) {
    throw new Error('Resposta de sessao invalida.')
  }

  return payload
}
