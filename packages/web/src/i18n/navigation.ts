import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

/** Next.js' navigation APIs, with the current locale in every path. */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
