import type { Metadata } from 'next';
import { Link } from '@/components/atoms/Link';
import { AuthFormCard } from '@/components/molecules/AuthFormCard';
import { LoginForm } from '@/components/organisms/LoginForm';

export const metadata: Metadata = {
  title: 'Anmelden',
};

export default function LoginPage() {
  return (
    <AuthFormCard
      title="Willkommen zurück"
      description="Melde dich mit deinem Konto an."
      footer={
        <>
          Noch kein Konto?{' '}
          <Link href="/register">Mit Einladung registrieren</Link>
        </>
      }
    >
      <LoginForm />
    </AuthFormCard>
  );
}
