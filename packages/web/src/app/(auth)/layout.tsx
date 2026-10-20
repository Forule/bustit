import { AuthTemplate } from '@/components/templates/AuthTemplate';

export default function AuthLayout({ children }: LayoutProps<'/'>) {
  return <AuthTemplate>{children}</AuthTemplate>;
}
