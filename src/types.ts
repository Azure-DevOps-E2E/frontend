export type User = {
  id: string
  name: string
  email: string
}

export type ProductAccent = 'amber' | 'violet' | 'mint' | 'sky' | 'coral'

export type Product = {
  id: string
  name: string
  description: string
  price: number
  currency: 'VND'
  stock: number
  accent: ProductAccent
}

export type OrderItem = {
  productId: string
  productName: string
  unitPrice: number
  quantity: number
  lineTotal: number
}

export type Order = {
  id: string
  userId: string
  items: OrderItem[]
  totalAmount: number
  currency: 'VND'
  status: 'CREATED'
  createdAt: string
}

export type ListResponse<T> = {
  items: T[]
}

export type CreateOrderPayload = {
  userId: string
  items: Array<{ productId: string; quantity: number }>
}

export type ApiErrorPayload = {
  error?: {
    code?: string
    message?: string
    requestId?: string
  }
}
