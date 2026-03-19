import { createFileRoute, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getSession } from '~/lib/auth.functions'
import { getWorldMap, getIslandDetails } from '~/server/map'

export const Route = createFileRoute('/worlds/$worldId/map')({
  beforeLoad: async () => {
    const session = await getSession()
    if (!session) {
      throw redirect({ to: '/login' })
    }
    return { user: session.user }
  },
  loader: async ({ params }) => {
    const data = await getWorldMap({ data: { worldId: params.worldId } })
    if (!data) {
      throw redirect({ to: '/worlds' })
    }
    return data
  },
  component: WorldMapPage,
})

const CELL_SIZE = 48
const TERRAIN_COLORS: Record<string, { fill: string; darkFill: string }> = {
  standard: { fill: '#86efac', darkFill: '#166534' },
  fertile: { fill: '#fde047', darkFill: '#854d0e' },
  rocky: { fill: '#d6d3d1', darkFill: '#57534e' },
  coastal: { fill: '#7dd3fc', darkFill: '#0c4a6e' },
}

interface IslandData {
  id: string
  x: number
  y: number
  terrainType: string
  maxCities: number
  cities: Array<{
    id: string
    name: string
    playerId: string
  }>
}

interface IslandDetailData {
  island: {
    id: string
    x: number
    y: number
    terrainType: string
    maxCities: number
    foodBonus: number
    woodBonus: number
    stoneBonus: number
  }
  cities: Array<{
    id: string
    name: string
    playerId: string
    isCapital: boolean
  }>
  availableSlots: number
}

function WorldMapPage() {
  const { t } = useTranslation()
  const { world, islands, currentPlayerId } = Route.useLoaderData()
  const [selectedIsland, setSelectedIsland] = useState<IslandDetailData | null>(null)
  const [loading, setLoading] = useState(false)

  if (islands.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">{t('map.empty')}</p>
      </div>
    )
  }

  const maxX = Math.max(...islands.map((i) => i.x))
  const maxY = Math.max(...islands.map((i) => i.y))
  const svgWidth = (maxX + 2) * CELL_SIZE
  const svgHeight = (maxY + 2) * CELL_SIZE

  const handleIslandClick = async (island: IslandData) => {
    setLoading(true)
    const details = await getIslandDetails({ data: { islandId: island.id } })
    setSelectedIsland(details)
    setLoading(false)
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('map.title', { name: world.name })}</h1>
      </div>

      <div className="flex gap-4">
        {/* Map */}
        <div className="flex-1 overflow-auto rounded border">
          <svg
            width={svgWidth}
            height={svgHeight}
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="min-w-full"
          >
            {/* Sea background */}
            <rect width={svgWidth} height={svgHeight} className="fill-blue-100 dark:fill-blue-950" />

            {islands.map((island) => {
              const x = (island.x + 0.5) * CELL_SIZE
              const y = (island.y + 0.5) * CELL_SIZE
              const colors = TERRAIN_COLORS[island.terrainType] ?? TERRAIN_COLORS.standard
              const hasOwnCity = island.cities.some(
                (c) => c.playerId === currentPlayerId,
              )
              const cityCount = island.cities.length

              return (
                <g
                  key={island.id}
                  onClick={() => handleIslandClick(island)}
                  className="cursor-pointer"
                >
                  {/* Island */}
                  <rect
                    x={x - CELL_SIZE / 2 + 2}
                    y={y - CELL_SIZE / 2 + 2}
                    width={CELL_SIZE - 4}
                    height={CELL_SIZE - 4}
                    rx={4}
                    className={hasOwnCity ? 'stroke-blue-500 stroke-2' : 'stroke-transparent'}
                    fill={colors.fill}
                  />

                  {/* City count indicator */}
                  {cityCount > 0 && (
                    <text
                      x={x}
                      y={y + 4}
                      textAnchor="middle"
                      className="fill-gray-800 text-xs font-bold pointer-events-none"
                      style={{ fontSize: 11 }}
                    >
                      {cityCount}
                    </text>
                  )}
                </g>
              )
            })}
          </svg>
        </div>

        {/* Island Details Panel */}
        <div className="w-72 shrink-0 space-y-3">
          {loading && (
            <p className="text-sm text-gray-500">{t('map.loading')}</p>
          )}

          {!loading && !selectedIsland && (
            <p className="text-sm text-gray-400">{t('map.selectIsland')}</p>
          )}

          {!loading && selectedIsland && (
            <IslandPanel
              details={selectedIsland}
              currentPlayerId={currentPlayerId}
            />
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
        {Object.entries(TERRAIN_COLORS).map(([type, colors]) => (
          <div key={type} className="flex items-center gap-1">
            <span
              className="inline-block h-3 w-3 rounded"
              style={{ backgroundColor: colors.fill }}
            />
            {t(`map.terrain.${type}`)}
          </div>
        ))}
      </div>
    </div>
  )
}

function IslandPanel({
  details,
  currentPlayerId,
}: {
  details: IslandDetailData
  currentPlayerId: string | null
}) {
  const { t } = useTranslation()
  const { island, cities, availableSlots } = details

  return (
    <div className="rounded border p-4 space-y-3">
      <h3 className="font-semibold">
        {t('map.island')} ({island.x}, {island.y})
      </h3>
      <p className="text-xs text-gray-500">
        {t(`map.terrain.${island.terrainType}`)}
      </p>

      {/* Terrain bonuses */}
      <div className="text-xs space-y-1">
        {island.foodBonus > 0 && (
          <p>🌾 +{island.foodBonus}%</p>
        )}
        {island.woodBonus > 0 && (
          <p>🪵 +{island.woodBonus}%</p>
        )}
        {island.stoneBonus > 0 && (
          <p>🪨 +{island.stoneBonus}%</p>
        )}
      </div>

      {/* Cities */}
      <div className="space-y-2">
        <p className="text-sm font-medium">
          {t('map.cities')} ({cities.length}/{island.maxCities})
        </p>
        {cities.map((city) => {
          const isOwn = city.playerId === currentPlayerId
          return (
            <div
              key={city.id}
              className={`rounded border p-2 text-sm ${isOwn ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' : ''}`}
            >
              <p className="font-medium">{city.name}</p>
              {city.isCapital && (
                <span className="text-xs text-amber-600">{t('city.capital')}</span>
              )}
            </div>
          )
        })}
        {availableSlots > 0 && (
          <p className="text-xs text-gray-400">
            {t('map.slotsAvailable', { count: availableSlots })}
          </p>
        )}
      </div>
    </div>
  )
}
