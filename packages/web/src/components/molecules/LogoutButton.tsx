'use client';

import { LogOut } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { logoutAction } from '@/actions/auth';
import { Button } from '@/components/atoms/Button';
import { useRouter } from '@/i18n/navigation';

export function LogoutButton() {
  const t = useTranslations('components.navbar');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const logout = () =>
    startTransition(async () => {
      await logoutAction();
      router.replace('/login');
    });

  return (
    <Button
      variant="icon"
      aria-label={t('logout')}
      onPress={logout}
      isPending={isPending}
    >
      <LogOut className="h-5 w-5" aria-hidden />
    </Button>
  );
}
