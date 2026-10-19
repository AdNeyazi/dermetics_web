import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useStorefront } from './StorefrontContext'

const OFFICIAL_LINKS = [
  { href: '/#faq', label: 'FAQs' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/shipping', label: 'Shipping & Returns' },
  { href: '/terms', label: 'Terms' },
  { href: '/guarantee', label: 'Guarantee' },
]

export function SiteFooter() {
  const { content, categories } = useStorefront() || {}
  const [email, setEmail] = useState<string>('')
  const [joined, setJoined] = useState<boolean>(false)

  const shopLinks = [
    { href: '/products', label: 'All products' },
    ...(categories?.length ? categories : [
      { key: 'premium', label: 'Premium' },
      { key: 'ultra', label: 'Ultra Premium' },
    ]).filter((c) => c.key !== 'super').map((c) => ({ href: `/products#${c.key}`, label: c.label })),
    { href: '/#super', label: 'Bespoke' },
  ]

  const tel = 'tel:' + (content?.phone || '').replace(/\s+/g, '')

  const onNewsletter = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setJoined(true)
    setEmail('')
  }

  return (
    <footer className="site-footer">
      <div className="container site-footer-inner">
        <div className="site-footer-newsletter">
          <h3 className="gold-text">Join the circle</h3>
          <p>Early access to launches, formulation notes and ritual guidance.</p>
          {joined ? (
            <p className="site-footer-thanks">Thank you — you&apos;re on the list.</p>
          ) : (
            <form className="newsletter-form" onSubmit={onNewsletter}>
              <input
                type="email"
                required
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-label="Email for newsletter"
              />
              <button type="submit" className="btn-pill solid">Subscribe</button>
            </form>
          )}
        </div>

        <div className="site-footer-columns">
          <div>
            <h4>Navigate</h4>
            <ul>
              {shopLinks.map((l) => (
                <li key={l.href}><Link to={l.href}>{l.label}</Link></li>
              ))}
              <li><Link to="/#our-story">Our Story</Link></li>
              <li><Link to="/#the-lab">The Lab</Link></li>
            </ul>
          </div>
          <div>
            <h4>Official</h4>
            <ul>
              {OFFICIAL_LINKS.map((l) => (
                <li key={l.href}><Link to={l.href}>{l.label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4>Support</h4>
            <ul>
              {content?.phone ? (
                <li><a href={tel}>{content.phone}</a></li>
              ) : null}
              <li><Link to="/login">Login</Link></li>
            </ul>
          </div>
        </div>

        {(content?.footerHeading || content?.footerText) && (
          <div className="site-footer-cta">
            {content.footerHeading ? <h2 className="gold-text">{content.footerHeading}</h2> : null}
            {content.footerText ? <p>{content.footerText}</p> : null}
            {content.phone ? (
              <a className="btn-pill solid" href={tel}>Book consultation</a>
            ) : null}
          </div>
        )}

        <div className="site-footer-bottom">
          <p className="copyright">&copy; {new Date().getFullYear()} DERMATICS. All rights reserved.</p>
          <div className="site-footer-social" aria-label="Social links">
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">IG</a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">IN</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
