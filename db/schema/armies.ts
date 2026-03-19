import { pgTable, uuid, pgEnum, integer, timestamp, index } from 'drizzle-orm/pg-core'
import { worlds } from './worlds'
import { players } from './players'
import { cities } from './cities'
import { unitTypeEnum } from './units'

export const armyTypeEnum = pgEnum('army_type', ['attack', 'raid', 'support', 'return', 'colony'])
export const armyStatusEnum = pgEnum('army_status', [
  'marching',
  'arrived',
  'returning',
  'cancelled',
])

export const armies = pgTable(
  'armies',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    worldId: uuid('world_id')
      .notNull()
      .references(() => worlds.id),
    ownerPlayerId: uuid('owner_player_id')
      .notNull()
      .references(() => players.id),
    originCityId: uuid('origin_city_id')
      .notNull()
      .references(() => cities.id),
    targetCityId: uuid('target_city_id')
      .notNull()
      .references(() => cities.id),
    type: armyTypeEnum('type').notNull(),
    status: armyStatusEnum('status').notNull().default('marching'),
    departureAt: timestamp('departure_at').defaultNow().notNull(),
    arrivalAt: timestamp('arrival_at').notNull(),
    returnAt: timestamp('return_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_armies_world_id').on(table.worldId),
    index('idx_armies_owner_player_id').on(table.ownerPlayerId),
    index('idx_armies_arrival_at').on(table.arrivalAt),
    index('idx_armies_target_city_id').on(table.targetCityId),
  ],
)

export const armyUnits = pgTable(
  'army_units',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    armyId: uuid('army_id')
      .notNull()
      .references(() => armies.id),
    type: unitTypeEnum('type').notNull(),
    count: integer('count').notNull(),
  },
  (table) => [index('idx_army_units_army_id').on(table.armyId)],
)

export type Army = typeof armies.$inferSelect
export type NewArmy = typeof armies.$inferInsert
export type ArmyUnit = typeof armyUnits.$inferSelect
