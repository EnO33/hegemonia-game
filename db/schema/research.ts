import {
  pgTable,
  uuid,
  pgEnum,
  integer,
  boolean,
  timestamp,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core'
import { players } from './players'
import { cities } from './cities'

export const researchTypeEnum = pgEnum('research_type', [
  'improved_farming',
  'advanced_mining',
  'trading_routes',
  'double_construction',
  'iron_swords',
  'hardened_shields',
  'cavalry_training',
  'advanced_siege',
  'shipbuilding',
  'naval_tactics',
  'troop_transport',
  'basic_espionage',
  'counter_intelligence',
  'advanced_intelligence',
  'efficient_administration',
  'city_planning',
  'colonization',
])

export const research = pgTable(
  'research',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    playerId: uuid('player_id')
      .notNull()
      .references(() => players.id),
    cityId: uuid('city_id')
      .notNull()
      .references(() => cities.id),
    type: researchTypeEnum('type').notNull(),
    level: integer('level').notNull().default(0),
    isResearching: boolean('is_researching').notNull().default(false),
    researchStartedAt: timestamp('research_started_at'),
    researchEndsAt: timestamp('research_ends_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('idx_research_player_type').on(table.playerId, table.type),
    index('idx_research_player_id').on(table.playerId),
  ],
)

export type Research = typeof research.$inferSelect
export type NewResearch = typeof research.$inferInsert
