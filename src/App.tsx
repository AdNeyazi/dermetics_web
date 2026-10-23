import { BrowserRouter, Routes, Route, Outlet, Link } from 'react-router-dom'
import { ThemeProvider } from '@/components/ThemeProvider'
import { AuthProvider } from '@/context/AuthContext'
import { ProtectedRoute, PublicOnlyRoute } from '@/components/ProtectedRoute'
import { StorefrontShell } from '@/components/storefront/StorefrontShell'

// Storefront pages
import HomePage from '@/pages/HomePage'
import ProductsPage from '@/pages/ProductsPage'
import ProductDetailPage from '@/pages/ProductDetailPage'
import CheckoutPage from '@/pages/CheckoutPage'
import OrdersPage from '@/pages/OrdersPage'
import WishlistPage from '@/pages/WishlistPage'

// Auth pages
import LoginPage from '@/pages/LoginPage'
import SignupPage from '@/pages/SignupPage'

import { GoogleAnalyticsTracker } from '@/components/analytics/GoogleAnalyticsTracker'
import { CookieConsentBanner } from '@/components/analytics/CookieConsentBanner'

// Admin dashboard
import DashboardPage from '@/pages/DashboardPage'

function StorefrontLayout() {
  return (
    <StorefrontShell>
      <Outlet />
    </StorefrontShell>
  )
}

function NotFoundPage() {
  return (
    <div className="container" style={{ padding: '120px 24px', textAlign: 'center' }}>
      <h1 className="gold-text" style={{ fontSize: 48, marginBottom: 16 }}>404</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: 16 }}>
        The page you are looking for does not exist.
      </p>
      <Link to="/" className="btn-pill solid">
        Return to Home
      </Link>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <GoogleAnalyticsTracker />
          <CookieConsentBanner />
          <Routes>
            {/* Storefront Layout */}
            <Route element={<StorefrontLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/products/:slug" element={<ProductDetailPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/wishlist" element={<WishlistPage />} />
              <Route
                path="/account/orders"
                element={(
                  <ProtectedRoute>
                    <OrdersPage />
                  </ProtectedRoute>
                )}
              />
              <Route path="*" element={<NotFoundPage />} />
            </Route>

            {/* Auth Routes */}
            <Route
              path="/login"
              element={(
                <PublicOnlyRoute>
                  <LoginPage />
                </PublicOnlyRoute>
              )}
            />
            <Route
              path="/signup"
              element={(
                <PublicOnlyRoute>
                  <SignupPage />
                </PublicOnlyRoute>
              )}
            />

            {/* Admin Dashboard */}
            <Route
              path="/dashboard/*"
              element={(
                <ProtectedRoute requiredRole="admin">
                  <DashboardPage />
                </ProtectedRoute>
              )}
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
