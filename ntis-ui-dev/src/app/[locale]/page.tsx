import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { locales, type Locale } from '@/i18n/config';

interface RootPageProps {
  params: Promise<{ locale: string }>;
}

export default async function LocaleRootPage({ params }: RootPageProps) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const cookieStore = await cookies();
  const authToken = cookieStore.get('auth_token')?.value;
  const refreshToken = cookieStore.get('refresh_token')?.value;

  if (authToken && refreshToken) {
    redirect(`/${locale}/home`);
  }

  redirect(`/${locale}/login`);
}
