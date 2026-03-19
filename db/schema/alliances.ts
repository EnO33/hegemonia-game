import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  pgEnum,
  timestamp,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core'
import { worlds } from './worlds'
import { players } from './players'

export const alliances = pgTable(
  'alliances',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    worldId: uuid('world_id')
      .notNull()
      .references(() => worlds.id),
    name: varchar('name', { length: 100 }).notNull(),
    tag: varchar('tag', { length: 5 }).notNull(),
    description: text('description'),
    points: integer('points').notNull().default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('idx_alliances_world_tag').on(table.worldId, table.tag),
    index('idx_alliances_world_id').on(table.worldId),
  ],
)

export const allianceRoleEnum = pgEnum('alliance_role', [
  'founder',
  'leader',
  'officer',
  'member',
])

export const allianceMembers = pgTable(
  'alliance_members',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    allianceId: uuid('alliance_id')
      .notNull()
      .references(() => alliances.id),
    playerId: uuid('player_id')
      .notNull()
      .references(() => players.id),
    role: allianceRoleEnum('role').notNull().default('member'),
    joinedAt: timestamp('joined_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('idx_alliance_members_player').on(table.playerId),
    index('idx_alliance_members_alliance_id').on(table.allianceId),
  ],
)

export const diplomacyTypeEnum = pgEnum('diplomacy_type', ['nap', 'trade', 'alliance', 'war'])
export const diplomacyStatusEnum = pgEnum('diplomacy_status', [
  'pending',
  'active',
  'rejected',
  'cancelled',
])

export const allianceDiplomacy = pgTable(
  'alliance_diplomacy',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    allianceId: uuid('alliance_id')
      .notNull()
      .references(() => alliances.id),
    targetAllianceId: uuid('target_alliance_id')
      .notNull()
      .references(() => alliances.id),
    type: diplomacyTypeEnum('type').notNull(),
    status: diplomacyStatusEnum('status').notNull().default('pending'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('idx_diplomacy_unique').on(table.allianceId, table.targetAllianceId, table.type),
    index('idx_diplomacy_alliance_id').on(table.allianceId),
  ],
)

export type Alliance = typeof alliances.$inferSelect
export type NewAlliance = typeof alliances.$inferInsert
export type AllianceMember = typeof allianceMembers.$inferSelect
export type AllianceDiplomacy = typeof allianceDiplomacy.$inferSelect
