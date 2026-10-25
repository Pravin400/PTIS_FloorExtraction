import { ULBConfiguration } from '@/components/modules/configuration-settings/ulb-configuration';
import { getUlbConfigurationPageDataAction } from '@/app/[locale]/configuration-settings/ulb-configuration/actions';
import { getTranslations } from 'next-intl/server';
import { getCleanErrorMessage } from '@/lib/utils/backend-error-detection';
import { PageProps } from '@/types/ulbconfig-master.types';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'ULB Configuration | NTIS',
  description: 'Configure ULB details, project information, and department-wise licensing',
};

export default async function ULBConfigurationPage({ params }: PageProps) {
  await params;

  const t = await getTranslations('ulb_configuration');
  let fetchError: string | undefined;
  let statusCode: number | undefined;

  const pageDataRes = await getUlbConfigurationPageDataAction();

  if (!pageDataRes.success) {
    const errorKey = pageDataRes.error;
    fetchError =
      errorKey?.startsWith('messages.') || errorKey?.startsWith('validation.')
        ? t(errorKey)
        : getCleanErrorMessage(errorKey, t('messages.fetchError'));
    statusCode = pageDataRes.statusCode;
  }

  const pageData = pageDataRes.data ?? {
    ulb: null,
    departments: [],
    licences: [],
    images: [],
  };

  return (
    <ULBConfiguration
      initialUlbData={pageData.ulb}
      initialDeptData={pageData.departments}
      initialLicenceData={pageData.licences}
      initialImagesData={pageData.images}
      fetchError={fetchError}
      statusCode={statusCode}
    />
  );
}
