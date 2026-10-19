import type { Product } from '@/types'

/** Max products shown per tier on the home page before linking to /products */
export const HOME_TIER_PREVIEW_LIMIT = 4

/** Tiers that use the standard product catalog (bespoke / super stays on home) */
export const CATALOG_TIER_KEYS = ['premium', 'ultra']

export function groupProductsByTier(products: Product[] = [], tierKeys: string[] = CATALOG_TIER_KEYS): Record<string, Product[]> {
  const map: Record<string, Product[]> = {}
  tierKeys.forEach((key) => { map[key] = [] })
  for (const p of products || []) {
    const tier = (p as any).tier || p.categoryKey
    if (tier && map[tier]) map[tier].push(p)
  }
  return map
}

export function filterProductsByQuery(products: Product[] = [], query: string): Product[] {
  const q = (query || '').trim().toLowerCase()
  if (!q) return products
  return (products || []).filter((p) => {
    const hay = `${p.name} ${p.tag || ''} ${p.description || ''}`.toLowerCase()
    return hay.includes(q)
  })
}
