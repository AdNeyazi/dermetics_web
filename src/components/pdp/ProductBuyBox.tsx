import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStorefront } from '@/components/storefront/StorefrontContext'
import { addToCart, cartSubtotal, readCart, saveAppliedCoupon } from '@/lib/cart'
import { validateCoupon } from '@/lib/checkout'
import { apiFetch } from '@/lib/api'
import { withReferral, getReferralCode } from '@/lib/referral'
import { toggleWishlist, isWishlisted, subscribeWishlist } from '@/lib/wishlist'
import { formatMoney, discountPercent } from '@/lib/money'
import { trackEvent } from '@/lib/track'
import { PdpHighlightTabs } from './PdpHighlightTabs'
import { ProductActionVideos } from './ProductActionVideos'
import type { Product, ProductVariant, AppliedCoupon } from '@/types'

function Stars({ value, size = 16 }: { value: number; size?: number }) {
  const v = Math.max(0, Math.min(5, Number(value) || 0))
  return (
    <span className="pdp-stars" style={{ '--star-size': `${size}px` } as React.CSSProperties} aria-hidden="true">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= Math.round(v) ? 'on' : ''}>★</span>
      ))}
    </span>
  )
}

interface DeliveryInfo {
  serviceable?: boolean
  estimatedDays?: number
  codAvailable?: boolean
  estimatedDate?: string
  error?: string
}

interface ProductBuyBoxProps {
  product: Product
  variantIdx: number
  setVariantIdx: (idx: number) => void
}

export function ProductBuyBox({ product, variantIdx, setVariantIdx }: ProductBuyBoxProps) {
  const navigate = useNavigate()
  const { content, setCartOpen } = useStorefront() || {}
  const buyBoxRef = useRef<HTMLDivElement | null>(null)
  const [stickyVisible, setStickyVisible] = useState(false)
  const pdp = product.pdp || {}
  const currency = pdp.currency || 'INR'
  const variants: ProductVariant[] = product.variants?.length ? product.variants : [{
    label: 'Default',
    price: product.price,
    mrp: product.compareAtPrice,
    imageUrl: product.imageUrl,
    inStock: true,
  }]

  const [qty, setQty] = useState(1)
  const [pincode, setPincode] = useState('')
  const [delivery, setDelivery] = useState<DeliveryInfo | null>(null)
  const [deliveryErr, setDeliveryErr] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null)
  const [wishlisted, setWishlisted] = useState(false)

  const variant = variants[variantIdx] || variants[0]
  const price = Number(variant.price ?? product.price)
  const mrp = Number(variant.mrp ?? product.compareAtPrice ?? 0)
  const off = discountPercent(price, mrp)
  const summary = product.reviewSummary || { average: 0, count: 0 }

  const trust = content?.trustLine || {}
  const trustParts: string[] = []
  if (trust.complimentaryGift !== false) trustParts.push('Complimentary gifts at checkout')
  if (trust.freeShipping !== false) trustParts.push('Free shipping')
  if (trust.cod !== false) trustParts.push('COD available')

  const guaranteeDays = content?.guaranteeDays ?? 45
  const guarantee = pdp.guarantee || {}

  useEffect(() => {
    trackEvent('pdp_view', { slug: product.slug, productId: product.id })
  }, [product.id, product.slug])

  useEffect(() => {
    const el = buyBoxRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return undefined
    const obs = new IntersectionObserver(
      ([entry]) => setStickyVisible(!entry.isIntersecting),
      { threshold: 0, rootMargin: '0px 0px 0px 0px' },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    setWishlisted(isWishlisted(product.id))
    return subscribeWishlist(() => setWishlisted(isWishlisted(product.id)))
  }, [product.id])

  const cartPayload = useMemo(() => ({
    productId: product.id,
    slug: product.slug,
    name: product.name,
    variantLabel: variant.label !== 'Default' ? variant.label : '',
    price,
    imageUrl: variant.imageUrl || product.imageUrl,
    quantity: qty,
  }), [product, variant, price, qty])

  const onVariant = (i: number) => {
    setVariantIdx(i)
    trackEvent('pdp_variant_change', { slug: product.slug, label: variants[i]?.label })
  }

  const onAdd = () => {
    if (!variant.inStock) return
    addToCart(cartPayload)
    trackEvent('add_to_cart', { slug: product.slug, variant: variant.label, qty })
    setCartOpen?.(true)
  }

  const onBuyNow = () => {
    if (!variant.inStock) return
    addToCart(cartPayload)
    trackEvent('buy_now', { slug: product.slug, variant: variant.label, qty })
    navigate('/checkout')
  }

  const checkPincode = async () => {
    const pin = pincode.replace(/\D/g, '')
    if (pin.length !== 6) {
      setDeliveryErr('Enter a valid 6-digit pincode')
      setDelivery(null)
      return
    }
    setDeliveryErr('')
    try {
      const res = await apiFetch('/api/delivery/check', { method: 'POST', body: JSON.stringify({ pincode: pin }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Check failed')
      setDelivery(data)
      trackEvent('pdp_pincode_check', { slug: product.slug, pincode: pin, serviceable: data.serviceable })
    } catch (e: unknown) {
      setDelivery(null)
      setDeliveryErr(e instanceof Error ? e.message : 'Could not check delivery')
    }
  }

  const applyCoupon = async () => {
    const code = couponCode.trim()
    if (!code) return
    try {
      const sub = cartSubtotal(readCart())
      const data = await validateCoupon(code, sub || price)
      const payload: AppliedCoupon = { ...data.coupon, discount: data.discount }
      saveAppliedCoupon(payload)
      setAppliedCoupon(payload)
      trackEvent('pdp_coupon_applied', { slug: product.slug, code: payload.code, ref: getReferralCode() || null })
    } catch {
      const eligible = (pdp.eligibleCoupons || []).find((c: any) => (c.code || '').toUpperCase() === code.toUpperCase())
      if (!eligible) {
        setAppliedCoupon(null)
        return
      }
      setAppliedCoupon(eligible)
      trackEvent('pdp_coupon_applied', { slug: product.slug, code: eligible.code })
    }
  }

  const onToggleWishlist = () => {
    toggleWishlist(product.id)
    setWishlisted(isWishlisted(product.id))
  }

  const share = async () => {
    const url = typeof window !== 'undefined' ? withReferral(window.location.href) : ''
    trackEvent('share', { slug: product.slug, platform: 'copy', ref: getReferralCode() || null })
    try {
      if (navigator.share) {
        await navigator.share({ title: product.name, url })
        trackEvent('share', { slug: product.slug, platform: 'native', ref: getReferralCode() || null })
        return
      }
      await navigator.clipboard.writeText(url)
    } catch { /* ignore */ }
  }

  return (
    <>
    <div className="pdp-buy-box" ref={buyBoxRef}>
      {summary.count > 0 ? (
        <a href="#reviews" className="pdp-rating-link">
          <Stars value={summary.average} />
          <span>{summary.average.toFixed(1)}</span>
          <span className="pdp-review-count">({summary.count} reviews)</span>
        </a>
      ) : (
        <a href="#reviews" className="pdp-rating-link muted">
          <Stars value={0} />
          <span className="pdp-review-count">Be the first to review</span>
        </a>
      )}

      {pdp.dermatologicallyTested ? (
        <span className="pdp-derm-badge">Dermatologically Tested</span>
      ) : null}

      <h1 className="pdp-title gold-text">{product.name}</h1>
      {pdp.subtitle ? <p className="pdp-subtitle">{pdp.subtitle}</p> : null}

      <PdpHighlightTabs
        formulatedFor={pdp.formulatedFor}
        freeFrom={pdp.freeFrom}
        proTips={pdp.proTips}
      />

      {variants.length > 1 || (variants[0]?.label && variants[0].label !== 'Default') ? (
        <div className="pdp-variants">
          <span className="pdp-label">Select variant</span>
          <div className="variant-pills">
            {variants.map((v, i) => (
              <button
                key={v.label + i}
                type="button"
                className={`variant-pill ${variantIdx === i ? 'active' : ''} ${v.inStock === false ? 'oos' : ''}`}
                onClick={() => onVariant(i)}
                disabled={v.inStock === false}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="pdp-price-block">
        <span className="pdp-price gold-text">{formatMoney(price, currency)}</span>
        {mrp > price ? (
          <>
            <span className="pdp-mrp">{formatMoney(mrp, currency)}</span>
            {off > 0 ? <span className="pdp-off-pill">{off}% OFF</span> : null}
          </>
        ) : null}
      </div>
      {pdp.taxInclusive !== false ? (
        <p className="pdp-tax-line">Inclusive of all taxes</p>
      ) : null}

      {trustParts.length ? (
        <p className="pdp-trust-line">{trustParts.join(' • ')}</p>
      ) : null}

      {(guarantee.title || guarantee.body) ? (
        <div className="pdp-guarantee-card">
          <h3 className="gold-text">{guarantee.title || `Money-back guarantee (${guaranteeDays} days)`}</h3>
          {guarantee.body ? <p>{String(guarantee.body).split('\n').map((line: string, i: number) => (line ? <span key={i}>{line}<br /></span> : <br key={i} />))}</p> : null}
          <p className="pdp-guarantee-bold">Your ritual, our commitment — replace with your closing line in admin.</p>
        </div>
      ) : null}

      <div className="pdp-qty-row">
        <span className="pdp-label">Quantity</span>
        <div className="pdp-stepper">
          <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease">−</button>
          <span>{qty}</span>
          <button type="button" onClick={() => setQty((q) => q + 1)} aria-label="Increase">+</button>
        </div>
      </div>

      <div className="pdp-cta-row">
        <button type="button" className="btn-pill pdp-btn-outline" onClick={onAdd} disabled={variant.inStock === false}>
          Add to cart
        </button>
        <button type="button" className="btn-pill solid pdp-btn-buy" onClick={onBuyNow} disabled={variant.inStock === false}>
          Buy now
        </button>
      </div>
      {variant.inStock === false ? <p className="pdp-oos">Out of stock</p> : null}

      <ProductActionVideos videos={pdp.actionVideos} slug={product.slug} placement="buyBox" />

      <div className="pdp-util-row">
        <button type="button" className="pdp-util-btn" onClick={share}>Share</button>
        <button type="button" className="pdp-util-btn" onClick={onToggleWishlist}>
          {wishlisted ? 'Wishlisted' : 'Wishlist'}
        </button>
      </div>

      <div className="pdp-extra">
        <div className="pdp-coupon">
          <input
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            placeholder="Coupon code"
            aria-label="Coupon code"
          />
          <button type="button" className="btn-sm" onClick={applyCoupon}>Apply</button>
        </div>
        {appliedCoupon ? (
          <p className="pdp-coupon-applied">Applied: {appliedCoupon.label || appliedCoupon.code}</p>
        ) : null}
        <div className="pdp-pincode">
          <input
            value={pincode}
            onChange={(e) => setPincode(e.target.value)}
            placeholder="Delivery pincode"
            maxLength={6}
            aria-label="Delivery pincode"
          />
          <button type="button" className="btn-sm" onClick={checkPincode}>Check</button>
        </div>
        {deliveryErr ? <p className="pdp-pincode-msg err">{deliveryErr}</p> : null}
        {delivery?.serviceable ? (
          <p className="pdp-pincode-msg ok">
            Delivers in ~{delivery.estimatedDays} days
            {delivery.codAvailable ? ' · COD available' : ''}
            {delivery.estimatedDate ? ` · by ${delivery.estimatedDate}` : ''}
          </p>
        ) : null}
      </div>
    </div>
    <PdpStickyBar product={product} variantIdx={variantIdx} visible={stickyVisible} onAdd={onAdd} />
    </>
  )
}

interface PdpStickyBarProps {
  product: Product
  variantIdx: number
  visible: boolean
  onAdd: () => void
}

function PdpStickyBar({ product, variantIdx, visible, onAdd }: PdpStickyBarProps) {
  const variants = product.variants?.length ? product.variants : [{ price: product.price, inStock: true }]
  const variant = variants[variantIdx] || variants[0]
  const currency = product.pdp?.currency || 'INR'
  const price = Number(variant.price ?? product.price)

  return (
    <div className={`pdp-sticky-bar ${visible ? 'is-visible' : ''}`} aria-hidden={!visible}>
      <span className="pdp-sticky-price gold-text">{formatMoney(price, currency)}</span>
      <button type="button" className="btn-pill pdp-btn-outline" onClick={onAdd} disabled={variant.inStock === false}>
        Add to cart
      </button>
    </div>
  )
}
