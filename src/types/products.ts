export interface Product {
  id: string
  nome: string
  preco: number
  createdAt: string
  updatedAt: string
}

export interface ProductPayload {
  nome: string
  preco: number
}

export interface ProductListResponse {
  produtos: Product[]
}

export interface ProductResponse {
  produto: Product
}
