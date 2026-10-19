import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { applyTheme, getStoredTheme, THEME_STORAGE_KEY, type Theme } from '@/lib/theme'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  mounted: boolean
}

const ThemeContext = createContext<ThemeContextType | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light')
  const [mounted, setMounted] = useState<boolean>(false)

  useEffect(() => {
    const initial = getStoredTheme()
    setThemeState(initial)
    applyTheme(initial)
    setMounted(true)
  }, [])

  const setTheme = useCallback((next: Theme) => {
    const value: Theme = next === 'dark' ? 'dark' : 'light'
    setThemeState(value)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, value)
    } catch {
      /* ignore */
    }
    applyTheme(value)
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const value: Theme = prev === 'dark' ? 'light' : 'dark'
      try {
        localStorage.setItem(THEME_STORAGE_KEY, value)
      } catch {
        /* ignore */
      }
      applyTheme(value)
      return value
    })
  }, [])

  const value = useMemo<ThemeContextType>(
    () => ({ theme, setTheme, toggleTheme, mounted }),
    [theme, setTheme, toggleTheme, mounted],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextType {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
