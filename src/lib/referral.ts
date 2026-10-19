const REF_KEY = 'dermetics_ref'

export function captureReferralFromUrl(): void {
  if (typeof window === 'undefined') return
  try {
    const ref = new URLSearchParams(window.location.search).get('ref')
    if (ref) localStorage.setItem(REF_KEY, ref.trim().slice(0, 64))
  } catch {
    /* ignore */
  }
}

export function getReferralCode(): string {
  if (typeof window === 'undefined') return ''
  try {
    return localStorage.getItem(REF_KEY) || ''
  } catch {
    return ''
  }
}

export function withReferral(url: string): string {
  const ref = getReferralCode()
  if (!ref) return url
  try {
    const u = new URL(url, window.location.origin)
    u.searchParams.set('ref', ref)
    return u.toString()
  } catch {
    return url
  }
}
