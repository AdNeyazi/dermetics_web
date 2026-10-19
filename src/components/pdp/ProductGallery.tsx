import { useCallback, useEffect, useMemo, useState } from 'react'
import { trackEvent } from '@/lib/track'
import type { Product } from '@/types'

interface MediaItem {
  type: string
  url: string
  order?: number
}

function buildMedia(product: Product): MediaItem[] {
  const pdp = product.pdp || {}
  if (Array.isArray(pdp.media) && pdp.media.length) {
    return [...pdp.media].sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
  }
  const out: MediaItem[] = []
  if (product.imageUrl) out.push({ type: 'image', url: product.imageUrl, order: 0 })
  ;(pdp.gallery || []).forEach((url: string, i: number) => {
    if (url) out.push({ type: 'image', url, order: i + 1 })
  })
  return out
}

interface ProductGalleryProps {
  product: Product
  variantImageUrl?: string
}

export function ProductGallery({ product, variantImageUrl }: ProductGalleryProps) {
  const media = useMemo(() => buildMedia(product), [product])
  const [active, setActive] = useState<number>(0)
  const [lightbox, setLightbox] = useState<boolean>(false)
  const [touchX, setTouchX] = useState<number | null>(null)

  const items = media.length ? media : [{ type: 'image', url: product.imageUrl || '', order: 0 }]
  const current = items[active] || items[0]
  const mainUrl = variantImageUrl || current?.url || product.imageUrl

  const go = useCallback((dir: number) => {
    setActive((i) => {
      const next = (i + dir + items.length) % items.length
      trackEvent('pdp_gallery', { action: dir > 0 ? 'next' : 'prev', index: next, slug: product.slug })
      return next
    })
  }, [items.length, product.slug])

  useEffect(() => {
    if (!lightbox) return undefined
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(false)
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [lightbox, go])

  const openLightbox = () => {
    trackEvent('pdp_gallery', { action: 'lightbox_open', slug: product.slug })
    setLightbox(true)
  }

  const onTouchStart = (e: React.TouchEvent) => setTouchX(e.touches[0].clientX)
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX == null) return
    const dx = e.changedTouches[0].clientX - touchX
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1)
    setTouchX(null)
  }

  const badge = product.pdp?.highlightBadge || product.pdp?.badge

  return (
    <div className="pdp-gallery">
      {badge ? <span className="pdp-highlight-badge">{badge}</span> : null}
      <div className="pdp-gallery-layout">
        <div className="pdp-thumbs" role="tablist" aria-label="Product media">
          {items.map((m, i) => (
            <button
              key={`${m.url}-${i}`}
              type="button"
              role="tab"
              aria-selected={active === i}
              className={`pdp-thumb ${active === i ? 'active' : ''}`}
              onClick={() => {
                setActive(i)
                trackEvent('pdp_gallery', { action: 'thumb', index: i, slug: product.slug })
              }}
            >
              {m.type === 'video' ? (
                <>
                  <video src={m.url} muted playsInline preload="metadata" />
                  <span className="pdp-thumb-play" aria-hidden="true">▶</span>
                </>
              ) : (
                <img src={m.url} alt="" />
              )}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="pdp-main-viewer"
          onClick={openLightbox}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          aria-label="Open gallery"
        >
          {current?.type === 'video' && !variantImageUrl ? (
            <video src={current.url} controls className="pdp-main-media" />
          ) : (
            <img src={mainUrl} alt={product.name} className="pdp-main-media" />
          )}
        </button>
      </div>

      {lightbox && (
        <div className="pdp-lightbox" role="dialog" aria-modal="true" aria-label="Product gallery">
          <button type="button" className="pdp-lightbox-close icon-btn" onClick={() => setLightbox(false)} aria-label="Close">&times;</button>
          <button type="button" className="pdp-lightbox-nav prev" onClick={() => go(-1)} aria-label="Previous">‹</button>
          <div
            className="pdp-lightbox-stage"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            {current?.type === 'video' ? (
              <video src={current.url} controls autoPlay className="pdp-lightbox-media" />
            ) : (
              <img src={mainUrl} alt={product.name} className="pdp-lightbox-media" />
            )}
          </div>
          <button type="button" className="pdp-lightbox-nav next" onClick={() => go(1)} aria-label="Next">›</button>
        </div>
      )}
    </div>
  )
}
