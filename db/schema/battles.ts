import { pgTable, uuid, pgEnum, jsonb, timestamp, index } from 'drizzle-orm/pg-core'
import { worlds } from './worlds'
import { armies } from './armies'
import { players } from './players'
import { cities } from './cities'

export const battleTypeEnum = pgEnum('battle_type', ['attack', 'raid', 'naval'])
export const battleOutcomeEnum = pgEnum('battle_outcome', [
  'attacker_victory',
  'defender_victory',
  'draw',
])

export const battles = pgTable(
  'battles',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    worldId: uuid('world_id')
      .notNull()
      .references(() => worlds.id),
    armyId: uuid('army_id')
      .notNull()
      .references(() => armies.id),
    attackerPlayerId: uuid('attacker_player_id')
      .notNull()
      .references(() => players.id),
    defenderPlayerId: uuid('defender_player_id').references(() => players.id),
    cityId: uuid('city_id')
      .notNull()
      .references(() => cities.id),
    type: battleTypeEnum('type').notNull(),
    outcome: battleOutcomeEnum('outcome').notNull(),
    resourcesLooted: jsonb('resources_looted'),
    resolvedAt: timestamp('resolved_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_battles_world_id').on(table.worldId),
    index('idx_battles_attacker').on(table.attackerPlayerId),
    index('idx_battles_defender').on(table.defenderPlayerId),
    index('idx_battles_city_id').on(table.cityId),
  ],
)

export type Battle = typeof battles.$inferSelect
export type NewBattle = typeof battles.$inferInsert
