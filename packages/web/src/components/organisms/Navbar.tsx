import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/components/atoms/Link';
import { LogoutButton } from '@/components/molecules/LogoutButton';

export async function Navbar() {
  const t = await getTranslations('components.navbar');

  return (
    <header className="border-b border-border bg-card backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label={t('home')} className="no-underline">
          <Image
            src="/images/logo.svg"
            alt=""
            width={40}
            height={40}
            priority
            className="size-10"
          />
        </Link>
        <LogoutButton />
      </nav>
    </header>
  );
}
