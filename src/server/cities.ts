import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { and, eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../db'
import { cities, buildings, units, islands, players } from '../../db/schema'
import { auth } from '~/lib/auth'
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
