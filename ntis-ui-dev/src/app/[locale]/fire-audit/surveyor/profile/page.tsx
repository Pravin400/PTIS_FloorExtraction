import { setRequestLocale, getTranslations } from 'next-intl/server';
import { FireAuditRouteFrame } from '@/components/modules/fire-audit/shared/FireAuditRouteFrame';

export const dynamic = 'force-dynamic';

export default async function SurveyorProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('fireAuditSurveyor.sidebar');

  return (
    <div className="w-full flex-1 p-3 sm:p-4 lg:p-6 overflow-auto">
      <FireAuditRouteFrame
        title={t('profile')}
        purpose="Surveyor officer credentials, assigned ward jurisdiction, and device sync settings."
      />
    </div>
  );
}
