import { addToCart } from '@/lib/cart'
import type { Product, ProductVariant } from '@/types'

export function getVariants(product: Product): ProductVariant[] {
  if (product.variants?.length) return product.variants
  return [{
    label: 'Default',
    price: product.price,
    mrp: product.compareAtPrice,
    imageUrl: product.imageUrl,
    inStock: true,
  }]
}

export function buildCartLine(product: Product, variantIdx: number, quantity: number = 1) {
  const variants = getVariants(product)
  const variant = variants[variantIdx] || variants[0]
  const price = Number(variant.price ?? product.price)
  return {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    variantLabel: variant.label !== 'Default' ? variant.label : '',
    price,
    imageUrl: variant.imageUrl || product.imageUrl,
    quantity: Math.max(1, Number(quantity) || 1),
  }
}

export function addProductToCart(
  product: Product,
  variantIdx: number,
  quantity: number,
  setCartOpen?: (open: boolean) => void
): boolean {
  const variants = getVariants(product)
  const variant = variants[variantIdx] || variants[0]
  if (variant.inStock === false) return false
  addToCart(buildCartLine(product, variantIdx, quantity))
  setCartOpen?.(true)
  return true
}
