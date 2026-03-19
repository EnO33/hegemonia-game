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
import { cities } from './cities'

export const buildingTypeEnum = pgEnum('building_type', [
  'farm',
  'lumber_mill',
  'quarry',
  'market',
  'barracks',
  'stable',
  'siege_workshop',
  'harbor',
  'wall',
  'senate',
  'academy',
  'warehouse',
  'tavern',
  'temple',
])

export const buildings = pgTable(
  'buildings',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    cityId: uuid('city_id')
      .notNull()
      .references(() => cities.id),
    type: buildingTypeEnum('type').notNull(),
    level: integer('level').notNull().default(0),
    isUpgrading: boolean('is_upgrading').notNull().default(false),
    upgradeStartedAt: timestamp('upgrade_started_at'),
    upgradeEndsAt: timestamp('upgrade_ends_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('idx_buildings_city_type').on(table.cityId, table.type),
    index('idx_buildings_city_id').on(table.cityId),
  ],
)

export type Building = typeof buildings.$inferSelect
export type NewBuilding = typeof buildings.$inferInsert
