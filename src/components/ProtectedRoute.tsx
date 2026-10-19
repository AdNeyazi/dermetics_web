import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

interface ProtectedRouteProps {
  children: ReactNode
  requiredRole?: string | null
}

export function ProtectedRoute({ children, requiredRole = null }: ProtectedRouteProps) {
  const { loading, isAdmin, isAuthenticated } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted, #999)', fontSize: 14 }}>Authenticating…</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requiredRole === 'admin' && !isAdmin) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

interface PublicOnlyRouteProps {
  children: ReactNode
}

export function PublicOnlyRoute({ children }: PublicOnlyRouteProps) {
  const { loading, isAdmin, isAuthenticated } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted, #999)', fontSize: 14 }}>Loading…</p>
      </div>
    )
  }

  if (isAuthenticated) {
    const from = location.state?.from?.pathname || (isAdmin ? '/dashboard' : '/')
    return <Navigate to={from} replace />
  }

  return <>{children}</>
}
