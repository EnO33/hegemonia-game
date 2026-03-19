import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../db'
import { worlds, players } from '../../db/schema'
import { auth } from '~/lib/auth'

export const getWorlds = createServerFn({ method: 'GET' }).handler(async () => {
  return await db
    .select()
    .from(worlds)
    .where(eq(worlds.status, 'open'))
    .orderBy(worlds.createdAt)
})

const joinWorldSchema = z.object({
  worldId: z.string().uuid(),
})

export const joinWorld = createServerFn({ method: 'POST' })
  .inputValidator(joinWorldSchema)
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })

    if (!session) {
      return { success: false as const, error: 'UNAUTHORIZED' }
    }

    const existing = await db
      .select()
      .from(players)
      .where(eq(players.worldId, data.worldId))
      .limit(1)

    const alreadyJoined = existing.find((p) => p.userId === session.user.id)
    if (alreadyJoined) {
      return { success: true as const, playerId: alreadyJoined.id }
    }

    const [player] = await db
      .insert(players)
      .values({
        userId: session.user.id,
        worldId: data.worldId,
      })
      .returning()

    return { success: true as const, playerId: player.id }
  })
