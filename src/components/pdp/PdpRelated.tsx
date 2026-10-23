import { Link } from 'react-router-dom'
import { useState } from 'react'
import { formatMoney } from '@/lib/money'
import { addToCart } from '@/lib/cart'
import { useStorefront } from '@/components/storefront/StorefrontContext'
import { trackEvent } from '@/lib/track'
import { trackAddToCart } from '@/lib/gtag'
import type { Product } from '@/types'

function MiniProductCard({ p }: { p: Product }) {
  const img = p.imageUrl || p.variants?.[0]?.imageUrl
  const price = p.variants?.[0]?.price ?? p.price
  const currency = p.pdp?.currency || 'INR'
  if (!p.slug) return null
  return (
    <Link to={`/products/${p.slug}`} className="pdp-related-card">
      {img ? <img src={img} alt={p.name} loading="lazy" /> : <div className="pdp-related-img-ph" />}
      <span className="pdp-related-name">{p.name}</span>
      <span className="gold-text pdp-related-price">{formatMoney(price, currency)}</span>
    </Link>
  )
}

interface PdpRelatedProps {
  product: Product
  bundleProducts?: any[]
}

export function PdpRelated({ product, bundleProducts }: PdpRelatedProps) {
  const { setCartOpen } = useStorefront() || {}
  const related = product.relatedProducts || []
  const bundle = bundleProducts || product.bundleProducts || []
  const [adding, setAdding] = useState<boolean>(false)

  if (!related.length && !bundle.length) return null

  const addAllBundle = () => {
    setAdding(true)
    bundle.forEach((bp: any) => {
      const label = bp.bundleVariantLabel || bp.variants?.[0]?.label || ''
      const variant = bp.variants?.find((v: any) => v.label === label) || bp.variants?.[0]
      const line = {
        productId: bp.id,
        slug: bp.slug,
        name: bp.name,
        variantLabel: label && label !== 'Default' ? label : '',
        price: Number(variant?.price ?? bp.price),
        imageUrl: variant?.imageUrl || bp.imageUrl,
        quantity: 1,
      }
      addToCart(line)
      trackAddToCart({
        item: {
          item_id: String(line.productId),
          item_name: line.name,
          price: line.price,
          item_variant: line.variantLabel || undefined,
          item_category: bp.tier,
        },
        quantity: 1,
      })
    })
    trackEvent('pdp_bundle_add_all', { slug: product.slug, count: bundle.length })
    setCartOpen?.(true)
    setAdding(false)
  }

  return (
    <section className="container pdp-related-section">
      {related.length > 0 && (
        <>
          <h2 className="gold-text pdp-section-title">Complete your ritual</h2>
          <div className="pdp-related-track">
            {related.map((p) => <MiniProductCard key={p.id} p={p} />)}
          </div>
        </>
      )}
      {bundle.length > 0 && (
        <div className="pdp-bundle">
          <h3 className="gold-text">Frequently bought together</h3>
          <ul className="pdp-bundle-list">
            <li>{product.name}</li>
            {bundle.map((bp: any) => (
              <li key={bp.id}>{bp.name}{bp.bundleVariantLabel ? ` · ${bp.bundleVariantLabel}` : ''}</li>
            ))}
          </ul>
          <button type="button" className="btn-pill solid" onClick={addAllBundle} disabled={adding}>
            {adding ? 'Adding…' : 'Add all to cart'}
          </button>
        </div>
      )}
    </section>
  )
}
