import { ApiError } from '@/lib/utils/api';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import SocietyForm from '@/components/modules/property-tax/ptis/QuickDataEntry/society/SocietyForm';
import { getPropertySocietyDetailsAction } from './action';
import { WingItem } from '@/types/property-basic-details.types';
import { getWingMasterAction } from '../Property/action';
import { getApartmentQcTopSectionAction } from '@/lib/api/ptis/apartment/apartment-qc-top-section.actions';
import type { PropertyMasterData } from '@/types/property-tax/apartment';

interface PageProps {
  params: Promise<{
    propertyId: string;
    locale: string;
  }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SocietyFormPage({ params }: PageProps) {
  const { locale, propertyId } = await params;
  setRequestLocale(locale);

  const pid = Number(propertyId);

  if (isNaN(pid)) {
    throw new Error('Invalid Property Id');
  }

  let propertySocietyDetails = null;
  let wingMasterList: WingItem[] = [];
  let propertyMasterData: PropertyMasterData | null = null;

  try {
    const [propertySocietyRes, wingMasterRes, topSectionRes] = await Promise.all([
      getPropertySocietyDetailsAction(pid).catch(() => ({ success: false, data: null, error: null })),
      getWingMasterAction(1, -1).catch(() => ({ success: false, data: [], error: null })),
      getApartmentQcTopSectionAction(pid).catch(() => ({ success: false, data: undefined, error: null })),
    ]);

    propertySocietyDetails = propertySocietyRes?.data ?? null;
    wingMasterList = wingMasterRes?.data || [];
    propertyMasterData = topSectionRes?.data || null;
  } catch (error: unknown) {
    const t = await getTranslations({ locale, namespace: 'quickDataEntry' });

    if (error instanceof ApiError) {
      if (error.statusCode === 401) {
        throw new Error(t('society.errors.unauthorized'));
      } else if (error.statusCode === 403) {
        throw new Error(t('society.errors.forbidden'));
      } else if (error.statusCode === 404) {
        throw new Error(t('society.errors.notFound'));
      } else if (error.statusCode >= 500) {
        throw new Error(t('society.errors.serverError'));
      } else {
        throw new Error(error.contextMessage || t('society.errors.defaultApiError', { message: error.message }));
      }
    }

    const msg = error instanceof Error ? error.message.toLowerCase() : "";
    if (msg.includes('unauthorized') || msg.includes('token expired') || msg.includes('token is expired')) {
      throw new Error(t('society.errors.unauthorized'));
    }
    if (msg.includes('forbidden')) {
      throw new Error(t('society.errors.forbidden'));
    }
    if (msg.includes('not found')) {
      throw new Error(t('society.errors.notFound'));
    }
    if (msg.includes('fetch failed') || msg.includes('failed to fetch') || msg.includes('network error') || msg.includes('econnrefused')) {
      throw new Error(t('society.errors.failedToConnect.description'));
    }
    throw error;
  }

  return (
    <SocietyForm
      societyData={propertySocietyDetails}
      propertyIdSearch={Number(propertyId)}
      locale={locale}
      WingMaster={wingMasterList}
      propertyMasterData={propertyMasterData}
    />
  );
}
