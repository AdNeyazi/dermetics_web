import { trackApiPerformance } from './gtag'

export function getApiBase(): string {
  const raw = import.meta.env?.VITE_API_URL
  if (!raw || raw === 'same-origin') return ''
  return String(raw).trim().replace(/\/$/, '')
}

export const API_BASE = getApiBase()

/** @param path - e.g. `/api/products` */
export function apiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`
  return `${getApiBase()}${p}`
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const { headers, ...rest } = options
  const token = typeof window !== 'undefined' ? localStorage.getItem('dermatics_token') : null
  const authHeaders: Record<string, string> = {}
  if (token) {
    authHeaders['Authorization'] = `Bearer ${token}`
  }

  const start = typeof performance !== 'undefined' ? performance.now() : Date.now()

  try {
    const res = await fetch(apiUrl(path), {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...(headers as Record<string, string>),
      },
      ...rest,
    })

    const duration = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - start
    // Don't recurse on analytics endpoints
    if (!path.includes('analytics')) {
      trackApiPerformance({
        endpoint: path,
        duration_ms: duration,
        status: res.status,
        ok: res.ok,
      })
    }

    return res
  } catch (err) {
    const duration = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - start
    if (!path.includes('analytics')) {
      trackApiPerformance({
        endpoint: path,
        duration_ms: duration,
        status: 0,
        ok: false,
      })
    }
    throw err
  }
}
