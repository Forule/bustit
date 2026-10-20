import { AuthTemplate } from '@/components/templates/AuthTemplate';

export default function AuthLayout({ children }: LayoutProps<'/[locale]'>) {
  return <AuthTemplate>{children}</AuthTemplate>;
}
