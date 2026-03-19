import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { authClient } from '~/lib/auth-client'
import { getSession } from '~/lib/auth.functions'

export const Route = createFileRoute('/profile')({
  beforeLoad: async () => {
    const session = await getSession()
    if (!session) {
      throw redirect({ to: '/login' })
    }
    return { user: session.user }
  },
  component: ProfilePage,
})

function ProfilePage() {
  const { user } = Route.useRouteContext()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [name, setName] = useState(user.name)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    const result = await authClient.updateUser({ name })

    if (result.error) {
      setMessage(t('profile.error'))
    } else {
      setMessage(t('profile.saved'))
    }
    setSaving(false)
  }

  const handleLogout = async () => {
    await authClient.signOut()
    navigate({ to: '/login' })
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-6 p-6">
        <h1 className="text-2xl font-bold text-center">{t('profile.title')}</h1>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              {t('auth.email')}
            </label>
            <input
              id="email"
              type="email"
              value={user.email}
              disabled
              className="mt-1 w-full rounded border px-3 py-2 bg-transparent opacity-50"
            />
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium">
              {t('auth.username')}
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 w-full rounded border px-3 py-2 bg-transparent"
            />
          </div>

          {message && (
            <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded bg-gray-800 px-4 py-2 text-white dark:bg-gray-200 dark:text-gray-900 disabled:opacity-50"
          >
            {saving ? t('profile.saving') : t('profile.save')}
          </button>
        </form>

        <button
          onClick={handleLogout}
          className="w-full rounded border px-4 py-2 text-sm"
        >
          {t('auth.logout')}
        </button>
      </div>
    </div>
  )
}
