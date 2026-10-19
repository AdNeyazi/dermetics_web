import { apiFetch } from '@/lib/api'
import type { Product } from '@/types'

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  const res = await apiFetch(`/api/products/${encodeURIComponent(slug)}`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Product fetch failed: ${res.status}`)
  return res.json()
}
