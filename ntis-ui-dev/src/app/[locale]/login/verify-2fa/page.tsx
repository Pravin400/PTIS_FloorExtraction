import { setRequestLocale } from 'next-intl/server';
import { Card, CardContent, CardHeader, LanguageDropdown } from '@/components/common';
import { UlbBrandingHeader } from '@/components/modules/login/UlbBrandingHeader';

import type { LoginPageProps } from '@/types/login.types';
import { resolvePendingTwoFactorOrRedirect, fetchLoginBrandingAction } from '@/app/[locale]/login/actions';
import { VerifyTwoFactorFormClient } from '@/components/modules/login/VerifyTwoFactorFormClient';

export default async function VerifyTwoFactorPage({ params }: Pick<LoginPageProps, 'params'>) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Redirects to /login if there is no pending challenge (expired, already used, or a direct hit).
  const { username, method } = await resolvePendingTwoFactorOrRedirect(locale);
  const { ulbData } = await fetchLoginBrandingAction();

  const backgroundSrc = ulbData?.ulbBackground || '';
  const backgroundStyle = backgroundSrc
    ? { backgroundImage: `url(${backgroundSrc})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : {};

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-br from-slate-100 via-cyan-100 to-blue-100 transition-all duration-500"
      style={backgroundStyle}
    >
      <div className="absolute top-4 right-4 z-50">
        <LanguageDropdown />
      </div>
      <div className="flex min-h-full w-full flex-col items-center justify-center p-4 md:p-6">
        <div className="w-full max-w-md">
          <Card className="overflow-hidden rounded-2xl border border-white/40 bg-white/80 shadow-2xl backdrop-blur-md transition-all duration-500 ease-in-out">
            <CardHeader className="flex flex-col items-center space-y-1 pb-2 pt-6 sm:pt-8 text-center">
              <UlbBrandingHeader ulbData={ulbData} />
            </CardHeader>
            <CardContent className="space-y-4 px-6 pb-10 pt-2 sm:px-8">
              <VerifyTwoFactorFormClient locale={locale} method={method} username={username} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
