import { pgTable, uuid, pgEnum, jsonb, timestamp, index } from 'drizzle-orm/pg-core'
import { players } from './players'
import { cities } from './cities'

export const spyMissionTypeEnum = pgEnum('spy_mission_type', [
  'scout_resources',
  'scout_army',
  'scout_buildings',
  'full_report',
  'sabotage',
])

export const spyMissionStatusEnum = pgEnum('spy_mission_status', [
  'in_progress',
  'success',
  'detected',
])

export const spyMissions = pgTable(
  'spy_missions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    senderPlayerId: uuid('sender_player_id')
      .notNull()
      .references(() => players.id),
    targetCityId: uuid('target_city_id')
      .notNull()
      .references(() => cities.id),
    missionType: spyMissionTypeEnum('mission_type').notNull(),
    status: spyMissionStatusEnum('status').notNull().default('in_progress'),
    result: jsonb('result'),
    departureAt: timestamp('departure_at').defaultNow().notNull(),
    arrivalAt: timestamp('arrival_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_spy_missions_sender').on(table.senderPlayerId),
    index('idx_spy_missions_target').on(table.targetCityId),
    index('idx_spy_missions_arrival').on(table.arrivalAt),
  ],
)

export type SpyMission = typeof spyMissions.$inferSelect
export type NewSpyMission = typeof spyMissions.$inferInsert
