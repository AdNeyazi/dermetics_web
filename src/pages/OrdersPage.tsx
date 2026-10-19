import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchMyOrders } from '@/lib/checkout'
import { formatMoney } from '@/lib/money'
import type { Order } from '@/types'

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMyOrders()
      .then(setOrders)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="container section-pad"><p style={{ color: 'var(--text-muted)' }}>Loading orders…</p></div>

  if (error) {
    return (
      <div className="container section-pad">
        <p style={{ color: 'var(--text-muted)' }}>{error === 'Login required' ? 'Please log in to view orders.' : error}</p>
        <Link to="/login" className="btn-pill solid" style={{ marginTop: 16, display: 'inline-flex' }}>Login</Link>
      </div>
    )
  }

  return (
    <div className="container section-pad">
      <h1 className="gold-text checkout-title">Your orders</h1>
      {orders.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>No orders yet.</p>
      ) : (
        <ul className="orders-list">
          {orders.map((o) => (
            <li key={o.id} className="orders-list-item glass-panel">
              <div className="orders-list-head">
                <span className="gold-text">{formatMoney(o.total, o.currency)}</span>
                <span className="orders-status">{o.status}</span>
              </div>
              <p className="orders-meta">{o.createdAt ? new Date(o.createdAt).toLocaleString() : ''} · {o.items?.length || 0} items</p>
              <ul className="orders-items-mini">
                {(o.items || []).map((it) => (
                  <li key={it.id}>{it.productName} × {it.quantity}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default OrdersPage
