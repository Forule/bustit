/**
 * Plain frame for the pages before login: a centered card without navigation,
 * footer or branding.
 */
export function AuthTemplate({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-background">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -right-32 h-125 w-125 rounded-full bg-primary/15 blur-[120px]" />
        <div className="absolute -bottom-40 left-1/2 h-125 w-200 -translate-x-1/2 rounded-full bg-primary/10 blur-[140px]" />
      </div>

      <main className="relative z-10 flex grow items-center justify-center px-4 py-10 sm:px-6">
        {children}
      </main>
    </div>
  );
}
