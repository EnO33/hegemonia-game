import {
  pgTable,
  uuid,
  varchar,
  boolean,
  integer,
  decimal,
  timestamp,
  index,
} from 'drizzle-orm/pg-core'
import { players } from './players'
import { islands } from './islands'

export const cities = pgTable(
  'cities',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    playerId: uuid('player_id')
      .notNull()
      .references(() => players.id),
    islandId: uuid('island_id')
      .notNull()
      .references(() => islands.id),
    name: varchar('name', { length: 100 }).notNull(),
    isCapital: boolean('is_capital').notNull().default(false),
    morale: integer('morale').notNull().default(100),
    population: integer('population').notNull().default(100),
    populationCap: integer('population_cap').notNull().default(500),
    wallLevel: integer('wall_level').notNull().default(0),
    food: decimal('food', { precision: 12, scale: 2 }).notNull().default('0'),
    wood: decimal('wood', { precision: 12, scale: 2 }).notNull().default('0'),
    stone: decimal('stone', { precision: 12, scale: 2 }).notNull().default('0'),
    gold: decimal('gold', { precision: 12, scale: 2 }).notNull().default('0'),
    lastResourceSnapshotAt: timestamp('last_resource_snapshot_at').defaultNow().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_cities_player_id').on(table.playerId),
    index('idx_cities_island_id').on(table.islandId),
  ],
)

export type City = typeof cities.$inferSelect
export type NewCity = typeof cities.$inferInsert
