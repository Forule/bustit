import { getRequestConfig } from 'next-intl/server';
import { currentLocale } from './locale';
import type { Messages } from './types';

export default getRequestConfig(async () => {
  const locale = await currentLocale();

  return {
    locale,
    messages: (
      (await import(`../../messages/${locale}.json`)) as { default: Messages }
    ).default,
  };
});
