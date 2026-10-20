import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

/** Sends requests without a locale to the right one, e.g. `/login` to `/de/login`. */
export const proxy = createMiddleware(routing);

export const config = {
  /*
   * Skips the API, which the dev server forwards to the game server, Next.js'
   * own files and static files.
   */
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
