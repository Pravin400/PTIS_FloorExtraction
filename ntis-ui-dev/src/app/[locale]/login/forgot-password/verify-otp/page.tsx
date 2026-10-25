import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Card, CardContent, CardHeader, LanguageDropdown } from '@/components/common';
import { ShieldCheck } from 'lucide-react';

import type { LoginPageProps } from '@/types/login.types';
import { resolvePendingForgotPasswordOrRedirect } from '@/app/[locale]/login/forgot-password/actions';
import { VerifyForgotPasswordOtpFormClient } from '@/components/modules/login/VerifyForgotPasswordOtpFormClient';
import { UlbBrandingHeader } from '@/components/modules/login/UlbBrandingHeader';
import { getUlbConfigForLogin } from '@/lib/api/ulb-config.service';

export default async function VerifyForgotPasswordOtpPage({
  params,
}: Pick<LoginPageProps, 'params'>) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Redirects to the request step if there is no pending challenge (expired, already used, or a
  // direct hit).
  const { method } = await resolvePendingForgotPasswordOrRedirect(locale);

  const t = await getTranslations({ locale, namespace: 'login' });
  const ulbData = await getUlbConfigForLogin();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-br from-slate-100 via-cyan-100 to-blue-100 transition-all duration-500">
      <div className="absolute top-4 right-4 z-50">
        <LanguageDropdown />
      </div>
      <div className="flex min-h-full w-full flex-col items-center justify-center p-4 md:p-6">
        <div className="w-full max-w-md">
          <Card className="overflow-hidden rounded-2xl border border-white/40 bg-white/80 shadow-2xl backdrop-blur-md transition-all duration-500 ease-in-out">
            <CardHeader className="flex flex-col items-center space-y-1 pb-2 pt-8 text-center">
              <UlbBrandingHeader ulbData={ulbData} compact />
              <div
                className="mb-2 flex h-14 w-14 items-center justify-center rounded-full border border-cyan-200/60 bg-cyan-50/80 text-cyan-600 drop-shadow-lg"
                aria-hidden
              >
                <ShieldCheck className="h-7 w-7" strokeWidth={1.5} />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900">
                {t('resetPassword')}
              </h1>
            </CardHeader>
            <CardContent className="space-y-4 px-6 pb-10 pt-4 sm:px-8">
              <VerifyForgotPasswordOtpFormClient locale={locale} method={method} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
