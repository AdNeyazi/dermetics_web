import { useStorefront } from './StorefrontContext'

const FALLBACK: string[] = ['Welcome to DERMATICS', 'Your skin, your formulation', 'Haute couture dermatology']

export function AnnouncementMarquee() {
  const { content } = useStorefront() || {}
  const lines = (content?.marqueeLines?.length ? content.marqueeLines : FALLBACK).filter(Boolean)
  if (lines.length === 0) return null

  const track = [...lines, ...lines, ...lines].join('   ·   ')

  return (
    <div className="announcement-marquee" aria-hidden="true">
      <div className="announcement-marquee-track">
        <span>{track}</span>
        <span>{track}</span>
      </div>
    </div>
  )
}
