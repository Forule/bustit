import Image from 'next/image';

interface AuthTemplateProps {
  /** Full-screen background image, e.g. `/images/login.webp`. */
  backgroundSrc: string;
  children: React.ReactNode;
}

/**
 * Plain frame for the pages before login: a centered card on a full-screen
 * scene, without navigation, footer or branding.
 */
export function AuthTemplate({ backgroundSrc, children }: AuthTemplateProps) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-black">
      <Image
        src={backgroundSrc}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />

      <main className="relative z-10 flex grow items-center justify-center px-4 py-10 sm:px-6">
        {children}
      </main>
    </div>
  );
}
