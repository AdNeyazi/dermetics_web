import { apiFetch } from '@/lib/api'

function getSid(): string | null {
  if (typeof window === 'undefined') return null
  let sid = localStorage.getItem('dermatics_sid')
  if (!sid) {
    sid = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`
    localStorage.setItem('dermatics_sid', sid)
  }
  return sid
}

export function trackEvent(event_type: string, metadata: Record<string, any> = {}, page?: string): void {
  if (typeof window === 'undefined') return
  const path = page || window.location.pathname
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
    })
  } catch {
    /* ignore */
  }
}
