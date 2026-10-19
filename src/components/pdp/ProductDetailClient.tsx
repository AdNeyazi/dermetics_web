import { useCallback, useMemo, useState } from 'react'
import { useStorefront } from '@/components/storefront/StorefrontContext'
import { ProductGallery } from './ProductGallery'
import { ProductBuyBox } from './ProductBuyBox'
import { PdpBelowFold } from './PdpBelowFold'
import { GuaranteeStrip } from './GuaranteeStrip'
import { addProductToCart, getVariants } from '@/lib/pdp'
import { trackEvent } from '@/lib/track'
import type { Product } from '@/types'

export interface ProductDetailClientProps {
  product: Product
}

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const { setCartOpen } = useStorefront() || {}
  const variants = useMemo(() => getVariants(product), [product])

  const [variantIdx, setVariantIdx] = useState(0)
  const variant = variants[variantIdx] || variants[0]
  const variantImageUrl = variant?.imageUrl || ''

  const handleAddToCart = useCallback((qty = 1) => {
    const ok = addProductToCart(product, variantIdx, qty, setCartOpen)
    if (ok) trackEvent('add_to_cart', { slug: product.slug, source: 'pdp_strip' })
  }, [product, variantIdx, setCartOpen])

  return (
    <div className="pdp-page">
      <div className="container pdp-hero">
        <div className="pdp-hero-grid">
          <ProductGallery product={product} variantImageUrl={variantImageUrl} />
          <ProductBuyBox
            product={product}
            variantIdx={variantIdx}
            setVariantIdx={setVariantIdx}
          />
        </div>
        <GuaranteeStrip
          product={product}
          variantIdx={variantIdx}
          onAddToCart={() => handleAddToCart(1)}
        />
      </div>

      <PdpBelowFold product={product} />
    </div>
  )
}

export default ProductDetailClient
