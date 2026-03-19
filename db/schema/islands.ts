import { pgTable, uuid, integer, pgEnum, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core'
import { worlds } from './worlds'

export const terrainTypeEnum = pgEnum('terrain_type', [
  'standard',
  'fertile',
  'rocky',
  'coastal',
])

export const islands = pgTable(
  'islands',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    worldId: uuid('world_id')
      .notNull()
      .references(() => worlds.id),
    x: integer('x').notNull(),
    y: integer('y').notNull(),
    terrainType: terrainTypeEnum('terrain_type').notNull().default('standard'),
    foodBonus: integer('food_bonus').notNull().default(0),
    woodBonus: integer('wood_bonus').notNull().default(0),
    stoneBonus: integer('stone_bonus').notNull().default(0),
    maxCities: integer('max_cities').notNull().default(4),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('idx_islands_world_coords').on(table.worldId, table.x, table.y),
    index('idx_islands_world_id').on(table.worldId),
  ],
)

export type Island = typeof islands.$inferSelect
export type NewIsland = typeof islands.$inferInsert
