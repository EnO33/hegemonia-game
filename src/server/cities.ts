import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { and, eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../db'
import { cities, buildings, units, islands, players, research } from '../../db/schema'
import { auth } from '~/lib/auth'
import {
  calculateProductionRates,
  calculateCurrentResources,
  getStorageCap,
} from '~/lib/resources'
import type { buildingTypeEnum, unitTypeEnum } from '../../db/schema'

const INITIAL_BUILDING_TYPES: (typeof buildingTypeEnum.enumValues)[number][] = [
  'farm',
  'lumber_mill',
  'quarry',
  'market',
  'barracks',
  'stable',
  'siege_workshop',
  'harbor',
  'wall',
  'senate',
  'academy',
  'warehouse',
  'tavern',
  'temple',
]

const INITIAL_UNIT_TYPES: (typeof unitTypeEnum.enumValues)[number][] = [
  'swordsman',
  'hoplite',
  'archer',
  'scout',
  'horseman',
  'cataphract',
  'battering_ram',
  'catapult',
  'trebuchet',
  'scout_ship',
  'warship',
  'transport',
  'fire_ship',
  'colonist',
  'spy',
]

const createCitySchema = z.object({
  playerId: z.string().uuid(),
  worldId: z.string().uuid(),
  name: z.string().min(3).max(100),
})

export const createCity = createServerFn({ method: 'POST' })
  .inputValidator(createCitySchema)
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })

    if (!session) {
      return { success: false as const, error: 'UNAUTHORIZED' }
    }

    // Verify this player belongs to the current user
    const [player] = await db
      .select()
      .from(players)
      .where(and(eq(players.id, data.playerId), eq(players.userId, session.user.id)))
      .limit(1)

    if (!player) {
      return { success: false as const, error: 'PLAYER_NOT_FOUND' }
    }

    // Check if player already has a city in this world
    const existingCities = await db
      .select({ id: cities.id })
      .from(cities)
      .where(eq(cities.playerId, data.playerId))
      .limit(1)

    if (existingCities.length > 0) {
      return { success: false as const, error: 'ALREADY_HAS_CITY' }
    }

    // Find a random available island with capacity
    const availableIslands = await db
      .select({
        id: islands.id,
        maxCities: islands.maxCities,
        currentCities: sql<number>`(
          SELECT COUNT(*)::int FROM cities
          WHERE cities.island_id = ${islands.id}
        )`,
      })
      .from(islands)
      .where(eq(islands.worldId, data.worldId))
      .limit(50)

    const islandsWithSpace = availableIslands.filter(
      (island) => island.currentCities < island.maxCities,
    )

    if (islandsWithSpace.length === 0) {
      return { success: false as const, error: 'NO_ISLAND_AVAILABLE' }
    }

    const randomIsland = islandsWithSpace[Math.floor(Math.random() * islandsWithSpace.length)]

    // Create city with default buildings and units in a transaction
    const result = await db.transaction(async (tx) => {
      const [city] = await tx
        .insert(cities)
        .values({
          playerId: data.playerId,
          islandId: randomIsland.id,
          name: data.name,
          isCapital: true,
        })
        .returning()

      await tx.insert(buildings).values(
        INITIAL_BUILDING_TYPES.map((type) => ({
          cityId: city.id,
          type,
          level: 0,
        })),
      )

      await tx.insert(units).values(
        INITIAL_UNIT_TYPES.map((type) => ({
          cityId: city.id,
          type,
          count: 0,
        })),
      )

      return city
    })

    return { success: true as const, cityId: result.id }
  })

export const getPlayerCity = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ playerId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const [city] = await db
      .select()
      .from(cities)
      .where(eq(cities.playerId, data.playerId))
      .limit(1)

    return city ?? null
  })

export const getCityOverview = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ cityId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })

    if (!session) {
      return null
    }

    const [city] = await db
      .select()
      .from(cities)
      .where(eq(cities.id, data.cityId))
      .limit(1)

    if (!city) {
      return null
    }

    // Verify ownership
    const [player] = await db
      .select()
      .from(players)
      .where(and(eq(players.id, city.playerId), eq(players.userId, session.user.id)))
      .limit(1)

    if (!player) {
      return null
    }

    const cityBuildings = await db
      .select()
      .from(buildings)
      .where(eq(buildings.cityId, data.cityId))

    const [island] = await db
      .select()
      .from(islands)
      .where(eq(islands.id, city.islandId))
      .limit(1)

    const playerResearch = await db
      .select()
      .from(research)
      .where(eq(research.playerId, city.playerId))

    const warehouseBuilding = cityBuildings.find((b) => b.type === 'warehouse')
    const storageCap = getStorageCap(warehouseBuilding?.level ?? 0)

    const productionRates = island
      ? calculateProductionRates(cityBuildings, island, playerResearch)
      : { food: 0, wood: 0, stone: 0, gold: 0 }

    const currentResources = calculateCurrentResources(
      city,
      productionRates,
      storageCap,
    )

    return {
      city,
      buildings: cityBuildings,
      productionRates,
      currentResources,
      storageCap,
    }
  })
