import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../db'
import {
  armies,
  armyUnits,
  cities,
  islands,
  players,
  units,
  worlds,
  unitTypeEnum,
} from '../../db/schema'
import { auth } from '~/lib/auth'
import { calculateTravelTime } from '~/lib/combat'
import { getWorldSpeedMultiplier } from '~/lib/buildings'

type LaunchError =
  | 'UNAUTHORIZED'
  | 'CITY_NOT_FOUND'
  | 'TARGET_NOT_FOUND'
  | 'CANNOT_ATTACK_SELF'
  | 'NO_UNITS'
  | 'INSUFFICIENT_UNITS'

type LaunchResult =
  | { success: true; armyId: string; arrivalAt: string }
  | { success: false; error: LaunchError }

const unitCompositionSchema = z.object({
  type: z.enum(unitTypeEnum.enumValues),
  count: z.number().int().min(1),
})

const launchAttackSchema = z.object({
  originCityId: z.string().uuid(),
  targetCityId: z.string().uuid(),
  units: z.array(unitCompositionSchema).min(1),
})

export const launchAttack = createServerFn({ method: 'POST' })
  .inputValidator(launchAttackSchema)
  .handler(async ({ data }): Promise<LaunchResult> => {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })

    if (!session) {
      return { success: false, error: 'UNAUTHORIZED' }
    }

    // Load origin city and verify ownership
    const [originCity] = await db
      .select()
      .from(cities)
      .where(eq(cities.id, data.originCityId))
      .limit(1)

    if (!originCity) {
      return { success: false, error: 'CITY_NOT_FOUND' }
    }

    const [player] = await db
      .select()
      .from(players)
      .where(and(eq(players.id, originCity.playerId), eq(players.userId, session.user.id)))
      .limit(1)

    if (!player) {
      return { success: false, error: 'CITY_NOT_FOUND' }
    }

    // Load target city
    const [targetCity] = await db
      .select()
      .from(cities)
      .where(eq(cities.id, data.targetCityId))
      .limit(1)

    if (!targetCity) {
      return { success: false, error: 'TARGET_NOT_FOUND' }
    }

    // Cannot attack own city
    if (targetCity.playerId === player.id) {
      return { success: false, error: 'CANNOT_ATTACK_SELF' }
    }

    // Validate unit counts
    if (data.units.length === 0) {
      return { success: false, error: 'NO_UNITS' }
    }

    const cityUnits = await db
      .select()
      .from(units)
      .where(eq(units.cityId, data.originCityId))

    for (const requested of data.units) {
      const available = cityUnits.find((u) => u.type === requested.type)
      if (!available || available.count < requested.count) {
        return { success: false, error: 'INSUFFICIENT_UNITS' }
      }
    }

    // Calculate travel time
    const [originIsland] = await db
      .select()
      .from(islands)
      .where(eq(islands.id, originCity.islandId))
      .limit(1)

    const [targetIsland] = await db
      .select()
      .from(islands)
      .where(eq(islands.id, targetCity.islandId))
      .limit(1)

    if (!originIsland || !targetIsland) {
      return { success: false, error: 'CITY_NOT_FOUND' }
    }

    const [world] = await db
      .select()
      .from(worlds)
      .where(eq(worlds.id, player.worldId))
      .limit(1)

    const worldSpeed = getWorldSpeedMultiplier(world?.speed ?? 'standard')
    const travelTime = calculateTravelTime(
      originIsland.x,
      originIsland.y,
      targetIsland.x,
      targetIsland.y,
      data.units,
      worldSpeed,
    )

    const now = new Date()
    const arrivalAt = new Date(now.getTime() + travelTime * 1000)

    // Deduct units and create army in a transaction
    const result = await db.transaction(async (tx) => {
      // Deduct units from origin city
      for (const requested of data.units) {
        const available = cityUnits.find((u) => u.type === requested.type)
        if (available) {
          await tx
            .update(units)
            .set({ count: available.count - requested.count, updatedAt: now })
            .where(eq(units.id, available.id))
        }
      }

      // Create army
      const [army] = await tx
        .insert(armies)
        .values({
          worldId: player.worldId,
          ownerPlayerId: player.id,
          originCityId: data.originCityId,
          targetCityId: data.targetCityId,
          type: 'attack',
          status: 'marching',
          departureAt: now,
          arrivalAt,
        })
        .returning()

      // Add army units
      await tx.insert(armyUnits).values(
        data.units.map((u) => ({
          armyId: army.id,
          type: u.type,
          count: u.count,
        })),
      )

      return army
    })

    return { success: true, armyId: result.id, arrivalAt: arrivalAt.toISOString() }
  })

export const getOutgoingArmies = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ cityId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const cityArmies = await db
      .select()
      .from(armies)
      .where(and(eq(armies.originCityId, data.cityId), eq(armies.status, 'marching')))

    const armyIds = cityArmies.map((a) => a.id)
    if (armyIds.length === 0) return []

    const allArmyUnits = await db.select().from(armyUnits)

    return cityArmies.map((army) => ({
      ...army,
      units: allArmyUnits.filter((u) => u.armyId === army.id),
    }))
  })
