import type { LoginCredentials, LoginResponse } from '../types/auth'

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

function getErrorMessage(payload: LoginResponse | { message?: string } | null) {
  if (payload && 'message' in payload && typeof payload.message === 'string') {
    return payload.message
  }

  return 'Nao foi possivel autenticar o usuario.'
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

  if (!payload || !('user' in payload)) {
    throw new Error('Resposta de login invalida.')
  }

  return payload.user
}
