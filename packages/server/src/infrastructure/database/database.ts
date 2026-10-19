import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

/*
 * Queries go through the query builder only. Drizzle's relational query API
 * (`db.query`) changes with Drizzle 1.0, so it is left out until then and the
 * database is typed without a schema.
 */
export type Database = NodePgDatabase;
