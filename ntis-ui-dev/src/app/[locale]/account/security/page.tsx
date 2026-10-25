import { setRequestLocale } from 'next-intl/server';
import { PageContainer } from '@/components/common';
import { twoFactorService } from '@/lib/api/two-factor.service';
import { TwoFactorSettingsClient } from '@/components/modules/account-security/TwoFactorSettingsClient';
import { getTranslations } from 'next-intl/server';

export default async function AccountSecurityPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ required?: string }>;
}) {
  const { locale } = await params;
  const { required } = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'twoFactorSettings' });
  const statusRes = await twoFactorService.getStatus();

  return (
    <PageContainer title={t('pageTitle')} subtitle={t('pageSubtitle')} className="p-6">
      <TwoFactorSettingsClient
        locale={locale}
        adminRequired={required === '1'}
        initialStatus={
          statusRes.success && statusRes.data
            ? statusRes.data
            : { isEnabled: false, recoveryCodesRemaining: 0, hasAuthenticatorKey: false }
        }
      />
    </PageContainer>
  );
}
