import { useState } from 'react'
import { Link } from 'react-router-dom'
import { trackSelectItem } from '@/lib/gtag'
import type { Product } from '@/types'

interface CatalogProductCardProps {
  p: Product
  onInquire?: (p: Product, variantLabel: string | null) => void
  className?: string
}

export function CatalogProductCard({ p, onInquire, className = '' }: CatalogProductCardProps) {
  const hasVariants = Array.isArray(p.variants) && p.variants.length > 0
  const [sel, setSel] = useState(0)
  const price = hasVariants ? p.variants![sel].price : p.price
  const variantLabel = hasVariants ? p.variants![sel].label : null
  const img = (hasVariants && p.variants![sel].imageUrl) || p.imageUrl
  const href = p.slug ? `/products/${p.slug}` : null

  const onSelect = () => {
    trackSelectItem({
      item: {
        item_id: String(p.id),
        item_name: p.name,
        price: Number(price),
        item_category: p.tier,
        item_variant: variantLabel || undefined,
      },
    })
  }

  return (
    <div className={`product-card catalog-product-card ${className}`.trim()}>
      <div className="product-img">
        <img src={img} alt={p.name} />
      </div>
      <div className="product-body">
        <span className="product-tag">{p.tag}</span>
        {href ? (
          <Link to={href} className="product-name-link" onClick={onSelect}><h3 className="product-name">{p.name}</h3></Link>
        ) : (
          <h3 className="product-name">{p.name}</h3>
        )}
        <p className="product-desc">{p.description}</p>
        {hasVariants && (
          <div className="variant-pills">
            {p.variants!.map((v, i) => (
              <button
                key={i}
                type="button"
                className={`variant-pill ${sel === i ? 'active' : ''}`}
                onClick={() => setSel(i)}
              >
                {v.label}
              </button>
            ))}
          </div>
        )}
        <div className="product-footer">
          <span className="product-price gold-text">₹{Number(price).toLocaleString('en-IN')}</span>
          <div className="product-footer-actions">
            {href ? (
              <Link to={href} className="btn-inquire btn-inquire-outline">View product</Link>
            ) : null}
            {onInquire ? (
              <button type="button" className="btn-inquire" onClick={() => onInquire(p, variantLabel)}>Inquire</button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
