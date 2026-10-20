import { Footer } from '@/components/organisms/Footer';
import { Navbar } from '@/components/organisms/Navbar';

interface MainTemplateProps {
  children?: React.ReactNode;
}

/** Frame for the pages behind the login: navigation, content and footer. */
export function MainTemplate({ children }: MainTemplateProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Navbar />
      <main className="mx-auto flex w-full max-w-7xl grow flex-col px-4 py-8 sm:px-6">
        {children}
      </main>
      <Footer />
    </div>
  );
}
