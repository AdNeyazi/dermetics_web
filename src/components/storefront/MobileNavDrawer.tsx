import { Link } from 'react-router-dom'
import { useStorefront } from './StorefrontContext'
import { useAuth } from '@/context/AuthContext'

interface MobileNavDrawerProps {
  open: boolean
  onClose: () => void
}

export function MobileNavDrawer({ open, onClose }: MobileNavDrawerProps) {
  const { categories, setCartOpen } = useStorefront() || {}
  const { user } = useAuth()

  if (!open) return null

  const shopLinks = [
    { to: '/products', label: 'All products' },
    ...(categories?.length ? categories : [
      { key: 'premium', label: 'Premium' },
      { key: 'ultra', label: 'Ultra Premium' },
    ]).filter((c) => c.key !== 'super').map((c) => ({ to: `/products#${c.key}`, label: c.label })),
    { to: '/#super', label: 'Bespoke programmes' },
  ]

  return (
    <>
      <button type="button" className="mobile-nav-backdrop" aria-label="Close menu" onClick={onClose} />
      <nav className="mobile-nav-drawer" aria-label="Mobile">
        <div className="mobile-nav-head">
          <span className="gold-text">Menu</span>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">&times;</button>
        </div>
        <div className="mobile-nav-section">
          <span className="mobile-nav-label">Shop</span>
          {shopLinks.map((l) => (
            <Link key={`${l.to}-${l.label}`} to={l.to} className="mobile-nav-link" onClick={onClose}>{l.label}</Link>
          ))}
        </div>
        <Link to="/#our-story" className="mobile-nav-link" onClick={onClose}>Our Story</Link>
        <Link to="/#the-lab" className="mobile-nav-link" onClick={onClose}>The Lab</Link>
        <Link to="/wishlist" className="mobile-nav-link" onClick={onClose}>Wishlist</Link>
        <Link to="/account/orders" className="mobile-nav-link" onClick={onClose}>Orders</Link>
        <Link
          to={user ? (user.role === 'admin' ? '/dashboard' : '/account/orders') : '/login'}
          className="mobile-nav-link"
          onClick={onClose}
        >
          {user ? (user.role === 'admin' ? 'Dashboard' : 'Account') : 'Login'}
        </Link>
        <button
          type="button"
          className="mobile-nav-link mobile-nav-btn"
          onClick={() => { onClose(); setCartOpen?.(true) }}
        >
          Cart
        </button>
      </nav>
    </>
  )
}
