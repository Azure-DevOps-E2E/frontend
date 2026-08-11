import { useCallback, useEffect, useMemo, useState } from 'react'

import { ApiClientError, api } from './api'
import type { Order, Product, User } from './types'

type LoadState = 'loading' | 'ready' | 'error'

const formatMoney = (value: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))

const initials = (name: string) =>
  name
    .split(' ')
    .slice(-2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

function App() {
  const [users, setUsers] = useState<User[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState('')

  const loadStore = useCallback(async () => {
    setLoadState('loading')
    setError('')
    try {
      const [nextUsers, nextProducts, nextOrders] = await Promise.all([
        api.users(),
        api.products(),
        api.orders(),
      ])
      setUsers(nextUsers)
      setProducts(nextProducts)
      setOrders(nextOrders)
      setSelectedUserId((current) => current || nextUsers[0]?.id || '')
      setLoadState('ready')
    } catch (loadError) {
      setLoadState('error')
      setError(toErrorMessage(loadError))
    }
  }, [])

  useEffect(() => {
    void loadStore()
  }, [loadStore])

  const cart = useMemo(
    () =>
      products
        .map((product) => ({ product, quantity: quantities[product.id] ?? 0 }))
        .filter((item) => item.quantity > 0),
    [products, quantities],
  )

  const cartTotal = useMemo(
    () => cart.reduce((total, item) => total + item.product.price * item.quantity, 0),
    [cart],
  )

  const selectedUser = users.find((user) => user.id === selectedUserId)

  const setQuantity = (product: Product, nextValue: number) => {
    const safeValue = Math.max(0, Math.min(product.stock, Math.floor(nextValue || 0)))
    setQuantities((current) => ({ ...current, [product.id]: safeValue }))
    setSuccess('')
  }

  const submitOrder = async () => {
    if (!selectedUserId || cart.length === 0) return

    setSubmitting(true)
    setError('')
    setSuccess('')
    try {
      const created = await api.createOrder({
        userId: selectedUserId,
        items: cart.map(({ product, quantity }) => ({
          productId: product.id,
          quantity,
        })),
      })
      setOrders((current) => [created, ...current])
      setQuantities({})
      setSuccess(`Đã tạo đơn ${created.id} thành công.`)
    } catch (submitError) {
      setError(toErrorMessage(submitError))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Polyglot Mini Shop home">
          <span className="brand-mark" aria-hidden="true">
            P
          </span>
          <span>
            <strong>Polyglot</strong>
            <small>MINI SHOP</small>
          </span>
        </a>
        <div className="service-status" aria-label="System status">
          <span className={loadState === 'ready' ? 'status-dot online' : 'status-dot'} />
          {loadState === 'ready' ? '4 services online' : 'Đang kết nối'}
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">CURATED FOR FOCUSED DAYS</p>
            <h1>
              Simple objects.
              <br />
              <em>Better work.</em>
            </h1>
            <p className="hero-description">
              Một storefront nhỏ được vận hành bởi React, Go, Python và Java —
              cùng nói chuyện qua một API Gateway duy nhất.
            </p>
          </div>
          <div className="hero-aside" aria-hidden="true">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="hero-monogram">P</div>
            <span>01 — POLYGLOT EDIT</span>
          </div>
        </section>

        {error && (
          <div className="alert error-alert" role="alert">
            <span>
              <strong>Có lỗi xảy ra.</strong> {error}
            </span>
            {loadState === 'error' && (
              <button type="button" onClick={() => void loadStore()}>
                Thử lại
              </button>
            )}
          </div>
        )}

        {success && (
          <div className="alert success-alert" role="status">
            <span className="success-icon" aria-hidden="true">
              ✓
            </span>
            {success}
          </div>
        )}

        {loadState === 'loading' ? (
          <LoadingStore />
        ) : loadState === 'ready' ? (
          <div className="store-layout">
            <section className="catalog-section" aria-labelledby="catalog-title">
              <div className="section-heading">
                <div>
                  <p className="section-index">01 / CATALOG</p>
                  <h2 id="catalog-title">Chọn sản phẩm</h2>
                </div>
                <span>{products.length} tuyển chọn</span>
              </div>

              <div className="product-grid">
                {products.map((product, index) => {
                  const quantity = quantities[product.id] ?? 0
                  return (
                    <article className="product-card" key={product.id}>
                      <div className={`product-visual ${product.accent}`}>
                        <span className="product-number">0{index + 1}</span>
                        <ProductGlyph product={product} />
                        <span className="stock-pill">{product.stock} in stock</span>
                      </div>
                      <div className="product-content">
                        <div className="product-title-row">
                          <h3>{product.name}</h3>
                          <strong>{formatMoney(product.price)}</strong>
                        </div>
                        <p>{product.description}</p>
                        <div className="quantity-control">
                          <button
                            type="button"
                            aria-label={`Giảm ${product.name}`}
                            onClick={() => setQuantity(product, quantity - 1)}
                            disabled={quantity === 0}
                          >
                            −
                          </button>
                          <input
                            aria-label={`Số lượng ${product.name}`}
                            inputMode="numeric"
                            min="0"
                            max={product.stock}
                            type="number"
                            value={quantity}
                            onChange={(event) =>
                              setQuantity(product, Number(event.target.value))
                            }
                          />
                          <button
                            type="button"
                            aria-label={`Thêm ${product.name}`}
                            onClick={() => setQuantity(product, quantity + 1)}
                            disabled={quantity >= product.stock}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>

            <aside className="checkout-panel" aria-labelledby="checkout-title">
              <div className="checkout-kicker">02 / CHECKOUT</div>
              <h2 id="checkout-title">Đơn hàng mới</h2>

              <label className="field-label" htmlFor="customer">
                Khách hàng
              </label>
              <div className="customer-select-wrap">
                <span className="avatar" aria-hidden="true">
                  {selectedUser ? initials(selectedUser.name) : '—'}
                </span>
                <select
                  id="customer"
                  aria-label="Khách hàng"
                  value={selectedUserId}
                  onChange={(event) => setSelectedUserId(event.target.value)}
                >
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>
              {selectedUser && <p className="customer-email">{selectedUser.email}</p>}

              <div className="cart-divider" />
              <div className="cart-heading">
                <span>Giỏ hàng</span>
                <span>{cart.reduce((count, item) => count + item.quantity, 0)} món</span>
              </div>

              <div className="cart-items">
                {cart.length === 0 ? (
                  <div className="empty-cart">
                    <span aria-hidden="true">＋</span>
                    <p>Chọn một món từ catalog để bắt đầu.</p>
                  </div>
                ) : (
                  cart.map(({ product, quantity }) => (
                    <div className="cart-line" key={product.id}>
                      <span className={`cart-swatch ${product.accent}`} />
                      <div>
                        <strong>{product.name}</strong>
                        <small>
                          {quantity} × {formatMoney(product.price)}
                        </small>
                      </div>
                      <b>{formatMoney(product.price * quantity)}</b>
                    </div>
                  ))
                )}
              </div>

              <div className="checkout-total">
                <span>Tổng cộng</span>
                <strong>{formatMoney(cartTotal)}</strong>
              </div>
              <button
                className="checkout-button"
                type="button"
                disabled={!selectedUserId || cart.length === 0 || submitting}
                onClick={() => void submitOrder()}
              >
                {submitting ? 'Đang tạo đơn…' : 'Tạo đơn hàng'}
                {!submitting && <span aria-hidden="true">↗</span>}
              </button>
              <p className="checkout-note">
                Giá được xác nhận lại bởi Catalog Service trước khi tạo đơn.
              </p>
            </aside>
          </div>
        ) : null}

        {loadState === 'ready' && (
          <section className="orders-section" aria-labelledby="orders-title">
            <div className="section-heading orders-heading">
              <div>
                <p className="section-index">03 / HISTORY</p>
                <h2 id="orders-title">Đơn gần đây</h2>
              </div>
              <span>{orders.length} đơn đã tạo</span>
            </div>

            {orders.length === 0 ? (
              <div className="empty-orders">
                <span>Chưa có đơn hàng</span>
                <p>Đơn đầu tiên của bạn sẽ xuất hiện tại đây.</p>
              </div>
            ) : (
              <div className="orders-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Mã đơn</th>
                      <th>Khách hàng</th>
                      <th>Sản phẩm</th>
                      <th>Thời gian</th>
                      <th>Trạng thái</th>
                      <th>Tổng tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => {
                      const customer = users.find((user) => user.id === order.userId)
                      return (
                        <tr key={order.id}>
                          <td>
                            <strong>{order.id}</strong>
                          </td>
                          <td>{customer?.name ?? order.userId}</td>
                          <td>{order.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
                          <td>{formatDate(order.createdAt)}</td>
                          <td>
                            <span className="order-status">Created</span>
                          </td>
                          <td className="money-cell">{formatMoney(order.totalAmount)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </main>

      <footer>
        <span>POLYGLOT MINI SHOP © 2026</span>
        <span>REACT · GO · PYTHON · JAVA</span>
      </footer>
    </div>
  )
}

function ProductGlyph({ product }: { product: Product }) {
  const glyphs: Record<string, string> = {
    'prd-001': '⌨',
    'prd-002': '◖◗',
    'prd-003': '◒',
    'prd-004': '▰',
    'prd-005': '◡',
  }
  return <span className="product-glyph">{glyphs[product.id] ?? '◇'}</span>
}

function LoadingStore() {
  return (
    <div className="loading-layout" aria-label="Đang tải cửa hàng">
      <div>
        <div className="skeleton skeleton-title" />
        <div className="skeleton-grid">
          {[0, 1, 2, 3].map((item) => (
            <div className="skeleton skeleton-card" key={item} />
          ))}
        </div>
      </div>
      <div className="skeleton skeleton-checkout" />
    </div>
  )
}

function toErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    return error.requestId
      ? `${error.message} (request: ${error.requestId})`
      : error.message
  }
  if (error instanceof Error) return error.message
  return 'Không thể kết nối tới hệ thống.'
}

export default App
