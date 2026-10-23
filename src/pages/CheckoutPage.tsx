import { useEffect, useMemo, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  cartSubtotal,
  clearCart,
  readAppliedCoupon,
  readCart,
  saveAppliedCoupon,
  subscribeCart,
} from '@/lib/cart'
import { placeOrder, validateCoupon } from '@/lib/checkout'
import { formatMoney } from '@/lib/money'
import { trackEvent } from '@/lib/track'
import { trackBeginCheckout, trackApplyCoupon, trackPurchase } from '@/lib/gtag'
import { useAuth } from '@/context/AuthContext'
import type { CartLine, AppliedCoupon } from '@/types'

const SHIPPING_FLAT = 49
const FREE_SHIP_MIN = 999

interface ShippingForm {
  name: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  pincode: string
  paymentMethod: 'cod' | 'online'
}

export function CheckoutPage() {
  const { user } = useAuth()
  const [lines, setLines] = useState<CartLine[]>([])
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null)
  const [couponInput, setCouponInput] = useState('')
  const [couponErr, setCouponErr] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')
  const [orderId, setOrderId] = useState<string | null>(null)
  const [form, setForm] = useState<ShippingForm>({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    paymentMethod: 'cod',
  })

  const hasTrackedCheckoutRef = useRef(false)

  useEffect(() => {
    const sync = () => {
      const currentLines = readCart()
      setLines(currentLines)
      setCoupon(readAppliedCoupon())
      if (currentLines.length > 0 && !hasTrackedCheckoutRef.current) {
        hasTrackedCheckoutRef.current = true
        trackBeginCheckout({
          items: currentLines.map((l) => ({
            item_id: String(l.productId),
            item_name: l.name,
            price: Number(l.price),
            quantity: Number(l.quantity) || 1,
            item_variant: l.variantLabel,
          })),
          value: cartSubtotal(currentLines),
          coupon: readAppliedCoupon()?.code,
        })
      }
    }
    sync()
    return subscribeCart(sync)
  }, [])

  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        name: f.name || user.name || '',
        email: f.email || user.email || '',
      }))
    }
  }, [user])

  const subtotal = useMemo(() => cartSubtotal(lines), [lines])
  const discount = coupon?.discount || 0
  const afterDiscount = Math.max(0, subtotal - discount)
  const shipping = afterDiscount >= FREE_SHIP_MIN ? 0 : (lines.length ? SHIPPING_FLAT : 0)
  const total = afterDiscount + shipping

  const applyCoupon = async () => {
    setCouponErr('')
    try {
      const data = await validateCoupon(couponInput.trim(), subtotal)
      const payload: AppliedCoupon = { ...data.coupon, discount: data.discount }
      saveAppliedCoupon(payload)
      setCoupon(payload)
      trackEvent('coupon_applied', { code: payload.code, page: '/checkout' })
      trackApplyCoupon({ coupon_code: payload.code, discount: data.discount })
    } catch (e: unknown) {
      setCouponErr(e instanceof Error ? e.message : 'Coupon validation failed')
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!lines.length) return
    setStatus('loading')
    setError('')
    try {
      const order = await placeOrder({
        items: lines,
        shipping: form,
        couponCode: coupon?.code || '',
        paymentMethod: form.paymentMethod,
      })
      trackEvent('checkout_complete', { orderId: order.id, total: order.total, payment: form.paymentMethod })
      trackPurchase({
        transaction_id: String(order.id),
        value: Number(order.total || total),
        shipping: Number(order.shipping ?? shipping),
        coupon: coupon?.code,
        payment_type: form.paymentMethod,
        items: lines.map((l) => ({
          item_id: String(l.productId),
          item_name: l.name,
          price: Number(l.price),
          quantity: Number(l.quantity) || 1,
          item_variant: l.variantLabel,
        })),
      })
      clearCart()
      saveAppliedCoupon(null)
      setOrderId(order.id)
      setStatus('done')
    } catch (err: unknown) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Checkout failed')
    }
  }

  if (orderId) {
    return (
      <div className="container section-pad checkout-page">
        <h1 className="gold-text">Thank you</h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: 520 }}>
          Order <strong className="gold-text">{orderId.slice(0, 8)}…</strong> is confirmed.
          {form.paymentMethod === 'online' ? ' Online payment integration is stubbed in test mode.' : ' We will contact you for delivery.'}
        </p>
        <Link to="/#shop" className="btn-pill solid" style={{ marginTop: 24, display: 'inline-flex' }}>Continue shopping</Link>
        <Link to="/account/orders" className="btn-pill" style={{ marginTop: 16, marginLeft: 12, display: 'inline-flex' }}>View orders</Link>
      </div>
    )
  }

  return (
    <div className="container section-pad checkout-page">
      <h1 className="gold-text checkout-title">Checkout</h1>
      {!lines.length ? (
        <p style={{ color: 'var(--text-muted)' }}>
          Your cart is empty. <Link to="/#shop">Return to shop</Link>
        </p>
      ) : (
        <div className="checkout-grid">
          <form className="checkout-form glass-panel" onSubmit={submit}>
            <h2>Shipping &amp; contact</h2>
            <div className="form-grid">
              <label>
                Name
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </label>
              <label>
                Email
                <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </label>
              <label>
                Phone
                <input type="tel" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </label>
              <label className="full">
                Address
                <textarea rows={2} required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </label>
              <label>
                City
                <input required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </label>
              <label>
                State
                <input required value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
              </label>
              <label>
                Pincode
                <input required pattern="\d{6}" maxLength={6} value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} />
              </label>
            </div>

            <h2>Payment</h2>
            <fieldset className="checkout-pay-group">
              <legend className="sr-only">Payment method</legend>
              <label className="checkout-pay-opt">
                <input
                  type="radio"
                  name="payment"
                  checked={form.paymentMethod === 'cod'}
                  onChange={() => setForm({ ...form, paymentMethod: 'cod' })}
                />
                <span>Cash on delivery (COD)</span>
              </label>
              <label className="checkout-pay-opt">
                <input
                  type="radio"
                  name="payment"
                  checked={form.paymentMethod === 'online'}
                  onChange={() => setForm({ ...form, paymentMethod: 'online' })}
                />
                <span>Pay online (UPI / Card / NetBanking)</span>
              </label>
            </fieldset>
            {error ? <p className="checkout-error">{error}</p> : null}
            <button type="submit" className="btn-pill solid" disabled={status === 'loading'}>
              {status === 'loading' ? 'Placing order…' : `Place order · ${formatMoney(total)}`}
            </button>
          </form>

          <aside className="checkout-summary glass-panel">
            <h2>Order summary</h2>
            <ul className="checkout-lines">
              {lines.map((l) => (
                <li key={l.id}>
                  <span>{l.name}{l.variantLabel ? ` · ${l.variantLabel}` : ''} × {l.quantity}</span>
                  <span className="gold-text">{formatMoney(l.price * (l.quantity || 1))}</span>
                </li>
              ))}
            </ul>
            <div className="checkout-coupon">
              <input value={couponInput} onChange={(e) => setCouponInput(e.target.value)} placeholder="Coupon" />
              <button type="button" className="btn-sm" onClick={applyCoupon}>Apply</button>
            </div>
            {couponErr ? <p className="checkout-error">{couponErr}</p> : null}
            <div className="checkout-totals">
              <div><span>Subtotal</span><span>{formatMoney(subtotal)}</span></div>
              {discount > 0 && <div><span>Discount</span><span>−{formatMoney(discount)}</span></div>}
              <div><span>Shipping</span><span>{shipping === 0 ? 'Free' : formatMoney(shipping)}</span></div>
              <div className="checkout-total-row"><span>Total</span><span className="gold-text">{formatMoney(total)}</span></div>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}

export default CheckoutPage
