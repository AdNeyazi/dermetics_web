import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react'
import { apiFetch } from '@/lib/api'
import type { User, AuthContextType } from '@/types'

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  const checkAuth = useCallback(async (): Promise<User | null> => {
    try {
      const res = await apiFetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        setUser(data?.user || null)
        if (!data?.user && typeof window !== 'undefined') {
          localStorage.removeItem('dermatics_token')
        }
        return data?.user || null
      } else {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('dermatics_token')
        }
        setUser(null)
        return null
      }
    } catch (err) {
      console.warn('[AuthContext] Failed to check session:', err)
      setUser(null)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> => {
    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        return { success: false, error: data.error || 'Invalid email or password' }
      }
      if (data.token && typeof window !== 'undefined') {
        localStorage.setItem('dermatics_token', data.token)
      }
      setUser(data.user)
      return { success: true, user: data.user }
    } catch (err: any) {
      return { success: false, error: err?.message || 'Login failed. Please try again.' }
    }
  }, [])

  const signup = useCallback(async (name: string, email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> => {
    try {
      const res = await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        return { success: false, error: data.error || 'Registration failed' }
      }
      if (data.token && typeof window !== 'undefined') {
        localStorage.setItem('dermatics_token', data.token)
      }
      setUser(data.user)
      return { success: true, user: data.user }
    } catch (err: any) {
      return { success: false, error: err?.message || 'Signup failed. Please try again.' }
    }
  }, [])

  const logout = useCallback(async (): Promise<void> => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' })
    } catch (err) {
      console.warn('[AuthContext] Logout request error:', err)
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('dermatics_token')
      }
      setUser(null)
    }
  }, [])

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      loading,
      isAdmin: user?.role === 'admin',
      isAuthenticated: Boolean(user),
      checkAuth,
      login,
      signup,
      logout,
    }),
    [user, loading, checkAuth, login, signup, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
