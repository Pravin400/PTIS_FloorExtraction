import { setRequestLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ApiError } from '@/lib/utils/api';
import WingForm from '@/components/modules/property-tax/ptis/QuickDataEntry/wing/WingForm';
import {
  getSocietyDetailsByPropertyAction,
  getAllActiveWingsAction,
} from './action';
import { getApartmentQcTopSectionAction } from '@/lib/api/ptis/apartment/apartment-qc-top-section.actions';
import { SocietyDetailItem } from '@/types/zone-master/properties/societyDetails.types';
import { WingItem } from '@/types/zone-master/properties/wing.types';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    propertyId: string;
    locale: string;
  }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function WingPage({ params, searchParams }: PageProps): Promise<React.JSX.Element> {
  const { locale, propertyId } = await params;
  const search = await searchParams;
  setRequestLocale(locale);

  const pid = Number(propertyId);
  if (isNaN(pid) || pid <= 0) {
    notFound();
  }

  const rawWingId = search?.wingDetailId || search?.wingId;
  const initialWingDetailId = rawWingId ? Number(rawWingId) : null;
  const initialSocietyDetailId = search?.societyDetailId ? Number(search.societyDetailId) : null;

  let societyWings: SocietyDetailItem[] = [];
  let wingMaster: WingItem[] = [];

  try {
    const [topSectionRes, societyRes, masterRes] = await Promise.all([
      getApartmentQcTopSectionAction(pid).catch(() => null),
      getSocietyDetailsByPropertyAction(pid).catch(() => null),
      getAllActiveWingsAction().catch(() => null),
    ]);

    // Populate wing data from Tab Section API (/ApartmentQC/top-section)
    const rawPropInfo = topSectionRes?.rawDto as { propertyInfo?: { wings?: Array<{ wingDetailId?: number; wingMasterId?: number; wingNo?: string; wingName?: string; secretaryName?: string; managerName?: string; secretaryNameEnglish?: string; managerNameEnglish?: string; secretaryMobileNo?: string; managerMobileNo?: string; secretaryEmailId?: string; managerEmailId?: string; }> } } | undefined;
    const topSectionWings = rawPropInfo?.propertyInfo?.wings || (topSectionRes?.data as { wings?: Array<{ wingDetailId?: number; wingMasterId?: number; wingNo?: string; wingName?: string; secretaryName?: string; managerName?: string; secretaryNameEnglish?: string; managerNameEnglish?: string; secretaryMobileNo?: string; managerMobileNo?: string; secretaryEmailId?: string; managerEmailId?: string; }> } | undefined)?.wings;

    if (topSectionWings && topSectionWings.length > 0) {
      societyWings = topSectionWings.map((w, idx: number) => ({
        id: w.wingDetailId ?? (idx + 1),
        propertyId: pid,
        wingId: w.wingMasterId ?? (w.wingDetailId ?? (idx + 1)),
        wingNo: w.wingNo ?? undefined,
        wingName: w.wingName || w.wingNo || `Wing ${idx + 1}`,
        societyName: '',
        societyAddress: '',
        secretaryName: w.secretaryName || '',
        managerName: w.managerName || '',
        landOwnerName: '',
        builderName: '',
        secretaryNameEnglish: w.secretaryNameEnglish || '',
        societyNameEnglish: '',
        societyAddressEnglish: '',
        managerNameEnglish: w.managerNameEnglish || '',
        landOwnerNameEnglish: '',
        builderNameEnglish: '',
        managerMobileNo: w.managerMobileNo || '',
        secretaryMobileNo: w.secretaryMobileNo || '',
        societyEmailId: '',
        secretaryEmailId: w.secretaryEmailId || '',
        managerEmailId: w.managerEmailId || '',
        markedForDeletion: false,
        isActive: true,
        createdDate: '',
        updatedDate: null,
      }));
    } else if (societyRes?.success && societyRes.data) {
      societyWings = societyRes.data;
    }

    if (masterRes?.success && masterRes.data) {
      wingMaster = masterRes.data;
    }
  } catch (error: unknown) {
    const t = await getTranslations({ locale, namespace: 'quickDataEntry' });

    if (error instanceof ApiError) {
      if (error.statusCode === 401) {
        throw new Error(t('wing.errors.unauthorized'));
      } else if (error.statusCode === 403) {
        throw new Error(t('wing.errors.forbidden'));
      } else if (error.statusCode === 404) {
        throw new Error(t('wing.errors.notFound'));
      } else if (error.statusCode >= 500) {
        throw new Error(t('wing.errors.serverError'));
      } else {
        throw new Error(error.contextMessage || t('wing.errors.fetchFailed'));
      }
    }

    const msg = error instanceof Error ? error.message.toLowerCase() : '';
    if (
      msg.includes('fetch failed') ||
      msg.includes('failed to fetch') ||
      msg.includes('network error') ||
      msg.includes('econnrefused')
    ) {
      throw new Error(t('wing.errors.failedToConnect.description'));
    }
    throw error;
  }

  return (
    <WingForm
      propertyId={pid}
      locale={locale}
      initialWingDetailId={initialWingDetailId}
      initialSocietyDetailId={initialSocietyDetailId}
      societyWings={societyWings}
      wingMaster={wingMaster}
    />
  );
}
