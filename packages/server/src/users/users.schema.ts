import { sql } from 'drizzle-orm';
import { bigint, check, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * Only what the ledger needs so far. Login and profile columns are added with
 * the features that use them.
 */
export const users = pgTable(
  'users',
  {
    id: uuid()
      .primaryKey()
      .default(sql`uuidv7()`),
    /**
     * Cache of the sum of the user's ledger entries. Only the ledger changes
     * it, in the same transaction as the entry.
     */
    balance: bigint({ mode: 'number' }).notNull().default(0),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [check('users_balance_not_negative', sql`${table.balance} >= 0`)],
);
