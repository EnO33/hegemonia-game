import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getSession } from '~/lib/auth.functions'
import { getUnitConfig, getRecruitmentCost } from '~/lib/units'
import { getRecruitmentData, recruitUnits, cancelRecruitment } from '~/server/units'

type UnitType =
  | 'swordsman' | 'hoplite' | 'archer' | 'scout' | 'horseman' | 'cataphract'
  | 'battering_ram' | 'catapult' | 'trebuchet' | 'scout_ship' | 'warship'
  | 'transport' | 'fire_ship' | 'colonist' | 'spy'

export const Route = createFileRoute('/worlds/$worldId/city/$cityId/recruit')({
  beforeLoad: async () => {
    const session = await getSession()
    if (!session) {
      throw redirect({ to: '/login' })
    }
    return { user: session.user }
  },
  loader: async ({ params }) => {
    const data = await getRecruitmentData({ data: { cityId: params.cityId } })
    if (!data) {
      throw redirect({ to: '/worlds' })
    }
    return { ...data, worldId: params.worldId }
  },
  component: RecruitPage,
})

function RecruitPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { city, units, queue, availableTypes } = Route.useLoaderData()
  const { cityId } = Route.useParams()
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null)
  const [count, setCount] = useState(1)
  const [recruiting, setRecruiting] = useState(false)

  const handleRecruit = async () => {
    if (!selectedUnit || count < 1) return
    setRecruiting(true)
    const result = await recruitUnits({
      data: { cityId, unitType: selectedUnit as UnitType, count },
    })
    if (result.success) {
      setSelectedUnit(null)
      setCount(1)
      router.invalidate()
    }
    setRecruiting(false)
  }

  const handleCancel = async (queueId: string) => {
    await cancelRecruitment({ data: { queueId, cityId } })
    router.invalidate()
  }

  const selectedConfig = selectedUnit ? getUnitConfig(selectedUnit) : null
  const totalCost = selectedUnit ? getRecruitmentCost(selectedUnit, count) : null

  return (
    <div className="mx-auto max-w-4xl p-4 space-y-6">
      <h1 className="text-2xl font-bold">{t('recruit.title')}</h1>
      <p className="text-sm text-gray-500">{city.name}</p>

      {/* Current Units */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">{t('recruit.currentUnits')}</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {units
            .filter((u) => u.count > 0)
            .map((unit) => (
              <div key={unit.id} className="rounded border p-2 text-center">
                <p className="text-xs text-gray-500">{t(`recruit.unit.${unit.type}`)}</p>
                <p className="text-lg font-bold">{unit.count}</p>
              </div>
            ))}
          {units.every((u) => u.count === 0) && (
            <p className="col-span-full text-sm text-gray-400">{t('recruit.noUnits')}</p>
          )}
        </div>
      </div>

      {/* Recruitment */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">{t('recruit.available')}</h2>

        {availableTypes.length === 0 && (
          <p className="text-sm text-gray-400">{t('recruit.noneAvailable')}</p>
        )}

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {availableTypes.map((type) => (
            <button
              key={type}
              onClick={() => {
                setSelectedUnit(type)
                setCount(1)
              }}
              className={`rounded border p-2 text-center text-sm transition-colors ${
                selectedUnit === type
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              {t(`recruit.unit.${type}`)}
            </button>
          ))}
        </div>

        {selectedUnit && selectedConfig && totalCost && (
          <div className="rounded border p-4 space-y-3">
            <h3 className="font-medium">{t(`recruit.unit.${selectedUnit}`)}</h3>

            <div className="flex items-center gap-3">
              <label htmlFor="count" className="text-sm">
                {t('recruit.count')}
              </label>
              <input
                id="count"
                type="number"
                min={1}
                max={1000}
                value={count}
                onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-24 rounded border px-2 py-1 text-sm bg-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-1 text-xs text-gray-500 sm:grid-cols-4">
              <span>🌾 {totalCost.food}</span>
              <span>🪵 {totalCost.wood}</span>
              <span>🪨 {totalCost.stone}</span>
              <span>💰 {totalCost.gold}</span>
            </div>

            <button
              onClick={handleRecruit}
              disabled={recruiting}
              className="rounded bg-gray-800 px-4 py-2 text-sm text-white dark:bg-gray-200 dark:text-gray-900 disabled:opacity-50"
            >
              {recruiting ? t('recruit.recruiting') : t('recruit.submit')}
            </button>
          </div>
        )}
      </div>

      {/* Queue */}
      {queue.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">{t('recruit.queue')}</h2>
          <div className="space-y-2">
            {queue.map((item) => {
              const now = new Date()
              const remaining = Math.max(
                0,
                new Date(item.endsAt).getTime() - now.getTime(),
              )
              const minutes = Math.ceil(remaining / 60000)

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {item.count}x {t(`recruit.unit.${item.unitType}`)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {minutes > 0
                        ? t('recruit.timeRemaining', { minutes })
                        : t('recruit.ready')}
                    </p>
                  </div>
                  <button
                    onClick={() => handleCancel(item.id)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    {t('recruit.cancel')}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
