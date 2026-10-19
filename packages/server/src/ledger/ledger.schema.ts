import { sql } from 'drizzle-orm';
import {
  bigint,
  check,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { users } from '../users/index.js';

export const ledgerReason = pgEnum('ledger_reason', [
  'signup_bonus',
  'bet',
  'backbet',
  'payout',
  'refund',
  'daily',
  'rebuy',
  'admin_adjust',
]);

export type LedgerReason = (typeof ledgerReason.enumValues)[number];

/** Every change of a balance, never updated or deleted. */
export const ledger = pgTable(
  'ledger',
  {
    id: uuid()
      .primaryKey()
      .default(sql`uuidv7()`),
    userId: uuid()
      .notNull()
      .references(() => users.id),
    delta: bigint({ mode: 'number' }).notNull(),
    balanceAfter: bigint({ mode: 'number' }).notNull(),
    reason: ledgerReason().notNull(),
    /** What the booking belongs to, such as a round, a table or an admin. */
    ref: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('ledger_user_id_created_at_index').on(table.userId, table.createdAt),
    check('ledger_delta_not_zero', sql`${table.delta} <> 0`),
  ],
);
