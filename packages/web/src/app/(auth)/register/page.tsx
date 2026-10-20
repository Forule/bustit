import type { Metadata } from 'next';
import { Link } from '@/components/atoms/Link';
import { AuthFormCard } from '@/components/molecules/AuthFormCard';
import { RegisterForm } from '@/components/organisms/RegisterForm';

export const metadata: Metadata = {
  title: 'Registrieren',
};

export default function RegisterPage() {
  return (
    <AuthFormCard
      title="Konto erstellen"
      description="Die Registrierung ist nur mit Einladung möglich."
      footer={
        <>
          Schon dabei? <Link href="/login">Anmelden</Link>
        </>
      }
    >
      <RegisterForm />
    </AuthFormCard>
  );
}
