import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals'
import { trackWebVital, trackException } from './gtag'

let initialized = false

function report(metric: Metric): void {
  trackWebVital({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
  })
}

/**
 * Initializes Core Web Vitals reporting (via the web-vitals library) and error tracking
 */
export function initPerformanceMonitoring(): void {
  if (typeof window === 'undefined' || initialized) return
  initialized = true

  onCLS(report)
  onFCP(report)
  onINP(report)
  onLCP(report)
  onTTFB(report)

  // Global Uncaught Exception Monitoring
  window.addEventListener('error', (event) => {
    const message = event.message || 'Unknown runtime error'
    const source = event.filename ? ` at ${event.filename}:${event.lineno}` : ''
    trackException({
      description: `${message}${source}`,
      fatal: false,
    })
  })

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason instanceof Error ? event.reason.message : String(event.reason || 'Unhandled Promise Rejection')
    trackException({
      description: `UnhandledRejection: ${reason}`,
      fatal: false,
    })
  })
}
