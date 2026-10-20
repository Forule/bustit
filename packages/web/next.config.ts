import path from 'node:path';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const isStandalone = process.env.NEXT_OUTPUT_MODE === 'standalone';
const isDevelopment = process.env.NODE_ENV === 'development';
const monorepoRoot = path.join(import.meta.dirname, '..', '..');

const nextConfig: NextConfig = {
  output: isStandalone ? 'standalone' : undefined,
  // Workspace packages live outside this directory; without pointing tracing
  // at the monorepo root, the standalone output misses them.
  outputFileTracingRoot: monorepoRoot,
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    root: monorepoRoot,
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
  /*
   * In production the reverse proxy routes /api to the server on the same
   * origin. Locally both run on separate ports, so the dev server forwards
   * instead, which keeps the client code free of a configurable API base URL.
   */
  async rewrites() {
    if (!isDevelopment) {
      return [];
    }

    const serverUrl = process.env.SERVER_URL ?? 'http://localhost:8080';

    return [{ source: '/api/:path*', destination: `${serverUrl}/api/:path*` }];
  },
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
