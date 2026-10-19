import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '@/lib/api'
import { fetchMyOrders } from '@/lib/checkout'
import { Stars } from './pdp-ui'
import { trackEvent } from '@/lib/track'
import { formatDisplayDate } from '@/lib/formatDate'
import type { Product, User } from '@/types'

function initial(name?: string): string {
  const n = (name || 'G').trim()
  return (n[0] || 'G').toUpperCase()
}

export function ProductReviewsSection({ product }: { product: Product }) {
  const summary = product.reviewSummary || { average: 0, count: 0, distribution: {} }
  const reviews = product.reviews || []
  const [user, setUser] = useState<User | null>(null)
  const [canReview, setCanReview] = useState<boolean>(false)
  const [form, setForm] = useState({ rating: 5, title: '', body: '' })
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [msg, setMsg] = useState<string>('')

  useEffect(() => {
    apiFetch('/api/auth/me').then((r) => r.json()).then((d) => {
      setUser(d.user || null)
      if (d.user) {
        fetchMyOrders()
          .then((orders) => {
            const bought = orders.some(
              (o) => o.status === 'paid' && (o.items || []).some((it) => it.productId === product.id),
            )
            setCanReview(bought)
          })
          .catch(() => setCanReview(false))
      }
    }).catch(() => {})
  }, [product.id])

  const dist = summary.distribution || {}
  const maxDist = Math.max(1, ...[5, 4, 3, 2, 1].map((k) => Number(dist[k] || dist[String(k)] || 0)))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setStatus('loading')
    setMsg('')
    try {
      const res = await apiFetch(`/api/products/${product.id}/reviews`, {
        method: 'POST',
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not submit review')
      setStatus('done')
      setMsg(data.message || 'Review submitted for moderation.')
      setForm({ rating: 5, title: '', body: '' })
      trackEvent('pdp_review_submitted', { slug: product.slug, rating: form.rating })
    } catch (err: any) {
      setStatus('error')
      setMsg(err.message || 'Something went wrong')
    }
  }

  return (
    <section id="reviews" className="container pdp-reviews-section">
      <h2 className="gold-text pdp-section-title">Customer reviews</h2>

      {summary.count > 0 ? (
        <div className="pdp-reviews-summary">
          <div className="pdp-reviews-average">
            <span className="pdp-reviews-avg-num gold-text">{summary.average.toFixed(1)}</span>
            <Stars value={summary.average} size={20} />
            <span className="pdp-review-count">{summary.count} reviews</span>
          </div>
          <div className="pdp-reviews-bars">
            {[5, 4, 3, 2, 1].map((star) => {
              const n = Number(dist[star] || dist[String(star)] || 0)
              const pct = (n / maxDist) * 100
              return (
                <div key={star} className="pdp-review-bar-row">
                  <span>{star}★</span>
                  <div className="pdp-review-bar-track">
                    <div className="pdp-review-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="pdp-review-bar-count">{n}</span>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <p className="pdp-reviews-empty">Be the first to review this product.</p>
      )}

      <div className="pdp-review-cards">
        {reviews.map((r: any) => (
          <article key={r.id} className="pdp-review-card">
            <div className="pdp-review-card-head">
              <span className="pdp-review-avatar">{initial(r.authorName || r.userName)}</span>
              <div>
                <strong>{r.authorName || r.userName || 'Customer'}</strong>
                <Stars value={r.rating} size={14} />
              </div>
              {r.verifiedPurchase ? <span className="pdp-verified-badge">Verified buyer</span> : null}
            </div>
            {r.title ? <h4 className="pdp-review-title">{r.title}</h4> : null}
            <p className="pdp-review-body">{r.body}</p>
            {r.createdAt ? (
              <time className="pdp-review-date" dateTime={r.createdAt}>
                {formatDisplayDate(r.createdAt)}
              </time>
            ) : null}
          </article>
        ))}
      </div>

      <div className="pdp-review-form-wrap">
        <h3 className="gold-text">Write a review</h3>
        {!user ? (
          <p className="pdp-review-login-hint">
            <Link to="/login">Log in</Link> to share your experience. Reviews are moderated before they appear.
          </p>
        ) : !canReview ? (
          <p className="pdp-review-login-hint">
            Purchase this product to leave a review. <Link to="/checkout">Shop</Link> or view <Link to="/account/orders">your orders</Link>.
          </p>
        ) : (
          <form className="pdp-review-form" onSubmit={submit}>
            <label>
              Rating
              <select value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}>
                {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} stars</option>)}
              </select>
            </label>
            <label>
              Title
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required maxLength={200} />
            </label>
            <label>
              Review
              <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required rows={4} maxLength={5000} />
            </label>
            <button type="submit" className="btn-pill solid" disabled={status === 'loading'}>
              {status === 'loading' ? 'Submitting…' : 'Submit review'}
            </button>
            {msg ? <p className={`pdp-review-msg ${status}`}>{msg}</p> : null}
          </form>
        )}
      </div>
    </section>
  )
}
