import { pgTable, uuid, varchar, pgEnum, timestamp } from 'drizzle-orm/pg-core'

export const worldSpeedEnum = pgEnum('world_speed', ['standard', 'speed', 'casual'])
export const worldStatusEnum = pgEnum('world_status', ['open', 'active', 'ended'])
export const victoryTypeEnum = pgEnum('victory_type', ['dominance', 'wonder', 'points'])

export const worlds = pgTable('worlds', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  speed: worldSpeedEnum('speed').notNull().default('standard'),
  status: worldStatusEnum('status').notNull().default('open'),
  victoryType: victoryTypeEnum('victory_type').notNull().default('dominance'),
  startedAt: timestamp('started_at'),
  endedAt: timestamp('ended_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export type World = typeof worlds.$inferSelect
export type NewWorld = typeof worlds.$inferInsert
