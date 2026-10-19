import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { AnnouncementMarquee } from './AnnouncementMarquee'
import { SiteHeader } from './SiteHeader'
import { SiteFooter } from './SiteFooter'
import { WhatsAppFloat } from './WhatsAppFloat'
import { CartDrawer } from './CartDrawer'
import { StorefrontProvider, type StorefrontContextType } from './StorefrontContext'
import { captureReferralFromUrl } from '@/lib/referral'
import type { Category, StorefrontContent } from '@/types'

const DEFAULT_CONTENT: StorefrontContent = {
  phone: '+91 98765 43210',
  footerHeading: 'Ready For Your Bespoke Formulation?',
  footerText: 'Speak with our concierge and begin a skincare ritual designed entirely around you.',
  marqueeLines: [],
  whatsappNumber: '',
}

export function StorefrontShell({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<StorefrontContent>(DEFAULT_CONTENT)
  const [categories, setCategories] = useState<Category[]>([])
  const { user } = useAuth()
  const [cartOpen, setCartOpen] = useState<boolean>(false)

  useEffect(() => {
    captureReferralFromUrl()
    document.documentElement.setAttribute('data-theme', 'dark')
    document.documentElement.classList.add('storefront-chrome')
    return () => {
      document.documentElement.classList.remove('storefront-chrome')
      try {
        const t = localStorage.getItem('dermatics-theme')
        document.documentElement.setAttribute('data-theme', t === 'dark' ? 'dark' : 'light')
      } catch {
        document.documentElement.setAttribute('data-theme', 'light')
      }
    }
  }, [])

  useEffect(() => {
    apiFetch('/api/content').then((r) => r.json()).then((d) => {
      if (d && d.key) setContent((c) => ({ ...c, ...d }))
    }).catch(() => {})
    apiFetch('/api/categories').then((r) => r.json()).then((d) => {
      if (Array.isArray(d)) setCategories(d)
    }).catch(() => {})
  }, [])

  const value = useMemo<StorefrontContextType>(
    () => ({ content, categories, user, cartOpen, setCartOpen }),
    [content, categories, user, cartOpen],
  )

  return (
    <StorefrontProvider value={value}>
      <div className="storefront-root">
        <div className="ambient-glow" />
        <AnnouncementMarquee />
        <SiteHeader />
        <main className="storefront-main">{children}</main>
        <SiteFooter />
        <WhatsAppFloat />
        <CartDrawer />
      </div>
    </StorefrontProvider>
  )
}
