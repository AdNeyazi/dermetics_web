import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { initGA, trackPageView, setGAUser } from '@/lib/gtag'
import { initPerformanceMonitoring } from '@/lib/webVitals'
import { useAuth } from '@/context/AuthContext'

/**
 * GoogleAnalyticsTracker listens to React Router navigation changes and dispatches
 * GA4 page views, sets user ID upon authentication, and initializes Core Web Vitals monitoring.
 */
export function GoogleAnalyticsTracker() {
  const location = useLocation()
  const { user } = useAuth()
  const prevPathRef = useRef<string>('')

  // Initialize GA and Performance Monitoring once
  useEffect(() => {
    initGA()
    initPerformanceMonitoring()
  }, [])

  // Sync authenticated user with GA4 user ID
  useEffect(() => {
    if (user?.id) {
      setGAUser(user.id, {
        user_role: user.role || 'user',
      })
    } else {
      setGAUser(null)
    }
  }, [user])

  // Track SPA route transitions
  useEffect(() => {
    const fullPath = location.pathname + location.search + location.hash
    // Avoid duplicate page view on the identical path
    if (fullPath === prevPathRef.current) return

    const prevPath = prevPathRef.current
    prevPathRef.current = fullPath

    // Small delay allows page document.title changes to apply (e.g. from ProductDetailPage)
    const timer = setTimeout(() => {
      trackPageView(fullPath, document.title, prevPath ? `${window.location.origin}${prevPath}` : undefined)
    }, 100)

    return () => clearTimeout(timer)
  }, [location])

  return null
}

export default GoogleAnalyticsTracker
