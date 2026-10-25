import { setRequestLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ApiError } from '@/lib/utils/api';
import KycFormView from '@/components/modules/property-tax/ptis/QuickDataEntry/kyc/KycFormView';
import { getOwnerTypes, getPropertyKycById } from '@/lib/api/property-kyc.service';
import { KycDetails } from '@/types/property-kyc.types';
import { OwnerTypeApiItem } from '@/types/property-basic-details.types';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    propertyId: string;
    locale: string;
  }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function KycFormPage({ params }: PageProps): Promise<React.JSX.Element> {
  const { locale, propertyId } = await params;
  setRequestLocale(locale);

  // Validate propertyId
  const propertyIdNum = Number(propertyId);
  if (!propertyIdNum || propertyIdNum <= 0) {
    notFound();
  }

  let ownerTypeList: OwnerTypeApiItem[] = [];
  let kycDetailsData: KycDetails | null = null;
  let primaryError: unknown = null;

  try {
    const [kycResponse, ownerTypes] = await Promise.all([
      getPropertyKycById(propertyIdNum),
      getOwnerTypes().catch(() => [] as OwnerTypeApiItem[]),
    ]);

    ownerTypeList = ownerTypes;

    if (kycResponse.items) {
      const adharCardNo = kycResponse.items.adharCardNo ?? kycResponse.items.aadharCardNo ?? null;
      kycDetailsData = {
        ...kycResponse.items,
        adharCardNo,
        aadharCardNo: adharCardNo, // Kept for backward compatibility only
      };
    }
  } catch (error: unknown) {
    primaryError = error;
  }

  if (!kycDetailsData) {
    // Fallback: try dedicated Individual property API
    try {
      const { fetchIndividualQcTopSection } = await import('@/lib/api/ptis/individual');
      const individualRes = await fetchIndividualQcTopSection(propertyIdNum);
      if (individualRes.success && individualRes.data) {
        const item = individualRes.data;

        let matchedOwnerTypeId: number | null = null;
        if (ownerTypeList.length === 0) {
          ownerTypeList = await getOwnerTypes().catch(() => [] as OwnerTypeApiItem[]);
        }
        if (item.ownerCategory) {
          const match = ownerTypeList.find(
            (ot) => ot.ownerType?.toLowerCase() === item.ownerCategory?.toLowerCase()
          );
          if (match) {
            matchedOwnerTypeId = match.id;
          }
        }

        kycDetailsData = {
          propertyId: propertyIdNum,
          ownerTypeId: matchedOwnerTypeId,
          ownerType: item.ownerCategory || null,
          adharCardNo: item.aadharNo || null,
          aadharCardNo: item.aadharNo || null,
          mobileNo: item.mobileNo || null,
          alternateMobileNo: item.alternateMobileNo || null,
          emailId: item.emailId || null,
          ownerTitle: item.ownerTitle || null,
          ownerName: item.ownerNameRegional || item.holderRegional || item.ownerName || item.propertyHolder || null,
          ownerNameRegional: item.ownerNameRegional || item.holderRegional || null,
          ownerTitleEnglish: item.ownerTitle || null,
          ownerNameEnglish: item.ownerNameEnglish || null,
          occupierTitle: null,
          occupierName: item.occupierNameRegional || item.occupierRegional || item.occupierName || null,
          occupierNameRegional: item.occupierNameRegional || item.occupierRegional || null,
          occupierTitleEnglish: null,
          occupierNameEnglish: item.occupierNameEnglish || null,
          flatOrShopName: item.shopNameRegional || item.flatOrShopName || item.shopName || null,
          flatOrShopNameEnglish: item.flatOrShopNameEnglish || null,
          flatOrShopNo: item.flatOrShopNo || null,
          flatOrShopNoEnglish: item.flatOrShopNo || null,
          address: item.addressRegional || item.address || null,
          addressRegional: item.addressRegional || null,
          location: null,
          addressEnglish: item.addressEnglish || null,
          locationEnglish: null,
          pinCode: item.pinCode || null,
        };
      }
    } catch (_e) {
      // ignore
    }
  }

  if (!kycDetailsData) {
    const t = await getTranslations({ locale, namespace: 'quickDataEntry' });

    if (primaryError instanceof ApiError) {
      if (primaryError.statusCode === 401) {
        throw new Error(t('kyc.errors.unauthorized'));
      } else if (primaryError.statusCode === 403) {
        throw new Error(t('kyc.errors.forbidden'));
      } else if (primaryError.statusCode === 404) {
        throw new Error(t('kyc.errors.notFound'));
      } else if (primaryError.statusCode >= 500) {
        throw new Error(t('kyc.errors.serverError'));
      } else {
        throw new Error(primaryError.contextMessage || t('kyc.errors.defaultApiError', { message: primaryError.message }));
      }
    }

    const msg = primaryError instanceof Error ? primaryError.message.toLowerCase() : "";
    if (msg.includes('fetch failed') || msg.includes('failed to fetch') || msg.includes('network error') || msg.includes('econnrefused')) {
      throw new Error(t('kyc.errors.failedToConnect.description'));
    }
    if (msg.includes('invalid property id')) {
      throw new Error(t('kyc.errors.invalidPropertyId'));
    }

    throw primaryError instanceof Error ? primaryError : new Error(t('kyc.errors.kycNotFound'));
  }

  return (
    <KycFormView
      KycDetailsData={kycDetailsData as KycDetails}
      OwnerTypeMasterList={ownerTypeList}
      locale={locale}
    />
  )
}
