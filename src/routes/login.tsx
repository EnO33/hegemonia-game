import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { authClient } from '~/lib/auth-client'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await authClient.signIn.email({ email, password })

    if (result.error) {
      setError(result.error.message ?? t('auth.login.error'))
      setLoading(false)
      return
    }

    navigate({ to: '/' })
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-6 p-6">
        <h1 className="text-2xl font-bold text-center">{t('auth.login.title')}</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              {t('auth.email')}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full rounded border px-3 py-2 bg-transparent"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              {t('auth.password')}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 w-full rounded border px-3 py-2 bg-transparent"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-gray-800 px-4 py-2 text-white dark:bg-gray-200 dark:text-gray-900 disabled:opacity-50"
          >
            {loading ? t('auth.login.loading') : t('auth.login.submit')}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          {t('auth.login.noAccount')}{' '}
          <Link to="/register" className="underline">
            {t('auth.register.title')}
          </Link>
        </p>
      </div>
    </div>
  )
}
