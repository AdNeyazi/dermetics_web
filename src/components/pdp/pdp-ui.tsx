import { useEffect, useRef, useState, type CSSProperties } from 'react'

export function Stars({ value, size = 16 }: { value: number | string; size?: number }) {
  const v = Math.max(0, Math.min(5, Number(value) || 0))
  return (
    <span className="pdp-stars" style={{ '--star-size': `${size}px` } as CSSProperties} aria-hidden="true">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= Math.round(v) ? 'on' : ''}>★</span>
      ))}
    </span>
  )
}

interface ResponsiveBannerProps {
  desktopImage?: string
  mobileImage?: string
  alt?: string
  className?: string
}

export function ResponsiveBanner({ desktopImage, mobileImage, alt, className = '' }: ResponsiveBannerProps) {
  if (!desktopImage && !mobileImage) return null
  return (
    <picture className={className}>
      {mobileImage ? <source media="(max-width: 600px)" srcSet={mobileImage} /> : null}
      <img src={desktopImage || mobileImage} alt={alt || ''} className="pdp-banner-img" loading="lazy" />
    </picture>
  )
}

interface CountUpStatProps {
  value: number | string
  suffix?: string
  label?: string
}

export function CountUpStat({ value, suffix, label }: CountUpStatProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [display, setDisplay] = useState(0)
  const target = parseFloat(String(value).replace(/[^0-9.]/g, '')) || 0

  useEffect(() => {
    const el = ref.current
    if (!el || target <= 0) return undefined
    let started = false
    const obs = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || started) return
      started = true
      const start = performance.now()
      const duration = 1400
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration)
        const eased = 1 - (1 - t) ** 3
        setDisplay(Math.round(target * eased))
        if (t < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, { threshold: 0.35 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [target])

  if (!label) return null

  return (
    <div className="pdp-stat" ref={ref}>
      <div className="pdp-stat-value gold-text">
        {target > 0 ? display : '—'}{suffix || ''}
      </div>
      <div className="pdp-stat-label">{label}</div>
    </div>
  )
}
