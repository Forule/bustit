import Image from 'next/image';

interface AuthFormCardProps {
  title: string;
  description: string;
  children: React.ReactNode;
  /** Shown below the form, e.g. a link to the other auth page. */
  footer?: React.ReactNode;
}

export function AuthFormCard({
  title,
  description,
  children,
  footer,
}: AuthFormCardProps) {
  return (
    // On wide screens AuthTemplate stretches it into a full-height side panel.
    <div className="flex w-full max-w-md flex-col gap-8 rounded-3xl border border-border bg-card p-8 shadow-2xl backdrop-blur-xl sm:p-10 xl:max-w-none xl:justify-center xl:rounded-none xl:border-y-0 xl:border-l-0 xl:px-12">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-4">
          {/* Decorative, so the alt text doesn't give the name away either. */}
          <Image
            src="/images/logo.svg"
            alt=""
            width={56}
            height={56}
            priority
            className="size-12 shrink-0 sm:size-14"
          />
          <h1 className="font-display text-4xl tracking-wide text-card-foreground sm:text-5xl">
            {title}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
      {footer && (
        <div className="border-t border-border pt-6 text-center text-sm text-muted-foreground">
          {footer}
        </div>
      )}
    </div>
  );
}
