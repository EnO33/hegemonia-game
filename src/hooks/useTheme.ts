import { useCallback, useEffect, useSyncExternalStore } from 'react'

type Theme = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'hegemonia-theme'

function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'system'
  return (localStorage.getItem(STORAGE_KEY) as Theme) ?? 'system'
}

function getResolvedTheme(theme: Theme): 'light' | 'dark' {
  if (theme !== 'system') return theme
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme: Theme) {
  const resolved = getResolvedTheme(theme)
  document.documentElement.classList.remove('light', 'dark')
  document.documentElement.classList.add(resolved)
}

const listeners = new Set<() => void>()
let currentTheme: Theme = getStoredTheme()

function subscribe(callback: () => void) {
  listeners.add(callback)
  return () => listeners.delete(callback)
}

function getSnapshot(): Theme {
  return currentTheme
}

function getServerSnapshot(): Theme {
  return 'system'
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  useEffect(() => {
    applyTheme(theme)

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (currentTheme === 'system') applyTheme('system')
    }
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  const setTheme = useCallback((newTheme: Theme) => {
    currentTheme = newTheme
    localStorage.setItem(STORAGE_KEY, newTheme)
    applyTheme(newTheme)
    listeners.forEach((l) => l())
  }, [])

  return {
    theme,
    resolvedTheme: getResolvedTheme(theme),
    setTheme,
  }
}
