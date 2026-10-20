import type messages from '../../messages/de.json';
import type englishMessages from '../../messages/en.json';
import type { routing } from './routing';

export type Messages = typeof messages;

/*
 * Types the locales and message keys for next-intl, so a missing or
 * misspelled key fails the typecheck. German is the reference.
 */
declare module 'next-intl' {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: Messages;
  }
}

type Mirrors<TTranslation extends TReference, TReference> = TTranslation;

/** Fails the typecheck when the English messages lack a German key. */
export type EnglishMessages = Mirrors<typeof englishMessages, Messages>;
