import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { trackAuth, setGAUser } from '@/lib/gtag'
import { AppHeader } from '@/components/AppHeader'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    const res = await login(email, password)
    if (!res.success) {
      setError(typeof res.error === 'string' ? res.error : 'Login failed')
      setSubmitting(false)
      return
    }

    trackAuth({ method: 'email', type: 'login' })
    if (res.user?.id) {
      setGAUser(res.user.id, { user_role: res.user.role || 'user' })
    }

    const state = location.state as { from?: { pathname: string } } | null
    const dest = state?.from?.pathname || (res.user?.role === 'admin' ? '/dashboard' : '/')
    navigate(dest, { replace: true })
  }

  return (
    <>
      <AppHeader />
      <div className="auth-page">
        <div className="ambient-glow" />
        <div className="auth-card">
          <div className="auth-brand gold-text">DERMATICS</div>
          <div className="auth-sub">Sign in to your account</div>
          <form onSubmit={submit}>
            {error && <div className="auth-error">{error}</div>}
            <div className="auth-field">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                required
                autoComplete="email"
              />
            </div>
            <div className="auth-field">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>
            <button
              className="btn-pill solid"
              type="submit"
              disabled={submitting}
              style={{ width: '100%', justifyContent: 'center', marginTop: 10 }}
            >
              {submitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <div className="auth-alt">
            Don&apos;t have an account? <Link to="/signup">Create one</Link>
          </div>
          <div className="auth-alt">
            <Link to="/">&larr; Back to store</Link>
          </div>
        </div>
      </div>
    </>
  )
}

export default LoginPage
