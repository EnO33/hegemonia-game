import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../db'
import {
  buildings,
  cities,
  players,
  unitQueues,
  units,
  worlds,
  unitTypeEnum,
} from '../../db/schema'
import { auth } from '~/lib/auth'
import {
  calculateCurrentResources,
  calculateProductionRates,
  getStorageCap,
} from '~/lib/resources'
import { getWorldSpeedMultiplier } from '~/lib/buildings'
import {
  getUnitConfig,
  getRecruitmentCost,
  getTrainingTime,
  getAvailableUnits,
} from '~/lib/units'
import { islands, research } from '../../db/schema'

type RecruitError =
  | 'UNAUTHORIZED'
  | 'CITY_NOT_FOUND'
  | 'UNIT_NOT_AVAILABLE'
  | 'INSUFFICIENT_RESOURCES'

type RecruitResult =
  | { success: true; queueId: string; endsAt: string }
  | { success: false; error: RecruitError }

const recruitSchema = z.object({
  cityId: z.string().uuid(),
  unitType: z.enum(unitTypeEnum.enumValues),
  count: z.number().int().min(1).max(1000),
})

export const recruitUnits = createServerFn({ method: 'POST' })
  .inputValidator(recruitSchema)
  .handler(async ({ data }): Promise<RecruitResult> => {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })

    if (!session) {
      return { success: false, error: 'UNAUTHORIZED' }
    }

    const [city] = await db
      .select()
      .from(cities)
      .where(eq(cities.id, data.cityId))
      .limit(1)

    if (!city) {
      return { success: false, error: 'CITY_NOT_FOUND' }
    }

    const [player] = await db
      .select()
      .from(players)
      .where(and(eq(players.id, city.playerId), eq(players.userId, session.user.id)))
      .limit(1)

    if (!player) {
      return { success: false, error: 'CITY_NOT_FOUND' }
    }

    // Check unit availability
    const cityBuildings = await db
      .select()
      .from(buildings)
      .where(eq(buildings.cityId, data.cityId))

    const config = getUnitConfig(data.unitType)
    if (!config) {
      return { success: false, error: 'UNIT_NOT_AVAILABLE' }
    }

    const requiredBuilding = cityBuildings.find(
      (b) => b.type === config.requiredBuilding,
    )
    if (!requiredBuilding || requiredBuilding.level < config.requiredBuildingLevel) {
      return { success: false, error: 'UNIT_NOT_AVAILABLE' }
    }

    // Check resources
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
    const currentResources = calculateCurrentResources(city, productionRates, storageCap)

    const cost = getRecruitmentCost(data.unitType, data.count)
    if (
      !cost ||
      currentResources.food < cost.food ||
      currentResources.wood < cost.wood ||
      currentResources.stone < cost.stone ||
      currentResources.gold < cost.gold
    ) {
      return { success: false, error: 'INSUFFICIENT_RESOURCES' }
    }

    // Calculate training time
    const [world] = await db
      .select()
      .from(worlds)
      .where(eq(worlds.id, player.worldId))
      .limit(1)

    const worldSpeed = getWorldSpeedMultiplier(world?.speed ?? 'standard')
    const trainingTime = getTrainingTime(
      data.unitType,
      data.count,
      requiredBuilding.level,
      worldSpeed,
    )

    if (trainingTime === null) {
      return { success: false, error: 'UNIT_NOT_AVAILABLE' }
    }

    // Find the last queue end time for this city
    const existingQueues = await db
      .select()
      .from(unitQueues)
      .where(eq(unitQueues.cityId, data.cityId))

    const now = new Date()
    const lastEndsAt = existingQueues.reduce((latest, q) => {
      const qEnd = new Date(q.endsAt).getTime()
      return qEnd > latest ? qEnd : latest
    }, now.getTime())

    const startAt = new Date(Math.max(lastEndsAt, now.getTime()))
    const endsAt = new Date(startAt.getTime() + trainingTime * 1000)

    // Deduct resources and create queue entry
    const result = await db.transaction(async (tx) => {
      await tx
        .update(cities)
        .set({
          food: String(currentResources.food - cost.food),
          wood: String(currentResources.wood - cost.wood),
          stone: String(currentResources.stone - cost.stone),
          gold: String(currentResources.gold - cost.gold),
          lastResourceSnapshotAt: now,
          updatedAt: now,
        })
        .where(eq(cities.id, data.cityId))

      const [queue] = await tx
        .insert(unitQueues)
        .values({
          cityId: data.cityId,
          unitType: data.unitType,
          count: data.count,
          startedAt: startAt,
          endsAt,
        })
        .returning()

      return queue
    })

    return { success: true, queueId: result.id, endsAt: endsAt.toISOString() }
  })

export const getRecruitmentData = createServerFn({ method: 'GET' })
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

    const cityUnits = await db
      .select()
      .from(units)
      .where(eq(units.cityId, data.cityId))

    const queue = await db
      .select()
      .from(unitQueues)
      .where(eq(unitQueues.cityId, data.cityId))

    const availableTypes = getAvailableUnits(cityBuildings)

    return {
      city,
      buildings: cityBuildings,
      units: cityUnits,
      queue,
      availableTypes,
    }
  })

const cancelQueueSchema = z.object({
  queueId: z.string().uuid(),
  cityId: z.string().uuid(),
})

export const cancelRecruitment = createServerFn({ method: 'POST' })
  .inputValidator(cancelQueueSchema)
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })

    if (!session) {
      return { success: false as const }
    }

    const [city] = await db
      .select()
      .from(cities)
      .where(eq(cities.id, data.cityId))
      .limit(1)

    if (!city) {
      return { success: false as const }
    }

    const [player] = await db
      .select()
      .from(players)
      .where(and(eq(players.id, city.playerId), eq(players.userId, session.user.id)))
      .limit(1)

    if (!player) {
      return { success: false as const }
    }

    const [queueItem] = await db
      .select()
      .from(unitQueues)
      .where(and(eq(unitQueues.id, data.queueId), eq(unitQueues.cityId, data.cityId)))
      .limit(1)

    if (!queueItem) {
      return { success: false as const }
    }

    // Refund 50% of resources
    const cost = getRecruitmentCost(queueItem.unitType, queueItem.count)
    if (!cost) {
      return { success: false as const }
    }

    await db.transaction(async (tx) => {
      await tx
        .update(cities)
        .set({
          food: String(parseFloat(String(city.food)) + cost.food * 0.5),
          wood: String(parseFloat(String(city.wood)) + cost.wood * 0.5),
          stone: String(parseFloat(String(city.stone)) + cost.stone * 0.5),
          gold: String(parseFloat(String(city.gold)) + cost.gold * 0.5),
          updatedAt: new Date(),
        })
        .where(eq(cities.id, data.cityId))

      await tx.delete(unitQueues).where(eq(unitQueues.id, data.queueId))
    })

    return { success: true as const }
  })
