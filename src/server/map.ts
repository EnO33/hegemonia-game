import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../db'
import { islands, cities, players, worlds } from '../../db/schema'
import { auth } from '~/lib/auth'

export const getWorldMap = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ worldId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })

    if (!session) {
      return null
    }

    const [world] = await db
      .select()
      .from(worlds)
      .where(eq(worlds.id, data.worldId))
      .limit(1)

    if (!world) {
      return null
    }

    const worldIslands = await db
      .select({
        id: islands.id,
        x: islands.x,
        y: islands.y,
        terrainType: islands.terrainType,
        maxCities: islands.maxCities,
      })
      .from(islands)
      .where(eq(islands.worldId, data.worldId))

    const worldCities = await db
      .select({
        id: cities.id,
        name: cities.name,
        islandId: cities.islandId,
        playerId: cities.playerId,
      })
      .from(cities)
      .innerJoin(players, eq(cities.playerId, players.id))
      .where(eq(players.worldId, data.worldId))

    // Get current player
    const worldPlayers = await db
      .select({
        id: players.id,
        userId: players.userId,
      })
      .from(players)
      .where(eq(players.worldId, data.worldId))

    const currentPlayer = worldPlayers.find((p) => p.userId === session.user.id)

    // Build island data with cities
    const islandMap = worldIslands.map((island) => ({
      ...island,
      cities: worldCities.filter((c) => c.islandId === island.id),
    }))

    return {
      world,
      islands: islandMap,
      currentPlayerId: currentPlayer?.id ?? null,
    }
  })

export const getIslandDetails = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ islandId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const [island] = await db
      .select()
      .from(islands)
      .where(eq(islands.id, data.islandId))
      .limit(1)

    if (!island) {
      return null
    }

    const islandCities = await db
      .select({
        id: cities.id,
        name: cities.name,
        playerId: cities.playerId,
        isCapital: cities.isCapital,
      })
      .from(cities)
      .where(eq(cities.islandId, data.islandId))

    return {
      island,
      cities: islandCities,
      availableSlots: island.maxCities - islandCities.length,
    }
  })
