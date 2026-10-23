import { apiFetch } from '@/lib/api'
import { trackGAEvent } from './gtag'

// Events that already have a dedicated GA4 call (with items/value) at the call site; forwarding them would double-count
const GA_SKIP_EVENTS = new Set(['add_to_cart', 'share', 'checkout_complete', 'pdp_review_submitted'])
// Metadata kept in the internal DB only, never sent to GA
const GA_PRIVATE_KEYS = ['pincode']

export function getSid(): string | null {
  if (typeof window === 'undefined') return null
  let sid = localStorage.getItem('dermatics_sid')
  if (!sid) {
    sid = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    localStorage.setItem('dermatics_sid', sid)
  }
  return sid
}

export function trackEvent(
  event_type: string,
  metadata: Record<string, unknown> = {},
  page?: string,
): void {
  if (typeof window === 'undefined') return
  const path = page || window.location.pathname

  // 1. Send to internal Rails API analytics database
  try {
    apiFetch('/api/analytics/event', {
      method: 'POST',
      body: JSON.stringify({
        event_type,
        page: path,
        metadata,
        session_id: getSid(),
        referrer: document.referrer || '',
        device: navigator.userAgent || '',
      }),
    }).catch(() => {
      /* ignore background network errors */
    })
  } catch {
    /* ignore */
  }

  // 2. Forward to Google Analytics 4
  if (GA_SKIP_EVENTS.has(event_type)) return
  try {
    const gaParams: Record<string, unknown> = { page: path, ...metadata }
    GA_PRIVATE_KEYS.forEach((k) => delete gaParams[k])
    trackGAEvent(event_type, gaParams)
  } catch {
    /* ignore */
  }
}
