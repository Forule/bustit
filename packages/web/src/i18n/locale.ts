import { hasLocale, type Locale } from 'next-intl';
import { locale as rootLocale } from 'next/root-params';
import { notFound } from 'next/navigation';
import { routing } from './routing';

/**
 * The locale of the current route, from the `[locale]` segment above the root
 * layout. Unlike the `params` prop it needs no prop drilling and doesn't keep
 * navigations from rendering instantly. Unsupported locales answer with a 404.
 */
export async function currentLocale(): Promise<Locale> {
  const locale = await rootLocale();

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return locale;
}
