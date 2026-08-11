import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import App from './App'

const users = {
  items: [{ id: 'usr-001', name: 'Nguyen Van An', email: 'an@example.com' }],
}

const products = {
  items: [
    {
      id: 'prd-001',
      name: 'Mechanical Keyboard',
      description: 'Compact keyboard',
      price: 1_290_000,
      currency: 'VND',
      stock: 10,
      accent: 'amber',
    },
  ],
}

const createdOrder = {
  id: 'ord-001',
  userId: 'usr-001',
  items: [
    {
      productId: 'prd-001',
      productName: 'Mechanical Keyboard',
      unitPrice: 1_290_000,
      quantity: 1,
      lineTotal: 1_290_000,
    },
  ],
  totalAmount: 1_290_000,
  currency: 'VND',
  status: 'CREATED',
  createdAt: '2026-08-11T08:30:00Z',
}

const jsonResponse = (body: unknown, status = 200) =>
  Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  )

describe('App', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('loads the storefront and creates an order', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock
      .mockImplementationOnce(() => jsonResponse(users))
      .mockImplementationOnce(() => jsonResponse(products))
      .mockImplementationOnce(() => jsonResponse({ items: [] }))
      .mockImplementationOnce(() => jsonResponse(createdOrder, 201))

    render(<App />)

    expect(await screen.findByText('Mechanical Keyboard')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Thêm Mechanical Keyboard' }))
    fireEvent.click(screen.getByRole('button', { name: 'Tạo đơn hàng' }))

    expect(await screen.findByText('Đã tạo đơn ord-001 thành công.')).toBeInTheDocument()
    expect(screen.getByText('ord-001')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenLastCalledWith(
      '/api/v1/orders',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('shows a retry action when initial loading fails', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Gateway offline'))

    render(<App />)

    expect(await screen.findByText('Gateway offline')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Thử lại' })).toBeInTheDocument()
  })
})
