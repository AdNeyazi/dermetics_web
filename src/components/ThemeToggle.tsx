import { useTheme } from '@/components/ThemeProvider'

export function ThemeToggle() {
  const { theme, toggleTheme, mounted } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Light mode' : 'Dark mode'}
    >
      <span className="theme-toggle-icon" aria-hidden="true">
        {mounted ? (isDark ? '☀' : '☾') : '◐'}
      </span>
      <span className="theme-toggle-label">
        {mounted ? (isDark ? 'Light' : 'Dark') : 'Theme'}
      </span>
    </button>
  )
}
