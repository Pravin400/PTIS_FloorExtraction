import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { AUTH_COOKIES } from '@/components/modules/login/constants';
import { getUserIdFromCookies } from '@/lib/utils/cookie';
import { OrganisationMasterNav } from '@/components/modules/payroll/MasterModule/OrganizationMaster/OrganisationMasterNav';

export default async function OrganisationMastersLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}): Promise<React.ReactElement> {
  const { locale } = await params;
  setRequestLocale(locale);
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIES.AUTH_TOKEN)?.value;
  const userId = getUserIdFromCookies(cookieStore);

  if (!token || userId == null) {
    redirect(`/${locale}/login`);
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-slate-50/50 p-2 sm:p-4 gap-3 w-full">
      <div className="flex flex-col lg:flex-row items-stretch gap-3 flex-1 min-h-0 w-full">
        <OrganisationMasterNav locale={locale} />
        <div className="flex-1 min-w-0 w-full">{children}</div>
      </div>
    </div>
  );
}
