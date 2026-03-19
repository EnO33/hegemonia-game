import { useTranslation } from 'react-i18next'

const locales = [
  { code: 'en', label: 'locale.en' },
  { code: 'fr', label: 'locale.fr' },
] as const

export function LocaleSwitcher() {
  const { t, i18n } = useTranslation()

  const handleChange = (locale: string) => {
    i18n.changeLanguage(locale)
    localStorage.setItem('hegemonia-locale', locale)
  }

  return (
    <select
      value={i18n.language}
      onChange={(e) => handleChange(e.target.value)}
      className="rounded border bg-transparent px-2 py-1 text-sm"
    >
      {locales.map((locale) => (
        <option key={locale.code} value={locale.code}>
          {t(locale.label)}
        </option>
      ))}
    </select>
  )
}
