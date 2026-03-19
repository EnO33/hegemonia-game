import { pgTable, uuid, integer, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core'
import { worlds } from './worlds'

export const players = pgTable(
  'players',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull(),
    worldId: uuid('world_id')
      .notNull()
      .references(() => worlds.id),
    points: integer('points').notNull().default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('idx_players_user_world').on(table.userId, table.worldId),
    index('idx_players_world_id').on(table.worldId),
    index('idx_players_user_id').on(table.userId),
  ],
)

export type Player = typeof players.$inferSelect
export type NewPlayer = typeof players.$inferInsert
