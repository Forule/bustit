import { hasLocale } from 'next-intl';
import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/server/auth';
import { routing } from './i18n/routing';

const intlProxy = createMiddleware(routing);

/** Pages that can be opened without a session; all others need one. */
const PUBLIC_PATHS = new Set(['/login', '/register']);

/**
 * Sends requests without a locale to the right one, e.g. `/login` to
 * `/de/login`, and requests without a session to the login.
 */
export const proxy = auth((request) => {
  const response = intlProxy(request);
  const [, locale, ...segments] = request.nextUrl.pathname.split('/');

  // Without a locale next-intl redirects first, and the guard runs on the next request.
  if (!hasLocale(routing.locales, locale)) {
    return response;
  }

  const path = `/${segments.join('/')}`.replace(/\/$/, '') || '/';

  if (request.auth || PUBLIC_PATHS.has(path)) {
    return response;
  }

  // Not through `getPathname`, which imports `next/root-params` and only works in app/.
  return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
});

export const config = {
  /*
   * Skips the web app's own API routes, such as next-auth's, Next.js' own
   * files and static files.
   */
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
