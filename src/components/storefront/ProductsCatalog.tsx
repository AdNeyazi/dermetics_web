import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '@/lib/api'
import { CATALOG_TIER_KEYS, filterProductsByQuery, groupProductsByTier } from '@/lib/catalog'
import { CatalogProductCard } from './CatalogProductCard'
import type { Product, Category } from '@/types'

const DEFAULT_TABS: Category[] = [
  { key: 'premium', label: 'Premium' },
  { key: 'ultra', label: 'Ultra Premium' },
]

function tierFromHash(hash: string): string | null {
  const key = hash.replace('#', '')
  return CATALOG_TIER_KEYS.includes(key) ? key : null
}

export function ProductsCatalog() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>(DEFAULT_TABS)
  const [intros, setIntros] = useState<Record<string, { title?: string; text?: string }>>({})
  const [query, setQuery] = useState<string>('')
  const [active, setActive] = useState<string>('premium')
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const q = params.get('q')
    if (q) setQuery(q)
    const fromHash = tierFromHash(window.location.hash)
    if (fromHash) setActive(fromHash)
  }, [])

  useEffect(() => {
    setLoading(true)
    Promise.all([
      apiFetch('/api/products').then((r) => r.json()),
      apiFetch('/api/categories').then((r) => r.json()),
    ])
      .then(([prods, cats]) => {
        setProducts(Array.isArray(prods) ? prods : [])
        if (Array.isArray(cats) && cats.length) {
          const shopCats = cats.filter((c: Category) => CATALOG_TIER_KEYS.includes(c.key))
          setCategories(shopCats.length ? shopCats : DEFAULT_TABS)
          const m: Record<string, { title?: string; text?: string }> = {}
          cats.forEach((c: any) => { m[c.key] = { title: c.introTitle, text: c.introText } })
          setIntros(m)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => filterProductsByQuery(products, query), [products, query])
  const byTier = useMemo(() => groupProductsByTier(filtered, CATALOG_TIER_KEYS), [filtered])

  const tierTabs = categories.filter((c) => CATALOG_TIER_KEYS.includes(c.key))
  const activeList = byTier[active] || []
  const intro = intros[active] || {}
  const activeLabel = tierTabs.find((t) => t.key === active)?.label || active

  const selectTier = (key: string) => {
    setActive(key)
    const q = query.trim()
    const base = q ? `/products?q=${encodeURIComponent(q)}` : '/products'
    window.history.replaceState(null, '', `${base}#${key}`)
  }

  const onSearchChange = (value: string) => {
    setQuery(value)
    const q = value.trim()
    const url = q ? `/products?q=${encodeURIComponent(q)}#${active}` : `/products#${active}`
    window.history.replaceState(null, '', url)
  }

  return (
    <div className="products-catalog-page">
      <div className="container">
        <header className="products-catalog-hero products-catalog-hero--compact">
          <h1 className="gold-text">Shop</h1>
          <form
            className="products-catalog-search"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              type="search"
              value={query}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search in this category…"
              aria-label="Search products"
            />
            {query ? (
              <button
                type="button"
                className="btn-sm"
                onClick={() => onSearchChange('')}
              >
                Clear
              </button>
            ) : null}
          </form>
        </header>

        <div className="switcher-wrap products-catalog-switcher">
          <div className="switcher" role="tablist" aria-label="Product category">
            {tierTabs.map((c) => (
              <button
                key={c.key}
                type="button"
                role="tab"
                aria-selected={active === c.key}
                className={active === c.key ? 'active' : ''}
                onClick={() => selectTier(c.key)}
              >
                {c.label}
                <span className="switcher-count">{byTier[c.key]?.length || 0}</span>
              </button>
            ))}
          </div>
        </div>

        <section className="products-catalog-section view" aria-labelledby="products-catalog-heading">
          <div className="section-intro products-catalog-section-head">
            <h2 id="products-catalog-heading" className="gold-text">{intro.title || activeLabel}</h2>
            {intro.text ? <p>{intro.text}</p> : null}
          </div>

          {loading ? (
            <p className="products-catalog-empty">Loading products…</p>
          ) : activeList.length === 0 ? (
            <p className="products-catalog-empty">
              {query
                ? `No ${activeLabel} products match your search.`
                : `No products in ${activeLabel} yet.`}
            </p>
          ) : (
            <div className="product-grid">
              {activeList.map((p) => <CatalogProductCard key={p.id} p={p} />)}
            </div>
          )}
        </section>

        <p className="products-catalog-bespoke">
          <Link to="/#super">Explore bespoke programmes</Link>
          — custom formulations on the home page.
        </p>
      </div>
    </div>
  )
}
