import { useState } from 'react'
import { Link } from 'react-router-dom'
import { GA_MEASUREMENT_ID, readConsent, setAnalyticsConsent, type ConsentChoice } from '@/lib/gtag'

/**
 * Asks once for analytics cookie consent and feeds the choice into GA4 Consent Mode.
 * Hidden when GA is not configured or the visitor has already chosen.
 */
export function CookieConsentBanner() {
  const [visible, setVisible] = useState(() => Boolean(GA_MEASUREMENT_ID) && readConsent() === null)

  if (!visible) return null

  const choose = (choice: ConsentChoice) => {
    setAnalyticsConsent(choice)
    setVisible(false)
  }

  return (
    <div className="cookie-banner" role="dialog" aria-live="polite" aria-label="Cookie consent">
      <p>
        We use cookies to understand how our store is used and to improve your experience.{' '}
        <Link to="/privacy">Privacy policy</Link>
      </p>
      <div className="cookie-banner-actions">
        <button type="button" className="btn-pill" onClick={() => choose('denied')}>Decline</button>
        <button type="button" className="btn-pill solid" onClick={() => choose('granted')}>Accept</button>
      </div>
    </div>
  )
}

export default CookieConsentBanner
