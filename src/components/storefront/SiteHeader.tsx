import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStorefront } from './StorefrontContext'
import { useAuth } from '@/context/AuthContext'
import { useCartCount } from './CartDrawer'
import { MobileNavDrawer } from './MobileNavDrawer'

export function SiteHeader() {
  const { categories, setCartOpen } = useStorefront() || {}
  const { user } = useAuth()
  const cartCount = useCartCount()
  const navigate = useNavigate()
  const [shopOpen, setShopOpen] = useState<boolean>(false)
  const [searchOpen, setSearchOpen] = useState<boolean>(false)
  const [mobileOpen, setMobileOpen] = useState<boolean>(false)
  const [query, setQuery] = useState<string>('')
  const shopRef = useRef<HTMLDivElement>(null)

  const shopLinks = (categories?.length ? categories : [
    { key: 'premium', label: 'Premium' },
    { key: 'ultra', label: 'Ultra Premium' },
    { key: 'super', label: 'Super Ultra Premium' },
  ])

  useEffect(() => {
    if (!shopOpen) return undefined
    const onDoc = (e: MouseEvent) => {
      if (shopRef.current && !shopRef.current.contains(e.target as Node)) setShopOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [shopOpen])

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    if (q) navigate(`/products?q=${encodeURIComponent(q)}`)
    else setSearchOpen(false)
  }

  return (
    <>
      <header className="header site-header">
        <div className="header-inner">
          <div className="header-start">
            <button
              type="button"
              className="header-menu-btn"
              aria-label="Open menu"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(true)}
            >
              <span /><span /><span />
            </button>
            <Link to="/" className="brand gold-text">DERMATICS</Link>
          </div>

          <nav className="site-nav" aria-label="Main">
            <div className="site-nav-item" ref={shopRef}>
              <button
                type="button"
                className="site-nav-link"
                aria-expanded={shopOpen}
                onClick={() => setShopOpen((v) => !v)}
              >
                Shop <span className="nav-chevron" aria-hidden="true">▾</span>
              </button>
              {shopOpen && (
                <div className="site-nav-dropdown">
                  <Link
                    to="/products"
                    className="site-nav-dropdown-link site-nav-dropdown-link--strong"
                    onClick={() => setShopOpen(false)}
                  >
                    All products
                  </Link>
                  {shopLinks.filter((c) => c.key !== 'super').map((c) => (
                    <Link
                      key={c.key}
                      to={`/products#${c.key}`}
                      className="site-nav-dropdown-link"
                      onClick={() => setShopOpen(false)}
                    >
                      {c.label}
                    </Link>
                  ))}
                  <Link
                    to="/#super"
                    className="site-nav-dropdown-link"
                    onClick={() => setShopOpen(false)}
                  >
                    Bespoke programmes
                  </Link>
                </div>
              )}
            </div>
            <Link to="/#our-story" className="site-nav-link">Our Story</Link>
            <Link to="/#the-lab" className="site-nav-link">The Lab</Link>
          </nav>

          <div className="header-actions">
            <div className="header-search-wrap">
              <button
                type="button"
                className="icon-btn"
                aria-label="Search"
                aria-expanded={searchOpen}
                onClick={() => setSearchOpen((v) => !v)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M20 20l-3.5-3.5" />
                </svg>
              </button>
              {searchOpen && (
                <form className="header-search-popover" onSubmit={onSearchSubmit}>
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search products…"
                    autoFocus
                    aria-label="Search products"
                  />
                </form>
              )}
            </div>
            <Link to="/wishlist" className="header-login-link header-wishlist-link">Wishlist</Link>
            <Link
              to={user ? (user.role === 'admin' ? '/dashboard' : '/account/orders') : '/login'}
              className="header-login-link"
            >
              {user ? (user.role === 'admin' ? 'Dashboard' : 'Account') : 'Login'}
            </Link>
            <button
              type="button"
              className="header-cart-btn"
              aria-label={`Cart, ${cartCount} items`}
              onClick={() => setCartOpen?.(true)}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M6 6h15l-1.5 9h-12z" />
                <circle cx="9" cy="20" r="1" />
                <circle cx="18" cy="20" r="1" />
                <path d="M6 6L5 3H2" />
              </svg>
              {cartCount > 0 && <span className="header-cart-count">{cartCount}</span>}
            </button>
          </div>
        </div>
      </header>
      <MobileNavDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  )
}
