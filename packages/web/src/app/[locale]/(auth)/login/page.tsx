import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/components/atoms/Link';
import { AuthFormCard } from '@/components/molecules/AuthFormCard';
import { LoginForm } from '@/components/organisms/LoginForm';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pages.login.seo');

  return { title: t('title') };
}

export default async function LoginPage() {
  const t = await getTranslations('pages.login');

  return (
    <AuthFormCard
      title={t('title')}
      description={t('description')}
      footer={
        <>
          {t('noAccount')} <Link href="/register">{t('toRegister')}</Link>
        </>
      }
    >
      <LoginForm />
    </AuthFormCard>
  );
}
