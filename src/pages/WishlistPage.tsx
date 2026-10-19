import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '@/lib/api'
import { readWishlist, subscribeWishlist } from '@/lib/wishlist'
import { formatMoney } from '@/lib/money'
import type { Product } from '@/types'

export function WishlistPage() {
  const [ids, setIds] = useState<Array<string | number>>([])
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    const load = async () => {
      const list = readWishlist()
      setIds(list)
      if (!list.length) {
        setProducts([])
        return
      }
      try {
        const res = await apiFetch('/api/products')
        const all = await res.json()
        setProducts((Array.isArray(all) ? all : []).filter((p: Product) => list.some((id) => String(id) === String(p.id))))
      } catch (err) {
        console.warn('Failed to load wishlist products:', err)
      }
    }
    load()
    return subscribeWishlist(load)
  }, [])

  return (
    <div className="container section-pad">
      <h1 className="gold-text checkout-title">Wishlist</h1>
      {ids.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>Save products from any product page.</p>
      ) : (
        <div className="pdp-related-track">
          {products.map((p) => (
            <Link key={p.id} to={`/products/${p.slug}`} className="pdp-related-card">
              {p.imageUrl ? <img src={p.imageUrl} alt={p.name} /> : <div className="pdp-related-img-ph" />}
              <span className="pdp-related-name">{p.name}</span>
              <span className="gold-text pdp-related-price">{formatMoney(p.variants?.[0]?.price ?? p.price)}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default WishlistPage
