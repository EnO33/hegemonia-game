import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { LocaleSwitcher } from '~/components/ui/LocaleSwitcher'
import { ThemeToggle } from '~/components/ui/ThemeToggle'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">{t('app.name')}</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          {t('app.tagline')}
        </p>
        <div className="pt-4 flex items-center justify-center gap-2">
          <LocaleSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </div>
  )
}
