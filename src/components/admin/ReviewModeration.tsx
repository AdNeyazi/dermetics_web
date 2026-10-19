import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'

const api = (path: string, opts: RequestInit = {}) => apiFetch(path, opts).then((r) => r.json())

const STATUS_FILTERS = [
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: '', label: 'All' },
]

interface AdminReview {
  id: string | number
  productId: string | number
  productName?: string
  rating: number
  title?: string
  body?: string
  authorName?: string
  verifiedPurchase?: boolean
  status: string
  createdAt?: string
}

export function ReviewModeration() {
  const [status, setStatus] = useState('pending')
  const [items, setItems] = useState<AdminReview[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    const q = status ? `?status=${encodeURIComponent(status)}` : ''
    api(`/api/admin/product-reviews${q}`)
      .then((d) => setItems(Array.isArray(d) ? d : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [status])

  useEffect(() => { load() }, [load])

  const setReviewStatus = async (id: string | number, next: string) => {
    await apiFetch(`/api/admin/product-reviews/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: next }),
    })
    load()
  }

  return (
    <div>
      <div className="dash-toolbar">
        <div className="product-editor-tabs" style={{ marginBottom: 0 }}>
          {STATUS_FILTERS.map((s) => (
            <button
              key={s.key || 'all'}
              type="button"
              className={status === s.key ? 'active' : ''}
              onClick={() => setStatus(s.key)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading reviews…</p>
      ) : items.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>No reviews in this queue.</p>
      ) : (
        <div className="panel dash-table-panel">
          <div className="dash-table-scroll is-scrollable">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Rating</th>
                  <th>Review</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r.id}>
                    <td>{r.productName || r.productId}</td>
                    <td className="gold-text">{r.rating}★</td>
                    <td style={{ maxWidth: 280, color: 'var(--text-muted)', fontSize: 13 }}>
                      <strong style={{ color: 'var(--text-primary)' }}>{r.title}</strong>
                      <br />
                      {r.body?.slice(0, 120)}{(r.body?.length ?? 0) > 120 ? '…' : ''}
                      <br />
                      <span style={{ fontSize: 11 }}>{r.authorName}{r.verifiedPurchase ? ' · Verified' : ''}</span>
                    </td>
                    <td><span className="badge">{r.status}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {r.status !== 'approved' && (
                        <button type="button" className="btn-sm gold" onClick={() => setReviewStatus(r.id, 'approved')}>Approve</button>
                      )}
                      {r.status !== 'rejected' && (
                        <button type="button" className="btn-sm danger" onClick={() => setReviewStatus(r.id, 'rejected')}>Reject</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
export default ReviewModeration
