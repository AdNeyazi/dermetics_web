/**
 * Google Analytics 4 (GA4) Integration for DERMATICS
 * Supports:
 * - SPA Route / Page View Tracking with Traffic Source Attribution (UTM tags, Referrer)
 * - Standard GA4 E-commerce Events (view_item_list, select_item, view_item, add_to_cart, remove_from_cart, view_cart, begin_checkout, purchase)
 * - User Behavior & Engagement (login, sign_up, search, lead generation, share, wishlist)
 * - App Performance & Core Web Vitals (LCP, CLS, INP/FID, FCP, TTFB, Exceptions, API latency)
 */

export interface GAItem {
  item_id: string | number
  item_name: string
  price?: number
  quantity?: number
  item_brand?: string
  item_category?: string
  item_variant?: string
  index?: number
}

export interface TrafficSource {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_term?: string
  utm_content?: string
  gclid?: string
  fbclid?: string
  referrer?: string
}

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

export const GA_MEASUREMENT_ID = (import.meta.env.VITE_GA_MEASUREMENT_ID || '').trim()

export function isGAEnabled(): boolean {
  return typeof window !== 'undefined' && Boolean(GA_MEASUREMENT_ID)
}

const TRAFFIC_STORAGE_KEY = 'dermatics_traffic_source'
const CONSENT_STORAGE_KEY = 'dermatics_analytics_consent'

export type ConsentChoice = 'granted' | 'denied'

export function readConsent(): ConsentChoice | null {
  if (typeof window === 'undefined') return null
  try {
    const v = localStorage.getItem(CONSENT_STORAGE_KEY)
    return v === 'granted' || v === 'denied' ? v : null
  } catch {
    return null
  }
}

function consentState(choice: ConsentChoice) {
  return {
    analytics_storage: choice,
    ad_storage: choice,
    ad_user_data: choice,
    ad_personalization: choice,
  }
}

/**
 * Persists the visitor's cookie choice and updates GA4 Consent Mode
 */
export function setAnalyticsConsent(choice: ConsentChoice): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, choice)
  } catch {
    /* ignore */
  }
  window.gtag?.('consent', 'update', consentState(choice))
}

/**
 * Extracts and persists initial landing traffic source & campaign parameters
 */
export function captureTrafficSource(): TrafficSource {
  if (typeof window === 'undefined') return {}

  try {
    const existing = sessionStorage.getItem(TRAFFIC_STORAGE_KEY)
    if (existing) {
      return JSON.parse(existing) as TrafficSource
    }

    const params = new URLSearchParams(window.location.search)
    const source: TrafficSource = {}

    const utmSource = params.get('utm_source')
    const utmMedium = params.get('utm_medium')
    const utmCampaign = params.get('utm_campaign')
    const utmTerm = params.get('utm_term')
    const utmContent = params.get('utm_content')
    const gclid = params.get('gclid')
    const fbclid = params.get('fbclid')

    if (utmSource) source.utm_source = utmSource
    if (utmMedium) source.utm_medium = utmMedium
    if (utmCampaign) source.utm_campaign = utmCampaign
    if (utmTerm) source.utm_term = utmTerm
    if (utmContent) source.utm_content = utmContent
    if (gclid) source.gclid = gclid
    if (fbclid) source.fbclid = fbclid
    if (document.referrer) source.referrer = document.referrer

    if (Object.keys(source).length > 0) {
      sessionStorage.setItem(TRAFFIC_STORAGE_KEY, JSON.stringify(source))
    }
    return source
  } catch {
    return {}
  }
}

/**
 * Initializes GA4 script and dataLayer
 */
export function initGA(): void {
  if (typeof window === 'undefined') return

  window.dataLayer = window.dataLayer || []
  if (!window.gtag) {
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer?.push(arguments)
    }
  }

  // Capture initial campaign attribution immediately
  const traffic = captureTrafficSource()

  if (GA_MEASUREMENT_ID) {
    if (!document.getElementById('ga4-script')) {
      // Consent Mode v2: storage stays denied until the visitor accepts the cookie banner
      window.gtag('consent', 'default', consentState(readConsent() || 'denied'))

      const script = document.createElement('script')
      script.id = 'ga4-script'
      script.async = true
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_MEASUREMENT_ID)}`
      document.head.appendChild(script)

      window.gtag('js', new Date())
      // Disable default page view to avoid double-counting on SPA route navigation
      window.gtag('config', GA_MEASUREMENT_ID, {
        send_page_view: false,
        campaign: traffic.utm_campaign ? {
          source: traffic.utm_source,
          medium: traffic.utm_medium,
          name: traffic.utm_campaign,
          term: traffic.utm_term,
          content: traffic.utm_content,
        } : undefined,
      })
    }
  } else if (import.meta.env.DEV) {
    console.info('[GA4] VITE_GA_MEASUREMENT_ID is not set. Events will be logged to console in dev mode.')
  }
}

/**
 * Dispatches an event to GA4 or logs in dev
 */
export function trackGAEvent(eventName: string, params: Record<string, unknown> = {}): void {
  if (typeof window === 'undefined') return

  if (isGAEnabled() && window.gtag) {
    window.gtag('event', eventName, params)
  } else if (import.meta.env.DEV) {
    console.debug(`[GA4 Event: ${eventName}]`, params)
  }
}

/**
 * Tracks SPA Page View with full location, title, and traffic source attribution
 */
export function trackPageView(path: string, title?: string, referrer?: string): void {
  if (typeof window === 'undefined') return

  const pageTitle = title || document.title || 'DERMATICS'
  const pageLocation = window.location.href
  const traffic = captureTrafficSource()

  const payload: Record<string, unknown> = {
    page_path: path,
    page_title: pageTitle,
    page_location: pageLocation,
    page_referrer: referrer || document.referrer || '',
    ...traffic,
  }

  if (isGAEnabled() && window.gtag) {
    window.gtag('event', 'page_view', payload)
  } else if (import.meta.env.DEV) {
    console.debug('[GA4 PageView]', payload)
  }
}

/**
 * Associates user with GA4 sessions across devices
 */
export function setGAUser(userId: string | number | null, userProperties: Record<string, unknown> = {}): void {
  if (typeof window === 'undefined') return

  if (isGAEnabled() && window.gtag) {
    // Re-running config would send an extra page_view by default; page views are handled by trackPageView
    window.gtag('config', GA_MEASUREMENT_ID, {
      send_page_view: false,
      user_id: userId ? String(userId) : null,
    })
    window.gtag('set', 'user_properties', {
      user_status: userId ? 'logged_in' : 'guest',
      ...userProperties,
    })
  } else if (import.meta.env.DEV) {
    console.debug('[GA4 SetUser]', { userId, userProperties })
  }
}

/* =========================================================================
 * GA4 Standard E-Commerce Events
 * ========================================================================= */

export function trackViewItemList(params: { item_list_name?: string; items: GAItem[] }): void {
  trackGAEvent('view_item_list', {
    item_list_name: params.item_list_name || 'Catalog',
    items: params.items.map((it, idx) => ({
      index: idx + 1,
      item_id: String(it.item_id),
      item_name: it.item_name,
      price: it.price,
      item_category: it.item_category,
      item_brand: it.item_brand || 'DERMATICS',
    })),
  })
}

export function trackSelectItem(params: { item_list_name?: string; item: GAItem }): void {
  trackGAEvent('select_item', {
    item_list_name: params.item_list_name || 'Catalog',
    items: [{
      item_id: String(params.item.item_id),
      item_name: params.item.item_name,
      price: params.item.price,
      item_category: params.item.item_category,
      item_variant: params.item.item_variant,
      item_brand: params.item.item_brand || 'DERMATICS',
    }],
  })
}

export function trackViewItem(params: { item: GAItem; value?: number; currency?: string }): void {
  trackGAEvent('view_item', {
    currency: params.currency || 'INR',
    value: params.value ?? params.item.price ?? 0,
    items: [{
      item_id: String(params.item.item_id),
      item_name: params.item.item_name,
      price: params.item.price,
      item_category: params.item.item_category,
      item_variant: params.item.item_variant,
      item_brand: params.item.item_brand || 'DERMATICS',
    }],
  })
}

export function trackAddToCart(params: { item: GAItem; quantity?: number; value?: number; currency?: string }): void {
  const qty = params.quantity || params.item.quantity || 1
  const price = params.item.price || 0
  trackGAEvent('add_to_cart', {
    currency: params.currency || 'INR',
    value: params.value ?? price * qty,
    items: [{
      item_id: String(params.item.item_id),
      item_name: params.item.item_name,
      price: price,
      quantity: qty,
      item_variant: params.item.item_variant,
      item_category: params.item.item_category,
      item_brand: params.item.item_brand || 'DERMATICS',
    }],
  })
}

export function trackRemoveFromCart(params: { item: GAItem; quantity?: number; value?: number; currency?: string }): void {
  const qty = params.quantity || params.item.quantity || 1
  const price = params.item.price || 0
  trackGAEvent('remove_from_cart', {
    currency: params.currency || 'INR',
    value: params.value ?? price * qty,
    items: [{
      item_id: String(params.item.item_id),
      item_name: params.item.item_name,
      price: price,
      quantity: qty,
      item_variant: params.item.item_variant,
      item_category: params.item.item_category,
      item_brand: params.item.item_brand || 'DERMATICS',
    }],
  })
}

export function trackViewCart(params: { items: GAItem[]; value: number; currency?: string }): void {
  trackGAEvent('view_cart', {
    currency: params.currency || 'INR',
    value: params.value,
    items: params.items.map((it) => ({
      item_id: String(it.item_id),
      item_name: it.item_name,
      price: it.price,
      quantity: it.quantity || 1,
      item_variant: it.item_variant,
      item_category: it.item_category,
      item_brand: it.item_brand || 'DERMATICS',
    })),
  })
}

export function trackBeginCheckout(params: { items: GAItem[]; value: number; coupon?: string; currency?: string }): void {
  trackGAEvent('begin_checkout', {
    currency: params.currency || 'INR',
    value: params.value,
    coupon: params.coupon || undefined,
    items: params.items.map((it) => ({
      item_id: String(it.item_id),
      item_name: it.item_name,
      price: it.price,
      quantity: it.quantity || 1,
      item_variant: it.item_variant,
      item_category: it.item_category,
      item_brand: it.item_brand || 'DERMATICS',
    })),
  })
}

export function trackApplyCoupon(params: { coupon_code: string; discount?: number }): void {
  trackGAEvent('apply_coupon', {
    coupon: params.coupon_code,
    discount: params.discount,
  })
}

export function trackPurchase(params: {
  transaction_id: string
  value: number
  tax?: number
  shipping?: number
  currency?: string
  coupon?: string
  payment_type?: string
  items: GAItem[]
}): void {
  trackGAEvent('purchase', {
    transaction_id: params.transaction_id,
    value: params.value,
    tax: params.tax || 0,
    shipping: params.shipping || 0,
    currency: params.currency || 'INR',
    coupon: params.coupon || undefined,
    payment_type: params.payment_type || 'cod',
    items: params.items.map((it) => ({
      item_id: String(it.item_id),
      item_name: it.item_name,
      price: it.price,
      quantity: it.quantity || 1,
      item_variant: it.item_variant,
      item_category: it.item_category,
      item_brand: it.item_brand || 'DERMATICS',
    })),
  })
}

export function trackAddToWishlist(params: { item: GAItem }): void {
  trackGAEvent('add_to_wishlist', {
    currency: 'INR',
    value: params.item.price || 0,
    items: [{
      item_id: String(params.item.item_id),
      item_name: params.item.item_name,
      price: params.item.price,
      item_category: params.item.item_category,
      item_variant: params.item.item_variant,
      item_brand: params.item.item_brand || 'DERMATICS',
    }],
  })
}

/* =========================================================================
 * User Engagement & Lead Events
 * ========================================================================= */

export function trackSearch(params: { search_term: string; results_count?: number }): void {
  trackGAEvent('search', {
    search_term: params.search_term,
    results_count: params.results_count,
  })
}

export function trackAuth(params: { method: string; type: 'login' | 'sign_up' }): void {
  trackGAEvent(params.type, {
    method: params.method,
  })
}

export function trackLead(params: {
  lead_type: string
  value?: number
  currency?: string
  metadata?: Record<string, unknown>
}): void {
  trackGAEvent('generate_lead', {
    lead_type: params.lead_type,
    value: params.value,
    currency: params.currency || 'INR',
    ...params.metadata,
  })
}

export function trackShare(params: { method: string; content_type?: string; item_id?: string }): void {
  trackGAEvent('share', {
    method: params.method,
    content_type: params.content_type || 'product',
    item_id: params.item_id,
  })
}

export function trackReviewSubmitted(params: { product_slug: string; rating: number }): void {
  trackGAEvent('review_submitted', {
    product_slug: params.product_slug,
    rating: params.rating,
  })
}

/* =========================================================================
 * App Performance & Core Web Vitals
 * ========================================================================= */

export interface WebVitalMetric {
  name: 'LCP' | 'INP' | 'CLS' | 'FCP' | 'TTFB'
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta?: number
  id?: string
}

export function trackWebVital(metric: WebVitalMetric): void {
  // CLS is a unitless fraction (e.g. 0.08); scale by 1000 so rounding keeps its precision
  const scale = metric.name === 'CLS' ? 1000 : 1
  trackGAEvent('web_vitals', {
    metric_name: metric.name,
    metric_value: Math.round(metric.value * scale),
    metric_rating: metric.rating,
    metric_delta: metric.delta ? Math.round(metric.delta * scale) : undefined,
    metric_id: metric.id,
    non_interaction: true,
  })
}

export function trackException(params: { description: string; fatal?: boolean }): void {
  trackGAEvent('exception', {
    description: params.description.slice(0, 250),
    fatal: Boolean(params.fatal),
  })
}

export function trackApiPerformance(params: {
  endpoint: string
  duration_ms: number
  status: number
  ok: boolean
}): void {
  // Only track slow (>2500ms) or failed API requests to keep event volume focused
  if (params.duration_ms > 2500 || !params.ok) {
    trackGAEvent('api_performance', {
      endpoint: params.endpoint,
      duration_ms: Math.round(params.duration_ms),
      status: params.status,
      success: params.ok,
      non_interaction: true,
    })
  }
}
