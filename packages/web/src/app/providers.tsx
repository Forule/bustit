'use client';

import { useRouter } from 'next/navigation';
import { RouterProvider } from 'react-aria-components';

declare module 'react-aria-components' {
  interface RouterConfig {
    routerOptions: NonNullable<
      Parameters<ReturnType<typeof useRouter>['push']>[1]
    >;
  }
}

/**
 * Lets react-aria links and buttons with an `href` navigate through the
 * Next.js router instead of reloading the page.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <RouterProvider navigate={(href, options) => router.push(href, options)}>
      {children}
    </RouterProvider>
  );
}
