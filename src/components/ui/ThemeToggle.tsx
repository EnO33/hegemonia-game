import { useTranslation } from 'react-i18next'
import { useTheme } from '~/hooks/useTheme'

const themes = ['light', 'dark', 'system'] as const

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const { t } = useTranslation()

  const cycle = () => {
    const currentIndex = themes.indexOf(theme)
    const nextIndex = (currentIndex + 1) % themes.length
    setTheme(themes[nextIndex])
  }

  return (
    <button
      onClick={cycle}
      className="rounded border px-2 py-1 text-sm"
      aria-label={t(`theme.${theme}`)}
    >
      {t(`theme.${theme}`)}
    </button>
  )
}
