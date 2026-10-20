import { getTranslations } from 'next-intl/server';

export async function Footer() {
  const t = await getTranslations('components.footer');

  return (
    <footer className="border-t border-border">
      <p className="mx-auto max-w-7xl px-4 py-6 text-center text-sm text-muted-foreground sm:px-6">
        {t('copyright')}
      </p>
    </footer>
  );
}
