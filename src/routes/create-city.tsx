import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { getSession } from '~/lib/auth.functions'
import { createCity, getPlayerCity } from '~/server/cities'

const searchSchema = z.object({
  worldId: z.string().uuid(),
  playerId: z.string().uuid(),
})

export const Route = createFileRoute('/create-city')({
  validateSearch: searchSchema,
  beforeLoad: async () => {
    const session = await getSession()
    if (!session) {
      throw redirect({ to: '/login' })
    }
    return { user: session.user }
  },
  loaderDeps: ({ search }) => ({
    worldId: search.worldId,
    playerId: search.playerId,
  }),
  loader: async ({ deps }) => {
    const existingCity = await getPlayerCity({ data: { playerId: deps.playerId } })
    if (existingCity) {
      throw redirect({ to: '/' })
    }
    return { worldId: deps.worldId, playerId: deps.playerId }
  },
  component: CreateCityPage,
})

function CreateCityPage() {
  const { t } = useTranslation()
  const { worldId, playerId } = Route.useLoaderData()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (name.length < 3 || name.length > 100) {
      setError(t('city.create.nameError'))
      return
    }

    setSubmitting(true)
    const result = await createCity({ data: { playerId, worldId, name } })

    if (result.success) {
      navigate({ to: '/' })
      return
    }

    setError(t(`city.create.error.${result.error}`))
    setSubmitting(false)
  }

  return (
    <div className="mx-auto max-w-md p-6 space-y-6">
      <h1 className="text-2xl font-bold">{t('city.create.title')}</h1>
      <p className="text-gray-500">{t('city.create.description')}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="city-name" className="block text-sm font-medium mb-1">
            {t('city.create.nameLabel')}
          </label>
          <input
            id="city-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('city.create.namePlaceholder')}
            minLength={3}
            maxLength={100}
            required
            className="w-full rounded border px-3 py-2 text-sm bg-transparent"
          />
          {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
        </div>

        <button
          type="submit"
          disabled={submitting || name.length < 3}
          className="w-full rounded bg-gray-800 px-4 py-2 text-sm text-white dark:bg-gray-200 dark:text-gray-900 disabled:opacity-50"
        >
          {submitting ? t('city.create.submitting') : t('city.create.submit')}
        </button>
      </form>
    </div>
  )
}
