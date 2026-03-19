import { createFileRoute, redirect } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { getSession } from '~/lib/auth.functions'
import { getCityOverview } from '~/server/cities'

export const Route = createFileRoute('/worlds/$worldId/city/$cityId')({
  beforeLoad: async () => {
    const session = await getSession()
    if (!session) {
      throw redirect({ to: '/login' })
    }
    return { user: session.user }
  },
  loader: async ({ params }) => {
    const data = await getCityOverview({ data: { cityId: params.cityId } })
    if (!data) {
      throw redirect({ to: '/worlds' })
    }
    return data
  },
  component: CityOverviewPage,
})

const RESOURCE_ICONS: Record<string, string> = {
  food: '🌾',
  wood: '🪵',
  stone: '🪨',
  gold: '💰',
}

const RESOURCE_BUILDING_TYPES = new Set(['farm', 'lumber_mill', 'quarry'])
const MILITARY_BUILDING_TYPES = new Set(['barracks', 'stable', 'siege_workshop', 'harbor'])
const INFRA_BUILDING_TYPES = new Set([
  'senate', 'academy', 'warehouse', 'tavern', 'temple', 'wall', 'market',
])

function CityOverviewPage() {
  const { t } = useTranslation()
  const { city, buildings, productionRates, currentResources, storageCap } =
    Route.useLoaderData()

  const resources = [
    { key: 'food' as const, amount: currentResources.food },
    { key: 'wood' as const, amount: currentResources.wood },
    { key: 'stone' as const, amount: currentResources.stone },
    { key: 'gold' as const, amount: currentResources.gold },
  ]

  const resourceBuildings = buildings.filter((b) => RESOURCE_BUILDING_TYPES.has(b.type))
  const militaryBuildings = buildings.filter((b) => MILITARY_BUILDING_TYPES.has(b.type))
  const infrastructureBuildings = buildings.filter((b) => INFRA_BUILDING_TYPES.has(b.type))

  return (
    <div className="mx-auto max-w-4xl p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{city.name}</h1>
        {city.isCapital && (
          <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900 dark:text-amber-200">
            {t('city.capital')}
          </span>
        )}
      </div>

      {/* Resource Bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {resources.map((resource) => (
          <div
            key={resource.key}
            className="rounded border p-3 space-y-1"
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              <span>{RESOURCE_ICONS[resource.key]}</span>
              <span>{t(`city.resource.${resource.key}`)}</span>
            </div>
            <p className="text-lg font-bold">
              {formatNumber(resource.amount)}
              <span className="text-xs font-normal text-gray-400">
                /{formatNumber(storageCap)}
              </span>
            </p>
            <p className="text-xs text-gray-500">
              +{productionRates[resource.key]}/{t('city.perHour')}
            </p>
          </div>
        ))}
      </div>

      {/* Population & Morale */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded border p-3">
          <p className="text-sm text-gray-500">{t('city.population')}</p>
          <p className="text-lg font-bold">
            {city.population} / {city.populationCap}
          </p>
        </div>
        <div className="rounded border p-3">
          <p className="text-sm text-gray-500">{t('city.morale')}</p>
          <p className="text-lg font-bold">{city.morale}%</p>
        </div>
      </div>

      {/* Building Sections */}
      <BuildingSection
        title={t('city.buildings.resource')}
        buildings={resourceBuildings}
      />
      <BuildingSection
        title={t('city.buildings.military')}
        buildings={militaryBuildings}
      />
      <BuildingSection
        title={t('city.buildings.infrastructure')}
        buildings={infrastructureBuildings}
      />
    </div>
  )
}

interface BuildingSectionProps {
  title: string
  buildings: Array<{
    id: string
    type: string
    level: number
    isUpgrading: boolean
    upgradeEndsAt: Date | null
  }>
}

function BuildingSection({ title, buildings }: BuildingSectionProps) {
  const { t } = useTranslation()

  if (buildings.length === 0) return null

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {buildings.map((building) => (
          <div
            key={building.id}
            className="rounded border p-3 space-y-2"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">
                {t(`city.building.${building.type}`)}
              </h3>
              <span className="text-sm text-gray-500">
                {t('city.level')} {building.level}
              </span>
            </div>

            {building.isUpgrading && building.upgradeEndsAt && (
              <UpgradeTimer endsAt={building.upgradeEndsAt} />
            )}

            <button
              disabled={building.isUpgrading}
              className="w-full rounded bg-gray-800 px-3 py-1.5 text-xs text-white dark:bg-gray-200 dark:text-gray-900 disabled:opacity-50"
            >
              {building.isUpgrading
                ? t('city.upgrading')
                : t('city.upgrade')}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function UpgradeTimer({ endsAt }: { endsAt: Date }) {
  const { t } = useTranslation()
  const now = new Date()
  const remaining = Math.max(0, new Date(endsAt).getTime() - now.getTime())
  const hours = Math.floor(remaining / 3600000)
  const minutes = Math.floor((remaining % 3600000) / 60000)
  const seconds = Math.floor((remaining % 60000) / 1000)

  const timeStr = hours > 0
    ? `${hours}h ${minutes}m`
    : `${minutes}m ${seconds}s`

  return (
    <div className="rounded bg-blue-50 px-2 py-1 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
      {t('city.upgradeTimer', { time: timeStr })}
    </div>
  )
}

function formatNumber(value: number): string {
  return Math.floor(value).toLocaleString()
}
