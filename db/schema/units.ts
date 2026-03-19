import {
  pgTable,
  uuid,
  pgEnum,
  integer,
  timestamp,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core'
import { cities } from './cities'

export const unitTypeEnum = pgEnum('unit_type', [
  'swordsman',
  'hoplite',
  'archer',
  'scout',
  'horseman',
  'cataphract',
  'battering_ram',
  'catapult',
  'trebuchet',
  'scout_ship',
  'warship',
  'transport',
  'fire_ship',
  'colonist',
  'spy',
])

export const units = pgTable(
  'units',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    cityId: uuid('city_id')
      .notNull()
      .references(() => cities.id),
    type: unitTypeEnum('type').notNull(),
    count: integer('count').notNull().default(0),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('idx_units_city_type').on(table.cityId, table.type),
    index('idx_units_city_id').on(table.cityId),
  ],
)

export const unitQueues = pgTable(
  'unit_queues',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    cityId: uuid('city_id')
      .notNull()
      .references(() => cities.id),
    unitType: unitTypeEnum('unit_type').notNull(),
    count: integer('count').notNull(),
    startedAt: timestamp('started_at').defaultNow().notNull(),
    endsAt: timestamp('ends_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_unit_queues_city_id').on(table.cityId),
    index('idx_unit_queues_ends_at').on(table.endsAt),
  ],
)

export type Unit = typeof units.$inferSelect
export type NewUnit = typeof units.$inferInsert
export type UnitQueue = typeof unitQueues.$inferSelect
export type NewUnitQueue = typeof unitQueues.$inferInsert
