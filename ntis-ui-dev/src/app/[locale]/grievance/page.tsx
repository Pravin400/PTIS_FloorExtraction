import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AUTH_COOKIES } from '@/components/modules/login/constants';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function GrievanceRootPage({ params }: PageProps) {
  const { locale } = await params;
  const cookieStore = await cookies();
  const isCitizen = cookieStore.get('citizen_is_logged_in')?.value === 'true';
  const isAdmin =
    !isCitizen &&
    cookieStore.get(AUTH_COOKIES.IS_LOGGED_IN)?.value === 'true' &&
    !!(cookieStore.get(AUTH_COOKIES.AUTH_TOKEN)?.value || cookieStore.get(AUTH_COOKIES.USER_ID)?.value);

  if (isAdmin) {
    redirect(`/${locale}/grievance/complaints`);
  }

  redirect(`/${locale}/grievance/dashboard`);
}
