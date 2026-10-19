import { useStorefront } from '@/components/storefront/StorefrontContext'
import { formatMoney, discountPercent } from '@/lib/money'
import { getVariants } from '@/lib/pdp'
import type { Product } from '@/types'

interface GuaranteeStripProps {
  product: Product
  variantIdx: number
  onAddToCart: () => void
}

export function GuaranteeStrip({ product, variantIdx, onAddToCart }: GuaranteeStripProps) {
  const { content } = useStorefront() || {}
  const pdp = product.pdp || {}
  const guarantee = pdp.guarantee || {}
  const guaranteeDays = content?.guaranteeDays ?? 45
  const variants = getVariants(product)
  const variant = variants[variantIdx] || variants[0]
  const currency = pdp.currency || 'INR'
  const price = Number(variant.price ?? product.price)
  const mrp = Number(variant.mrp ?? product.compareAtPrice ?? 0)
  const off = discountPercent(price, mrp)

  if (!guarantee.title && !guarantee.body) return null

  return (
    <section className="pdp-guarantee-strip">
      <div className="container pdp-guarantee-strip-inner">
        <div className="pdp-guarantee-strip-copy">
          <h2 className="gold-text">{guarantee.title || `Money-back guarantee (${guaranteeDays} days)`}</h2>
          <p>{guarantee.body?.split('\n')[0] || 'Replace guarantee copy in admin.'}</p>
        </div>
        <div className="pdp-guarantee-strip-buy">
          <div className="pdp-price-block">
            <span className="pdp-price gold-text">{formatMoney(price, currency)}</span>
            {mrp > price ? <span className="pdp-mrp">{formatMoney(mrp, currency)}</span> : null}
            {off > 0 ? <span className="pdp-off-pill">{off}% OFF</span> : null}
          </div>
          <button type="button" className="btn-pill pdp-btn-outline" onClick={onAddToCart}>
            Add to cart
          </button>
        </div>
      </div>
    </section>
  )
}
