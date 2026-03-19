import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../db'
import { buildings, cities, players, worlds, buildingTypeEnum } from '../../db/schema'
import { auth } from '~/lib/auth'
import {
  getUpgradeCost,
  getConstructionTime,
  canAffordUpgrade,
  getBuildingConfig,
  getWorldSpeedMultiplier,
} from '~/lib/buildings'
import {
  calculateProductionRates,
  calculateCurrentResources,
  getStorageCap,
} from '~/lib/resources'
import { islands, research } from '../../db/schema'

type UpgradeError =
  | 'UNAUTHORIZED'
  | 'CITY_NOT_FOUND'
  | 'BUILDING_NOT_FOUND'
  | 'MAX_LEVEL'
  | 'ALREADY_UPGRADING'
  | 'INSUFFICIENT_RESOURCES'

type UpgradeResult =
  | { success: true; endsAt: string }
  | { success: false; error: UpgradeError }

const upgradeBuildingSchema = z.object({
  cityId: z.string().uuid(),
  buildingType: z.enum(buildingTypeEnum.enumValues),
})

export const upgradeBuilding = createServerFn({ method: 'POST' })
  .inputValidator(upgradeBuildingSchema)
  .handler(async ({ data }): Promise<UpgradeResult> => {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })

    if (!session) {
      return { success: false, error: 'UNAUTHORIZED' }
    }

    // Load city and verify ownership
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

    // Load building
    const [building] = await db
      .select()
      .from(buildings)
      .where(and(eq(buildings.cityId, data.cityId), eq(buildings.type, data.buildingType)))
      .limit(1)

    if (!building) {
      return { success: false, error: 'BUILDING_NOT_FOUND' }
    }

    // Check not already upgrading any building in this city
    const upgradingBuildings = await db
      .select({ id: buildings.id })
      .from(buildings)
      .where(and(eq(buildings.cityId, data.cityId), eq(buildings.isUpgrading, true)))
      .limit(1)

    if (upgradingBuildings.length > 0) {
      return { success: false, error: 'ALREADY_UPGRADING' }
    }

    // Check max level
    const config = getBuildingConfig(building.type)
    if (!config || building.level >= config.maxLevel) {
      return { success: false, error: 'MAX_LEVEL' }
    }

    // Calculate current resources
    const allBuildings = await db
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

    const warehouseBuilding = allBuildings.find((b) => b.type === 'warehouse')
    const storageCap = getStorageCap(warehouseBuilding?.level ?? 0)

    const productionRates = island
      ? calculateProductionRates(allBuildings, island, playerResearch)
      : { food: 0, wood: 0, stone: 0, gold: 0 }

    const currentResources = calculateCurrentResources(city, productionRates, storageCap)

    // Check cost
    const cost = getUpgradeCost(building.type, building.level)
    if (!cost) {
      return { success: false, error: 'MAX_LEVEL' }
    }

    if (!canAffordUpgrade(currentResources, cost)) {
      return { success: false, error: 'INSUFFICIENT_RESOURCES' }
    }

    // Get world speed
    const [world] = await db
      .select()
      .from(worlds)
      .where(eq(worlds.id, player.worldId))
      .limit(1)

    const worldSpeed = getWorldSpeedMultiplier(world?.speed ?? 'standard')
    const senateBuilding = allBuildings.find((b) => b.type === 'senate')
    const constructionTime = getConstructionTime(
      building.type,
      building.level,
      senateBuilding?.level ?? 0,
      worldSpeed,
    )

    if (constructionTime === null) {
      return { success: false, error: 'MAX_LEVEL' }
    }

    const now = new Date()
    const endsAt = new Date(now.getTime() + constructionTime * 1000)

    // Deduct resources and start upgrade in a transaction
    await db.transaction(async (tx) => {
      // Snapshot resources with deduction
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

      // Start upgrade
      await tx
        .update(buildings)
        .set({
          isUpgrading: true,
          upgradeStartedAt: now,
          upgradeEndsAt: endsAt,
          updatedAt: now,
        })
        .where(eq(buildings.id, building.id))
    })

    return { success: true, endsAt: endsAt.toISOString() }
  })
