import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getSession } from '~/lib/auth.functions'
import { getWorlds, joinWorld } from '~/server/worlds'

export const Route = createFileRoute('/worlds')({
  beforeLoad: async () => {
    const session = await getSession()
    if (!session) {
      throw redirect({ to: '/login' })
    }
    return { user: session.user }
  },
  loader: async () => {
    const worlds = await getWorlds()
    return { worlds }
  },
  component: WorldsPage,
})

function WorldsPage() {
  const { t } = useTranslation()
  const { worlds } = Route.useLoaderData()
  const navigate = useNavigate()
  const [joining, setJoining] = useState<string | null>(null)

  const handleJoin = async (worldId: string) => {
    setJoining(worldId)
    const result = await joinWorld({ data: { worldId } })

    if (result.success) {
      navigate({
        to: '/create-city',
        search: { worldId, playerId: result.playerId },
      })
    }
    setJoining(null)
  }

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-6">
      <h1 className="text-2xl font-bold">{t('worlds.title')}</h1>

      {worlds.length === 0 && (
        <p className="text-gray-500">{t('worlds.empty')}</p>
      )}

      <div className="space-y-4">
        {worlds.map((world) => (
          <div
            key={world.id}
            className="flex items-center justify-between rounded border p-4"
          >
            <div>
              <h2 className="font-semibold">{world.name}</h2>
              <p className="text-sm text-gray-500">
                {t(`worlds.speed.${world.speed}`)} · {t(`worlds.status.${world.status}`)}
              </p>
            </div>
            <button
              onClick={() => handleJoin(world.id)}
              disabled={joining === world.id}
              className="rounded bg-gray-800 px-4 py-2 text-sm text-white dark:bg-gray-200 dark:text-gray-900 disabled:opacity-50"
            >
              {joining === world.id ? t('worlds.joining') : t('worlds.join')}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
