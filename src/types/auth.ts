export interface AuthUser {
  id: string
  nome: string
}

export interface LoginCredentials {
  nome: string
  senha: string
}

export interface LoginResponse {
  user: AuthUser
}

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'guest'
