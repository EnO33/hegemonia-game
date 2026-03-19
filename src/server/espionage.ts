import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../db'
import {
  cities,
  players,
  units,
  spyMissions,
  spyMissionTypeEnum,
  worlds,
} from '../../db/schema'
import { auth } from '~/lib/auth'
import { getMissionDuration } from '~/lib/espionage'
import { getWorldSpeedMultiplier } from '~/lib/buildings'

type SpyError =
  | 'UNAUTHORIZED'
  | 'CITY_NOT_FOUND'
  | 'TARGET_NOT_FOUND'
  | 'NO_SPIES'
  | 'CANNOT_SPY_SELF'

type SpyResult =
  | { success: true; missionId: string; arrivalAt: string }
  | { success: false; error: SpyError }

const launchSpyMissionSchema = z.object({
  originCityId: z.string().uuid(),
  targetCityId: z.string().uuid(),
  missionType: z.enum(spyMissionTypeEnum.enumValues),
})

export const launchSpyMission = createServerFn({ method: 'POST' })
  .inputValidator(launchSpyMissionSchema)
  .handler(async ({ data }): Promise<SpyResult> => {
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

    if (targetCity.playerId === player.id) {
      return { success: false, error: 'CANNOT_SPY_SELF' }
    }

    // Check for available spies
    const [spyUnit] = await db
      .select()
      .from(units)
      .where(and(eq(units.cityId, data.originCityId), eq(units.type, 'spy')))
      .limit(1)

    if (!spyUnit || spyUnit.count < 1) {
      return { success: false, error: 'NO_SPIES' }
    }

    // Get world speed
    const [world] = await db
      .select()
      .from(worlds)
      .where(eq(worlds.id, player.worldId))
      .limit(1)

    const worldSpeed = getWorldSpeedMultiplier(world?.speed ?? 'standard')
    const duration = getMissionDuration(data.missionType, worldSpeed)
    const now = new Date()
    const arrivalAt = new Date(now.getTime() + duration * 1000)

    // Deduct spy and create mission
    const result = await db.transaction(async (tx) => {
      await tx
        .update(units)
        .set({ count: spyUnit.count - 1, updatedAt: now })
        .where(eq(units.id, spyUnit.id))

      const [mission] = await tx
        .insert(spyMissions)
        .values({
          senderPlayerId: player.id,
          targetCityId: data.targetCityId,
          missionType: data.missionType,
          status: 'in_progress',
          departureAt: now,
          arrivalAt,
        })
        .returning()

      return mission
    })

    return { success: true, missionId: result.id, arrivalAt: arrivalAt.toISOString() }
  })

export const getSpyMissions = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ playerId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const missions = await db
      .select({
        id: spyMissions.id,
        senderPlayerId: spyMissions.senderPlayerId,
        targetCityId: spyMissions.targetCityId,
        missionType: spyMissions.missionType,
        status: spyMissions.status,
        departureAt: spyMissions.departureAt,
        arrivalAt: spyMissions.arrivalAt,
        createdAt: spyMissions.createdAt,
      })
      .from(spyMissions)
      .where(eq(spyMissions.senderPlayerId, data.playerId))

    return missions
  })
