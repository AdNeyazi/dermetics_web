export const THEME_STORAGE_KEY = 'dermatics-theme'

export type Theme = 'light' | 'dark'

export function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

export function applyTheme(theme: string): void {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light')
}
