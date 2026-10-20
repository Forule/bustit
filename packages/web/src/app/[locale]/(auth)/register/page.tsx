import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/components/atoms/Link';
import { AuthFormCard } from '@/components/molecules/AuthFormCard';
import { RegisterForm } from '@/components/organisms/RegisterForm';
import { AuthTemplate } from '@/components/templates/AuthTemplate';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pages.register.seo');

  return { title: t('title') };
}

export default async function RegisterPage() {
  const t = await getTranslations('pages.register');

  return (
    <AuthTemplate backgroundSrc="/images/register.webp">
      <AuthFormCard
        title={t('title')}
        description={t('description')}
        footer={
          <>
            {t('hasAccount')} <Link href="/login">{t('toLogin')}</Link>
          </>
        }
      >
        <RegisterForm />
      </AuthFormCard>
    </AuthTemplate>
  );
}
