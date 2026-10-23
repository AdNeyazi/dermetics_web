import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  cartItemCount,
  cartSubtotal,
  readAppliedCoupon,
  readCart,
  removeLine,
  saveAppliedCoupon,
  subscribeCart,
  updateLineQuantity,
} from '@/lib/cart'
import { validateCoupon } from '@/lib/checkout'
import { formatMoney } from '@/lib/money'
import { trackViewCart, trackAddToCart, trackRemoveFromCart } from '@/lib/gtag'
import { useStorefront } from './StorefrontContext'
import type { CartLine, AppliedCoupon } from '@/types'

export function CartDrawer() {
  const ctx = useStorefront()
  const open = ctx?.cartOpen
  const setOpen = ctx?.setCartOpen
  const [lines, setLines] = useState<CartLine[]>([])
  const [couponInput, setCouponInput] = useState<string>('')
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null)
  const [couponErr, setCouponErr] = useState<string>('')

  const sync = () => {
    setLines(readCart())
    setCoupon(readAppliedCoupon())
  }

  useEffect(() => {
    sync()
    return subscribeCart(sync)
  }, [])

  const changeQuantity = (line: CartLine, delta: 1 | -1) => {
    const current = line.quantity || 1
    // updateLineQuantity clamps to 1..99, so a click at the bounds changes nothing
    if (current + delta < 1 || current + delta > 99) return
    const item = {
      item_id: String(line.productId),
      item_name: line.name,
      price: Number(line.price),
      item_variant: line.variantLabel,
    }
    if (delta > 0) trackAddToCart({ item, quantity: 1 })
    else trackRemoveFromCart({ item, quantity: 1 })
    updateLineQuantity(line.id, current + delta)
  }

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen?.(false) }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    sync()
    const currentLines = readCart()
    if (currentLines.length > 0) {
      trackViewCart({
        items: currentLines.map((l) => ({
          item_id: String(l.productId),
          item_name: l.name,
          price: Number(l.price),
          quantity: Number(l.quantity) || 1,
          item_variant: l.variantLabel,
        })),
        value: cartSubtotal(currentLines),
      })
    }
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, setOpen])

  if (!open) return null

  const subtotal = cartSubtotal(lines)
  const discount = coupon?.discount || 0
  const total = Math.max(0, subtotal - discount)

  const applyCoupon = async () => {
    setCouponErr('')
    try {
      const data = await validateCoupon(couponInput.trim(), subtotal)
      const payload: AppliedCoupon = { ...data.coupon, discount: data.discount, code: data.coupon.code }
      saveAppliedCoupon(payload)
      setCoupon(payload)
    } catch (e: any) {
      setCouponErr(e.message)
      saveAppliedCoupon(null)
      setCoupon(null)
    }
  }

  const clearCoupon = () => {
    saveAppliedCoupon(null)
    setCoupon(null)
    setCouponInput('')
    setCouponErr('')
  }

  return (
    <>
      <button type="button" className="cart-drawer-backdrop" aria-label="Close cart" onClick={() => setOpen?.(false)} />
      <aside className="cart-drawer" role="dialog" aria-label="Shopping cart">
        <div className="cart-drawer-head">
          <h2 className="gold-text">Your cart</h2>
          <button type="button" className="icon-btn" onClick={() => setOpen?.(false)} aria-label="Close">&times;</button>
        </div>

        {lines.length === 0 ? (
          <div className="cart-drawer-empty">
            <p>Your cart is empty.</p>
            <Link to="/#shop" className="btn-pill solid" onClick={() => setOpen?.(false)}>Continue shopping</Link>
          </div>
        ) : (
          <>
            <ul className="cart-drawer-lines">
              {lines.map((line) => (
                <li key={line.id} className="cart-drawer-line">
                  <div className="cart-line-main">
                    {line.imageUrl ? (
                      <img className="cart-line-thumb" src={line.imageUrl} alt="" />
                    ) : (
                      <div className="cart-line-thumb ph" />
                    )}
                    <div className="cart-line-info">
                      <strong>{line.name}</strong>
                      {line.variantLabel ? <span className="cart-line-variant">{line.variantLabel}</span> : null}
                      <span className="gold-text cart-line-price">{formatMoney(line.price)}</span>
                      <div className="cart-line-stepper">
                        <button type="button" aria-label="Decrease" onClick={() => changeQuantity(line, -1)}>−</button>
                        <span>{line.quantity || 1}</span>
                        <button type="button" aria-label="Increase" onClick={() => changeQuantity(line, 1)}>+</button>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="cart-line-remove"
                    onClick={() => {
                      trackRemoveFromCart({
                        item: {
                          item_id: String(line.productId),
                          item_name: line.name,
                          price: Number(line.price),
                          item_variant: line.variantLabel,
                        },
                        quantity: Number(line.quantity) || 1,
                      })
                      removeLine(line.id)
                    }}
                    aria-label="Remove"
                  >×</button>
                </li>
              ))}
            </ul>
            <div className="cart-drawer-coupon">
              <input
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                placeholder="Coupon code"
                aria-label="Coupon code"
              />
              <button type="button" className="btn-sm" onClick={applyCoupon}>Apply</button>
            </div>
            {coupon ? (
              <p className="cart-coupon-applied">
                {coupon.label || coupon.code} (−{formatMoney(discount)})
                <button type="button" className="cart-coupon-clear" onClick={clearCoupon}>Remove</button>
              </p>
            ) : null}
            {couponErr ? <p className="cart-coupon-err">{couponErr}</p> : null}
            <div className="cart-drawer-foot">
              <div className="cart-drawer-subtotal">
                <span>Subtotal</span>
                <span className="gold-text">{formatMoney(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="cart-drawer-subtotal">
                  <span>Discount</span>
                  <span className="gold-text">−{formatMoney(discount)}</span>
                </div>
              )}
              <div className="cart-drawer-subtotal cart-drawer-total">
                <span>Total</span>
                <span className="gold-text">{formatMoney(total)}</span>
              </div>
              <p className="cart-drawer-note">Tax included. Shipping calculated at checkout.</p>
              <Link to="/checkout" className="btn-pill solid cart-checkout-btn" onClick={() => setOpen?.(false)}>
                Checkout
              </Link>
            </div>
          </>
        )}
      </aside>
    </>
  )
}

export function useCartCount(): number {
  const [count, setCount] = useState<number>(0)
  useEffect(() => {
    const sync = () => setCount(cartItemCount())
    sync()
    return subscribeCart(sync)
  }, [])
  return count
}
