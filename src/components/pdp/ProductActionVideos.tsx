import { useState } from 'react'
import { trackEvent } from '@/lib/track'

interface VideoItem {
  url: string
  thumb?: string
  title?: string
}

interface ProductActionVideosProps {
  videos?: VideoItem[]
  slug: string
  placement?: 'buyBox' | 'section'
}

export function ProductActionVideos({ videos, slug, placement = 'buyBox' }: ProductActionVideosProps) {
  const list = (videos || []).filter((v) => v?.url).slice(0, 3)
  if (!list.length) return null

  const [open, setOpen] = useState<boolean>(placement === 'section')

  const grid = (
    <div className={`pdp-action-videos ${placement === 'buyBox' ? 'pdp-action-videos--buy' : ''}`}>
      {list.map((v, i) => (
        <div key={v.url + i} className="pdp-action-video">
          <video
            src={v.url}
            controls
            playsInline
            preload="metadata"
            poster={v.thumb || undefined}
            onPlay={() => trackEvent('pdp_video_play', { slug, index: i, placement })}
          />
          {v.title ? <p>{v.title}</p> : null}
        </div>
      ))}
    </div>
  )

  if (placement === 'section') {
    return (
      <section className="container pdp-section" id="product-action-videos">
        <h2 className="gold-text pdp-section-title">Watch our product in action</h2>
        {grid}
      </section>
    )
  }

  return (
    <div className="pdp-action-videos-block" id="product-action-videos">
      <button
        type="button"
        className={`pdp-action-videos-toggle ${open ? 'open' : ''}`}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span>Watch our product in action</span>
        <span className="pdp-action-videos-chevron" aria-hidden="true">{open ? '−' : '+'}</span>
      </button>
      {open ? grid : null}
    </div>
  )
}
