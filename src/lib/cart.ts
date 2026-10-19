import type { CartLine, AppliedCoupon } from '@/types'

const CART_KEY = 'dermetics_cart'
const COUPON_KEY = 'dermetics_applied_coupon'

export function readCart(): CartLine[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(CART_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function writeCart(lines: CartLine[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(CART_KEY, JSON.stringify(lines))
  window.dispatchEvent(new Event('dermetics-cart'))
}

export function cartItemCount(): number {
  return readCart().reduce((sum, line) => sum + Math.max(1, Number(line.quantity) || 1), 0)
}

export function cartSubtotal(lines: CartLine[] = readCart()): number {
  return lines.reduce(
    (sum, line) => sum + (Number(line.price) || 0) * Math.max(1, Number(line.quantity) || 1),
    0,
  )
}

export function subscribeCart(listener: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener('dermetics-cart', listener)
  return () => window.removeEventListener('dermetics-cart', listener)
}

export function lineId(productId: number | string, variantLabel?: string): string {
  return `${productId}::${variantLabel || ''}`
}

export interface AddToCartInput {
  productId: number | string
  slug?: string
  name: string
  variantLabel?: string
  price: number
  imageUrl?: string
  quantity?: number
}

export function addToCart(item: AddToCartInput): CartLine[] {
  const qty = Math.max(1, Number(item.quantity) || 1)
  const id = lineId(item.productId, item.variantLabel)
  const cart = readCart()
  const idx = cart.findIndex((l) => l.id === id)
  if (idx >= 0) {
    cart[idx].quantity = (cart[idx].quantity || 1) + qty
  } else {
    cart.push({
      id,
      productId: item.productId,
      slug: item.slug || '',
      name: item.name,
      variantLabel: item.variantLabel || '',
      price: item.price,
      imageUrl: item.imageUrl || '',
      quantity: qty,
    })
  }
  writeCart(cart)
  return cart
}

export function updateLineQuantity(id: string, quantity: number): CartLine[] {
  const qty = Math.max(1, Math.min(99, Number(quantity) || 1))
  const cart = readCart().map((l) => (l.id === id ? { ...l, quantity: qty } : l))
  writeCart(cart)
  return cart
}

export function removeLine(id: string): void {
  writeCart(readCart().filter((l) => l.id !== id))
}

export function clearCart(): void {
  writeCart([])
}

export function readAppliedCoupon(): AppliedCoupon | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(COUPON_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveAppliedCoupon(coupon: AppliedCoupon | null): void {
  if (typeof window === 'undefined') return
  if (!coupon) {
    sessionStorage.removeItem(COUPON_KEY)
  } else {
    sessionStorage.setItem(COUPON_KEY, JSON.stringify(coupon))
  }
  window.dispatchEvent(new Event('dermetics-cart'))
}
