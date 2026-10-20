import 'server-only';

import { z } from 'zod';

const envSchema = z.object({
  /** Where the web server reaches the game server; browsers never see it. */
  SERVER_URL: z.url(),
  /** Encrypts the session cookie; read by next-auth itself. */
  AUTH_SECRET: z.string().min(32),
});

export type Env = z.infer<typeof envSchema>;

let env: Env | undefined;

/**
 * Parsed on first use instead of on import, because `next build` imports
 * server modules without the deployment's environment. `instrumentation.ts`
 * calls it at startup, so invalid config still stops the boot.
 */
export function serverEnv(): Env {
  env ??= envSchema.parse(process.env);

  return env;
}
