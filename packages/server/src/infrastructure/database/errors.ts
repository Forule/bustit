/**
 * Whether an error comes from inserting a value that violates the named
 * unique constraint. Drizzle wraps the driver's error, so the Postgres error
 * code is looked up on the cause as well.
 */
export function isUniqueViolation(error: unknown, constraint: string): boolean {
  for (let current = error; current instanceof Error; current = current.cause) {
    if (
      'code' in current &&
      current.code === '23505' &&
      'constraint' in current &&
      current.constraint === constraint
    ) {
      return true;
    }
  }

  return false;
}
