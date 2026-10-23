import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { trackAuth, setGAUser } from '@/lib/gtag'
import { AppHeader } from '@/components/AppHeader'

export function SignupPage() {
  const navigate = useNavigate()
  const { signup } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 10) {
      setError('Password must be at least 10 characters')
      return
    }
    setError('')
    setSubmitting(true)

    const res = await signup(name, email, password)
    if (!res.success) {
      setError(typeof res.error === 'string' ? res.error : 'Signup failed')
      setSubmitting(false)
      return
    }

    trackAuth({ method: 'email', type: 'sign_up' })
    if (res.user?.id) {
      setGAUser(res.user.id, { user_role: res.user.role || 'user' })
    }

    // New registered users redirect to storefront home
    navigate('/', { replace: true })
  }

  return (
    <>
      <AppHeader />
      <div className="auth-page">
        <div className="ambient-glow" />
        <div className="auth-card">
          <div className="auth-brand gold-text">DERMATICS</div>
          <div className="auth-sub">Create your account</div>
          <form onSubmit={submit}>
            {error && <div className="auth-error">{error}</div>}
            <div className="auth-field">
              <label>Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
                autoComplete="name"
              />
            </div>
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
              <label>Password (min. 10 characters)</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 10 characters"
                required
                minLength={10}
                autoComplete="new-password"
              />
            </div>
            <button
              className="btn-pill solid"
              type="submit"
              disabled={submitting}
              style={{ width: '100%', justifyContent: 'center', marginTop: 10 }}
            >
              {submitting ? 'Creating...' : 'Create Account'}
            </button>
          </form>
          <div className="auth-alt">
            Already have an account? <Link to="/login">Sign in</Link>
          </div>
          <div className="auth-alt">
            <Link to="/">&larr; Back to store</Link>
          </div>
        </div>
      </div>
    </>
  )
}

export default SignupPage
