export interface AuthUser {
  id: string
  nome: string
}

export interface AuthSession {
  token: string
  user: AuthUser
}

export interface LoginCredentials {
  nome: string
  senha: string
}

export interface LoginResponse extends AuthSession {}

export interface VerifySessionResponse {
  user: AuthUser
}

export type AuthStatus = 'idle' | 'loading' | 'verifying' | 'authenticated' | 'guest'
