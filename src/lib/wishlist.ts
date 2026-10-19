const KEY = 'dermetics_wishlist'

export function readWishlist(): Array<number | string> {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(KEY)
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

export function toggleWishlist(productId: number | string): Array<number | string> {
  const list = readWishlist()
  const next = list.some((id) => String(id) === String(productId))
    ? list.filter((id) => String(id) !== String(productId))
    : [...list, productId]
  localStorage.setItem(KEY, JSON.stringify(next))
  window.dispatchEvent(new Event('dermetics-wishlist'))
  return next
}

export function isWishlisted(productId: number | string): boolean {
  return readWishlist().some((id) => String(id) === String(productId))
}

export function subscribeWishlist(listener: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener('dermetics-wishlist', listener)
  return () => window.removeEventListener('dermetics-wishlist', listener)
}
