import { useState } from 'react'
import { useStorefront } from '@/components/storefront/StorefrontContext'
import { CountUpStat, ResponsiveBanner } from './pdp-ui'
import { ProductReviewsSection } from './ProductReviewsSection'
import { PdpRelated } from './PdpRelated'
import { trackEvent } from '@/lib/track'
import type { Product } from '@/types'

function StatsRow({ stats }: { stats?: any[] }) {
  const list = (stats || []).filter((s) => s?.label && String(s.value).replace(/[^0-9.]/g, ''))
  if (!list.length) return null
  return (
    <section className="pdp-stats-band">
      <div className="container pdp-stats-grid">
        {list.map((s, i) => (
          <CountUpStat key={s.label + i} value={s.value} suffix={s.suffix} label={s.label} />
        ))}
      </div>
    </section>
  )
}

function HeroBenefit({ hero }: { hero?: any }) {
  if (!hero?.headline && !hero?.desktopImage) return null
  return (
    <section className="container pdp-section">
      {hero.sectionHeading ? <p className="pdp-eyebrow">{hero.sectionHeading}</p> : null}
      <div className="pdp-hero-benefit">
        <div className="pdp-hero-benefit-copy glass-panel">
          {hero.headline ? <h2 className="gold-text">{hero.headline}</h2> : null}
          <ul>
            {(hero.lines || []).filter(Boolean).map((line: string) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
        <ResponsiveBanner desktopImage={hero.desktopImage} mobileImage={hero.mobileImage} alt={hero.headline} />
      </div>
    </section>
  )
}

function StoryBlock({ story, slug }: { story?: any; slug: string }) {
  const [open, setOpen] = useState(false)
  if (!story?.title && !story?.body) return null
  return (
    <section className="container pdp-section">
      <div className="pdp-story-card">
        {story.image ? <img src={story.image} alt="" className="pdp-story-img" loading="lazy" /> : null}
        <div>
          <h3 className="gold-text">{story.title || 'Story behind the formula'}</h3>
          <p className="pdp-story-teaser">{(story.body || '').split('\n')[0]?.slice(0, 160)}…</p>
          <button
            type="button"
            className="btn-pill"
            onClick={() => {
              setOpen(true)
              trackEvent('pdp_story_open', { slug })
            }}
          >
            Read story
          </button>
        </div>
      </div>
      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal pdp-story-modal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="modal-close" onClick={() => setOpen(false)}>&times;</button>
            <h3 className="gold-text">{story.title}</h3>
            <div className="pdp-story-body">
              {(story.body || story.richText || '').split('\n').map((para: string, i: number) => (
                para ? <p key={i}>{para}</p> : null
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

function BlendMarquee({ blend }: { blend?: any }) {
  const title = blend?.title
  const descriptors = (blend?.descriptors || []).filter(Boolean)
  if (!title && !descriptors.length) return null
  const text = [title, ...descriptors, title, ...descriptors].filter(Boolean).join('   ·   ')
  return (
    <section className="pdp-blend-marquee" aria-hidden="true">
      <div className="pdp-blend-track"><span>{text}</span><span>{text}</span></div>
    </section>
  )
}

function BenefitBanners({ banners }: { banners?: any[] }) {
  const list = [...(banners || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  if (!list.length) return null
  return (
    <section className="pdp-benefit-banners">
      {list.map((b, i) => (
        <ResponsiveBanner
          key={(b.desktopImage || '') + i}
          desktopImage={b.desktopImage}
          mobileImage={b.mobileImage}
          alt={b.alt}
          className="pdp-benefit-banner"
        />
      ))}
    </section>
  )
}

function Ingredients({ ingredients, inciText, slug }: { ingredients?: any[]; inciText?: string; slug: string }) {
  const [inciOpen, setInciOpen] = useState(false)
  const list = (ingredients || []).filter((s) => s?.name)
  if (!list.length && !inciText) return null
  return (
    <section className="container pdp-section">
      <h2 className="gold-text pdp-section-title">Key ingredients</h2>
      <div className="pdp-ingredients-grid">
        {list.map((ing) => (
          <article key={ing.name} className="pdp-ingredient-card">
            {ing.imageUrl ? <img src={ing.imageUrl} alt={ing.name} loading="lazy" /> : <div className="pdp-ingredient-ph" />}
            <h4>{ing.name}</h4>
            {ing.role ? <p className="pdp-ingredient-role"><strong>Role:</strong> {ing.role}</p> : null}
            {ing.description ? <p>{ing.description}</p> : null}
            {ing.researchUrl ? (
              <a href={ing.researchUrl} target="_blank" rel="noopener noreferrer">View research</a>
            ) : null}
          </article>
        ))}
      </div>
      {inciText ? (
        <>
          <button
            type="button"
            className="pdp-view-all-ing"
            onClick={() => {
              setInciOpen(true)
              trackEvent('pdp_ingredient_modal_open', { slug })
            }}
          >
            VIEW ALL INGREDIENTS →
          </button>
          {inciOpen && (
            <div className="modal-overlay" onClick={() => setInciOpen(false)}>
              <div className="modal pdp-inci-modal" onClick={(e) => e.stopPropagation()}>
                <button type="button" className="modal-close" onClick={() => setInciOpen(false)}>&times;</button>
                <h3 className="gold-text">Full INCI list</h3>
                <pre className="pdp-inci-text">{inciText}</pre>
              </div>
            </div>
          )}
        </>
      ) : null}
    </section>
  )
}

function InfoTabs({ tabs }: { tabs?: any }) {
  const items = [
    { key: 'overview', label: 'Formulation Overview', body: tabs?.overview },
    { key: 'application', label: 'Application Protocol', body: tabs?.applicationProtocol },
    { key: 'more', label: 'More Details', body: tabs?.moreDetails },
  ].filter((t) => t.body)
  const [active, setActive] = useState<string | undefined>(items[0]?.key)
  if (!items.length) return null
  const current = items.find((t) => t.key === active) || items[0]
  return (
    <section className="container pdp-section">
      <h2 className="gold-text pdp-section-title">Know your product</h2>
      <div className="pdp-tabs">
        <div className="pdp-tab-list" role="tablist">
          {items.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={active === t.key}
              className={active === t.key ? 'active' : ''}
              onClick={() => setActive(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="pdp-tab-panel glass-panel" role="tabpanel">
          {current.body.split('\n').map((line: string, i: number) => (line ? <p key={i}>{line}</p> : null))}
        </div>
      </div>
    </section>
  )
}

function FaqSection({ faqs, slug }: { faqs?: any[]; slug: string }) {
  const list = [...(faqs || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).filter((f) => f.question)
  const [open, setOpen] = useState<number | null>(list.length ? 0 : null)
  if (!list.length) return null
  return (
    <section className="container pdp-section" id="faq">
      <h2 className="gold-text pdp-section-title">FAQ</h2>
      <div className="faq-wrap pdp-faq">
        {list.map((f, i) => (
          <div key={f.question} className={`faq-item ${open === i ? 'open' : ''}`}>
            <button
              type="button"
              className="faq-q"
              onClick={() => {
                setOpen(open === i ? null : i)
                trackEvent('pdp_faq_open', { slug, question: f.question })
              }}
            >
              <span>{f.question}</span>
              <span className="faq-icon">{open === i ? '−' : '+'}</span>
            </button>
            <div className="faq-a" style={{ maxHeight: open === i ? '400px' : '0px' }}>
              <div className="faq-a-inner">{f.answer}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function BrandTrust() {
  const { content } = useStorefront() || {}
  const headline = content?.brandTrust?.headline
  const promise = content?.brandTrust?.promise
  if (!headline && !promise) return null
  return (
    <section className="pdp-brand-trust">
      <div className="container">
        {headline ? <h2 className="gold-text">{headline}</h2> : null}
        {promise ? <p>{promise}</p> : null}
      </div>
    </section>
  )
}

export function PdpBelowFold({ product }: { product: Product }) {
  const pdp = product.pdp || {}
  const hero = pdp.heroBanner || {}

  return (
    <>
      <StatsRow stats={pdp.stats} />
      {hero.sectionHeading && (hero.desktopImage || hero.mobileImage) ? (
        <section className="container pdp-section">
          <h2 className="gold-text pdp-section-title">{hero.sectionHeading}</h2>
          <ResponsiveBanner desktopImage={hero.desktopImage} mobileImage={hero.mobileImage} alt={hero.sectionHeading} />
        </section>
      ) : null}
      <HeroBenefit hero={hero} />
      <StoryBlock story={pdp.story} slug={product.slug} />
      <BlendMarquee blend={pdp.blendMarquee} />
      <BenefitBanners banners={pdp.benefitBanners} />
      <Ingredients ingredients={pdp.ingredients} inciText={pdp.inciText} slug={product.slug} />
      <InfoTabs tabs={pdp.infoTabs} />
      <FaqSection faqs={pdp.faqs} slug={product.slug} />
      <ProductReviewsSection product={product} />
      <PdpRelated product={product} />
      <BrandTrust />
    </>
  )
}
