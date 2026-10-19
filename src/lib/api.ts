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

  return fetch(apiUrl(path), {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...(headers as Record<string, string>),
    },
    ...rest,
  })
}
