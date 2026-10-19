import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ThemeToggle } from '@/components/ThemeToggle'

interface AppHeaderProps {
  showBrand?: boolean
  brandHref?: string
  leftSlot?: ReactNode
  brandSuffix?: string | null
}

export function AppHeader({
  showBrand = true,
  brandHref = '/',
  leftSlot = null,
  brandSuffix = null,
}: AppHeaderProps) {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-start">
          {leftSlot}
          {showBrand ? (
            <>
              <Link to={brandHref} className="brand gold-text" style={{ textDecoration: 'none' }}>
                DERMATICS
              </Link>
              {brandSuffix ? <span className="header-brand-suffix">{brandSuffix}</span> : null}
            </>
          ) : (
            !leftSlot ? <span /> : null
          )}
        </div>
        <ThemeToggle />
      </div>
    </header>
  )
}
