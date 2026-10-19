import { apiFetch } from '@/lib/api'
import { getReferralCode } from '@/lib/referral'
import type { CartLine, Order } from '@/types'

export interface PlaceOrderInput {
  items: CartLine[]
  shipping: any
  couponCode?: string
  paymentMethod?: string
}

export async function validateCoupon(code: string, subtotal: number): Promise<any> {
  const res = await apiFetch('/api/coupons/validate', {
    method: 'POST',
    body: JSON.stringify({ code, subtotal }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Invalid coupon')
  return data
}

export async function placeOrder({ items, shipping, couponCode, paymentMethod }: PlaceOrderInput): Promise<Order> {
  const res = await apiFetch('/api/orders', {
    method: 'POST',
    body: JSON.stringify({
      items: items.map((l) => ({
        productId: l.productId,
        variantLabel: l.variantLabel || '',
        quantity: l.quantity || 1,
      })),
      shipping,
      couponCode: couponCode || '',
      referralCode: getReferralCode(),
      paymentMethod: paymentMethod || 'cod',
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Checkout failed')
  return data.order
}

export async function fetchMyOrders(): Promise<Order[]> {
  const res = await apiFetch('/api/orders')
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Could not load orders')
  return Array.isArray(data) ? data : []
}
