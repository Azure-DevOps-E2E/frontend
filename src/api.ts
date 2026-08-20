import type {
  ApiErrorPayload,
  CreateOrderPayload,
  ListResponse,
  Order,
  Product,
  ServiceVersionsResponse,
  User,
} from './types'

const API_BASE = '/api/v1'

export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly requestId?: string,
  ) {
    super(message)
    this.name = 'ApiClientError'
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  })

  if (!response.ok) {
    let payload: ApiErrorPayload = {}
    try {
      payload = (await response.json()) as ApiErrorPayload
    } catch {
      // Keep the fallback error when an upstream returns a non-JSON body.
    }

    throw new ApiClientError(
      payload.error?.message ?? `Request failed with status ${response.status}`,
      payload.error?.code ?? 'REQUEST_FAILED',
      payload.error?.requestId ?? response.headers.get('X-Request-ID') ?? undefined,
    )
  }

  return (await response.json()) as T
}

export const api = {
  async users(): Promise<User[]> {
    return (await request<ListResponse<User>>('/users')).items
  },

  async products(): Promise<Product[]> {
    return (await request<ListResponse<Product>>('/products')).items
  },

  async orders(): Promise<Order[]> {
    return (await request<ListResponse<Order>>('/orders' )).items
  },

  serviceVersions(): Promise<ServiceVersionsResponse> {
    return request<ServiceVersionsResponse>('/system/versions' )
  },

  createOrder(payload: CreateOrderPayload): Promise<Order> {
    return request<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
}
