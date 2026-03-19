import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core'
import { alliances } from './alliances'
import { players } from './players'

export const messages = pgTable(
  'messages',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    allianceId: uuid('alliance_id')
      .notNull()
      .references(() => alliances.id),
    senderId: uuid('sender_id')
      .notNull()
      .references(() => players.id),
    content: text('content').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('idx_messages_alliance_created').on(table.allianceId, table.createdAt)],
)

export type Message = typeof messages.$inferSelect
export type NewMessage = typeof messages.$inferInsert
