import 'server-only';

import type {
  PropertyMasterData,
  WingWiseDetailsItems,
  ApartmentTaxDetailsItem,
  ApartmentQcWingDto,
} from '@/types/property-tax/apartment';
import type { fetchPtisPageData } from '@/app/[locale]/property-tax/ptis/ptis-fetch.service';
import { formatAmount } from '@/lib/api/ptis/apartment/apartment-qc-performance.mapper';
import { resolveSocietyPhoto } from '@/lib/utils/ptis-photo-match.utils';
import { isPropertyRevenueZero } from '@/lib/utils/ptis-revenue.utils';
export type PtisPageData = Awaited<ReturnType<typeof fetchPtisPageData>>;

export interface BuildMasterDataParams {
  resolvedPropertyId?: number;
  baseData?: PropertyMasterData;
  pageData: PtisPageData;
  wardNo?: string;
  propertyNo?: string;
  rawData?: WingWiseDetailsItems | null;
  initialApartmentTaxDetails?: unknown;
}

export function buildInitialPropertyMasterData(
  params: BuildMasterDataParams
): PropertyMasterData | undefined {
  const { resolvedPropertyId, baseData, pageData, propertyNo, rawData } = params;
  if (!resolvedPropertyId && !baseData) return undefined;

  const { propertyDetailsResult, societyDetails, kycDetails, tabHeaderInfo, rawPropertyData } = pageData;
  const propDetails = propertyDetailsResult?.propertyDetails;
  const rawPropDetails = propDetails as unknown as Record<string, unknown>;
  const rawSoc = societyDetails as unknown as Record<string, unknown>;
  const rawKyc = kycDetails as unknown as Record<string, unknown>;
  const rawTabHeader = tabHeaderInfo as unknown as Record<string, unknown>;
  const firstWingRaw = rawData?.wings?.[0] as unknown as Record<string, unknown> | undefined;

  // Check if we have valid identifying society or property information
  const hasValidSocietyOrOwner = Boolean(
    (baseData?.societyName && baseData.societyName !== '-') ||
    (baseData?.ownerName && baseData.ownerName !== '-') ||
    (societyDetails?.buildingSocietyName && societyDetails.buildingSocietyName !== '-') ||
    (rawSoc?.societyName && rawSoc.societyName !== '-') ||
    (kycDetails?.propertyHolderName && kycDetails.propertyHolderName !== '-') ||
    (tabHeaderInfo?.ownerName && tabHeaderInfo.ownerName !== '-')
  );

  // If we have neither baseData nor any property/society details from pageData, return undefined
  // to avoid rendering a card full of empty dashes and ₹0 before real data arrives.
  if (!baseData && !hasValidSocietyOrOwner) {
    return undefined;
  }

  const { guid: photoGuid, url: photoUrl } = resolveSocietyPhoto(
    pageData.initialPhotos,
    pageData.initialPhotoSlots
  );
  const hasPhotosList = Array.isArray(pageData.initialPhotos) || Array.isArray(pageData.initialPhotoSlots);
  const effectivePhotoGuid = photoGuid || (!hasPhotosList ? baseData?.societyBuildingPhotoGuid : undefined);
  const effectivePhotoUrl = photoUrl || (!hasPhotosList ? baseData?.imageUrl : undefined);

  const effectiveWardNo = (baseData?.wardNo && baseData.wardNo !== '-')
    ? baseData.wardNo
    : (typeof propDetails?.wardNo === 'string' && propDetails.wardNo !== '-')
    ? propDetails.wardNo
    : (typeof tabHeaderInfo?.oldWardNo === 'string' && tabHeaderInfo.oldWardNo !== '-')
    ? tabHeaderInfo.oldWardNo
    : '-';
  const effectivePropNo = (baseData?.propertyNo && baseData.propertyNo !== '-') ? baseData.propertyNo : (propertyNo && propertyNo !== '-') ? propertyNo : (typeof propDetails?.propertyNo === 'string' ? propDetails.propertyNo : '') || (typeof tabHeaderInfo?.oldPropertyNo === 'string' ? tabHeaderInfo.oldPropertyNo : '') || '-';
  const effectiveUpic = (baseData?.upic && baseData.upic !== '-') ? baseData.upic : (typeof tabHeaderInfo?.upicId === 'string' ? tabHeaderInfo.upicId : '') || (typeof propDetails?.upicId === 'string' ? propDetails.upicId : '') || (typeof rawPropertyData?.[0]?.upicId === 'string' ? rawPropertyData[0].upicId : '') || '-';
  const effectiveSocietyName = (baseData?.societyName && baseData.societyName !== '-') ? baseData.societyName : (typeof societyDetails?.buildingSocietyName === 'string' ? societyDetails.buildingSocietyName : '') || (typeof rawSoc?.societyName === 'string' ? rawSoc.societyName : '') || (typeof kycDetails?.propertyHolderName === 'string' ? kycDetails.propertyHolderName : '') || (typeof tabHeaderInfo?.ownerName === 'string' ? tabHeaderInfo.ownerName : '') || '-';
  const effectiveDivision = (baseData?.division && baseData.division !== '-') ? baseData.division : (typeof rawPropDetails?.division === 'string' && rawPropDetails.division !== '-') ? rawPropDetails.division : (typeof rawPropDetails?.divisionName === 'string' && rawPropDetails.divisionName !== '-') ? rawPropDetails.divisionName : (typeof rawTabHeader?.division === 'string' && rawTabHeader.division !== '-') ? rawTabHeader.division : '-';
  const effectiveTaxZoneAndName = (baseData?.taxZoneAndName && baseData.taxZoneAndName !== '-') ? baseData.taxZoneAndName : (rawPropDetails?.taxZone && rawPropDetails?.taxZoneName) ? `${String(rawPropDetails.taxZone)} - ${String(rawPropDetails.taxZoneName)}` : '-';
  const rawSubZ = rawPropDetails?.subZoneNo || rawPropDetails?.subZone || rawTabHeader?.subZoneNo || rawTabHeader?.subZone;
  const rawC = rawPropDetails?.csn || rawTabHeader?.csn;
  const effectiveSubZoneCsn = (baseData?.subZoneCsnNo && baseData.subZoneCsnNo !== '-')
    ? baseData.subZoneCsnNo
    : (rawSubZ && rawC)
    ? `${String(rawSubZ)} - ${String(rawC).replace(/^CSN\s*[-:]?\s*/i, '').trim()}`
    : rawSubZ
    ? String(rawSubZ)
    : rawC
    ? (String(rawC).toUpperCase().startsWith('CSN') ? String(rawC) : `CSN - ${String(rawC)}`)
    : rawTabHeader?.surveyNo
    ? `CSN - ${String(rawTabHeader.surveyNo)}`
    : '-';
  const effectivePlotNo = (baseData?.plotNo && baseData.plotNo !== '-') ? baseData.plotNo : (typeof rawPropDetails?.plotNo === 'string' && rawPropDetails.plotNo !== '-') ? rawPropDetails.plotNo : (typeof rawTabHeader?.plotNo === 'string' && rawTabHeader.plotNo !== '-') ? rawTabHeader.plotNo : '-';
  const effectiveLandOwner = (baseData?.landOwnerName && baseData.landOwnerName !== '-') ? baseData.landOwnerName : (typeof rawSoc?.landOwnerName === 'string' && rawSoc.landOwnerName !== '-') ? rawSoc.landOwnerName : (typeof rawKyc?.propertyHolderNameMarathi === 'string' && rawKyc.propertyHolderNameMarathi !== '-') ? rawKyc.propertyHolderNameMarathi : baseData?.ownerName || '-';
  const effectiveBuilder = (baseData?.builderName && baseData.builderName !== '-') ? baseData.builderName : (typeof rawSoc?.builderName === 'string' && rawSoc.builderName !== '-') ? rawSoc.builderName : (typeof rawKyc?.occupierNameMarathi === 'string' && rawKyc.occupierNameMarathi !== '-') ? rawKyc.occupierNameMarathi : '-';
  const effectiveSocietyEmail = (baseData?.societyEmail && baseData.societyEmail !== '-') ? baseData.societyEmail : (typeof rawSoc?.societyEmailId === 'string' && rawSoc.societyEmailId !== '-') ? rawSoc.societyEmailId : (typeof rawKyc?.emailId === 'string' && rawKyc.emailId !== '-') ? rawKyc.emailId : '-';
  const effectiveSecName = (baseData?.secretaryName && baseData.secretaryName !== '-') ? baseData.secretaryName : (typeof rawSoc?.secretaryName === 'string' && rawSoc.secretaryName !== '-') ? rawSoc.secretaryName : (typeof firstWingRaw?.secretaryName === 'string' && firstWingRaw.secretaryName !== '-') ? String(firstWingRaw.secretaryName) : '-';
  const rawSecMobile = (baseData?.secretaryMobileNo && baseData.secretaryMobileNo !== '-') ? baseData.secretaryMobileNo : (typeof rawSoc?.secretaryMobileNo === 'string' && rawSoc.secretaryMobileNo !== '-') ? rawSoc.secretaryMobileNo : (typeof firstWingRaw?.secretaryMobileNo === 'string' && firstWingRaw.secretaryMobileNo !== '-') ? String(firstWingRaw.secretaryMobileNo) : '-';
  const secDigits = String(rawSecMobile || '').replace(/\D/g, '');
  const effectiveSecMobile = (rawSecMobile && rawSecMobile !== '-' && secDigits.length >= 5)
    ? (rawSecMobile.startsWith('+') ? rawSecMobile : `+91 ${secDigits.slice(-10)}`)
    : (baseData?.secretaryMobileNo || '-');
  const effectiveSecEmail = (baseData?.secretaryEmail && baseData.secretaryEmail !== '-') ? baseData.secretaryEmail : (typeof rawSoc?.secretaryEmailId === 'string' && rawSoc.secretaryEmailId !== '-') ? rawSoc.secretaryEmailId : '-';
  const effectiveAddress = (baseData?.societyAddress && baseData.societyAddress !== '-') ? baseData.societyAddress : (baseData?.address && baseData.address !== '-') ? baseData.address : (typeof rawSoc?.societyAddress === 'string' && rawSoc.societyAddress !== '-') ? rawSoc.societyAddress : (typeof rawKyc?.address === 'string' && rawKyc.address !== '-') ? rawKyc.address : '-';
  const rawPlotAreaStr = rawPropDetails?.plotArea != null ? String(rawPropDetails.plotArea).trim() : '';
  const effectivePlotArea = (baseData?.plotArea && baseData.plotArea !== '-')
    ? baseData.plotArea
    : (rawPlotAreaStr !== '' && rawPlotAreaStr !== '-' && rawPlotAreaStr !== '0')
      ? `${rawPlotAreaStr} sq.ft`
      : '-';

  const rawCarpet = rawPropDetails?.carpetArea != null ? String(rawPropDetails.carpetArea).trim() : '';
  const rawBuiltUp = rawPropDetails?.builtUpArea != null ? String(rawPropDetails.builtUpArea).trim() : '';
  const effectiveCarpetBuiltUp = (baseData?.carpetBuiltUpArea && baseData.carpetBuiltUpArea !== '-')
    ? baseData.carpetBuiltUpArea
    : (rawCarpet !== '' && rawBuiltUp !== '' && rawCarpet !== '-' && rawBuiltUp !== '-')
      ? `${rawCarpet} / ${rawBuiltUp}`
      : '-';

  const rawFloors = rawPropDetails?.totalFloors != null ? String(rawPropDetails.totalFloors).trim() : '';
  const effectiveTotalFloors = (baseData?.totalFloors && baseData.totalFloors !== '-')
    ? baseData.totalFloors
    : (rawFloors !== '' && rawFloors !== '-')
      ? rawFloors
      : '-';

  const rawProps = rawPropDetails?.totalProperties != null ? String(rawPropDetails.totalProperties).trim() : '';
  const effectiveTotalProperties = (baseData?.totalPropertiesResCommAmen && baseData.totalPropertiesResCommAmen !== '-')
    ? baseData.totalPropertiesResCommAmen
    : (rawProps !== '' && rawProps !== '-')
      ? rawProps
      : '-';

  const effectiveWings: ApartmentQcWingDto[] =
    baseData?.wings && baseData.wings.length > 0
      ? baseData.wings
      : (rawData?.wings as unknown as ApartmentQcWingDto[]) && rawData!.wings.length > 0
      ? (rawData!.wings as unknown as ApartmentQcWingDto[])
      : (pageData?.wings as unknown as ApartmentQcWingDto[]) || [];

  const effectiveTotalWings =
    baseData?.totalWings ??
    (effectiveWings.length > 0 ? effectiveWings.length : undefined) ??
    0;
  const effectiveCategory = (baseData?.category && baseData.category !== '-') ? baseData.category : (typeof rawTabHeader?.category === 'string' && rawTabHeader.category !== '-') ? rawTabHeader.category : (typeof rawPropDetails?.categoryName === 'string' && rawPropDetails.categoryName !== '-') ? rawPropDetails.categoryName : 'Apartment';
  const effectiveDescRegional = (baseData?.propertyDescriptionRegional && baseData.propertyDescriptionRegional !== '-') ? baseData.propertyDescriptionRegional : (typeof rawPropDetails?.propertyDescriptionRegional === 'string' && rawPropDetails.propertyDescriptionRegional !== '-') ? rawPropDetails.propertyDescriptionRegional : 'निवासी व अनिवासी';

  let perf = baseData?.performance ? { ...baseData.performance } : undefined;

  const isPerfZero = isPropertyRevenueZero(perf);

  if (isPerfZero) {
    let fallbackTax = 0;
    const aptTax = params.initialApartmentTaxDetails as ApartmentTaxDetailsItem | undefined;
    if (aptTax?.currentTaxes && Array.isArray(aptTax.currentTaxes)) {
      for (const group of aptTax.currentTaxes) {
        if (group.taxHeads && Array.isArray(group.taxHeads)) {
          for (const head of group.taxHeads) {
            fallbackTax += head.taxAmount || 0;
          }
        }
      }
    }
    if (fallbackTax === 0) {
      const capData = pageData.capitalResult?.data;
      const capitalTax = Array.isArray(capData)
        ? capData.reduce((acc, curr) => acc + (curr.taxTotal ?? 0), 0)
        : (capData?.totalTax ?? 0);

      fallbackTax =
        pageData.rateableResult?.data?.totalTax ??
        pageData.rateableResult?.data?.policy?.taxTotal ??
        capitalTax;
    }

    if (fallbackTax > 0) {
      const formatted = formatAmount(fallbackTax);
      const oldTaxNum = perf?.oldCurrentTax ? parseFloat(String(perf.oldCurrentTax).replace(/[^0-9.-]/g, '')) : NaN;
      const hasOldTax = !isNaN(oldTaxNum) && oldTaxNum >= 0;
      const diffAmount = hasOldTax ? fallbackTax - oldTaxNum : fallbackTax;
      const formattedDiff = formatAmount(diffAmount);

      perf = {
        ...(perf || {
          revenueGrowthPct: '',
          retroTax: '-',
          pendingDemand: '-',
          collectionAmount: '-',
          collectionPercent: '0%',
          totalOutstanding: '-',
          arrears: '-',
          interest: '-',
          advance: '-',
          oldCurrentTax: '-',
          changePercent: null,
          isGrowthNegative: false,
        }),
        thisAssessmentRevenue: formattedDiff,
        currentTax: formatted,
        totalTax: (perf?.totalTax && perf.totalTax !== '-' && perf.totalTax !== '₹0') ? perf.totalTax : formatted,
        currentDemand: (perf?.currentDemand && perf.currentDemand !== '-' && perf.currentDemand !== '₹0') ? perf.currentDemand : formatted,
        totalDemand: (perf?.totalDemand && perf.totalDemand !== '-' && perf.totalDemand !== '₹0') ? perf.totalDemand : formatted,
        totalBalance: (perf?.totalBalance && perf.totalBalance !== '-' && perf.totalBalance !== '₹0') ? perf.totalBalance : formatted,
        differenceAmount: formattedDiff,
        rawDifferenceAmount: diffAmount,
      };
    }
  }

  return {
    ...(baseData || {}),
    propertyId: resolvedPropertyId ?? undefined,
    propertyNo: effectivePropNo,
    upic: effectiveUpic,
    societyName: effectiveSocietyName,
    societyNameEnglish: (baseData?.societyNameEnglish && baseData.societyNameEnglish !== '-') ? baseData.societyNameEnglish : (typeof rawSoc?.societyNameEnglish === 'string' && rawSoc.societyNameEnglish !== '-') ? rawSoc.societyNameEnglish : baseData?.societyNameEnglish,
    division: effectiveDivision,
    wardNo: effectiveWardNo,
    category: effectiveCategory,
    taxZoneAndName: effectiveTaxZoneAndName,
    taxZone: (baseData?.taxZone && baseData.taxZone !== '-') ? baseData.taxZone : (rawPropDetails?.taxZone ? String(rawPropDetails.taxZone) : '-'),
    subZoneCsnNo: effectiveSubZoneCsn,
    plotNo: effectivePlotNo,
    landOwnerName: effectiveLandOwner,
    landOwnerNameEnglish: (baseData?.landOwnerNameEnglish && baseData.landOwnerNameEnglish !== '-') ? baseData.landOwnerNameEnglish : (typeof rawSoc?.landOwnerNameEnglish === 'string' && rawSoc.landOwnerNameEnglish !== '-') ? rawSoc.landOwnerNameEnglish : baseData?.landOwnerNameEnglish,
    builderName: effectiveBuilder,
    builderNameEnglish: (baseData?.builderNameEnglish && baseData.builderNameEnglish !== '-') ? baseData.builderNameEnglish : (typeof rawSoc?.builderNameEnglish === 'string' && rawSoc.builderNameEnglish !== '-') ? rawSoc.builderNameEnglish : baseData?.builderNameEnglish,
    societyEmail: effectiveSocietyEmail,
    secretaryName: effectiveSecName,
    secretaryNameEnglish: (baseData?.secretaryNameEnglish && baseData.secretaryNameEnglish !== '-') ? baseData.secretaryNameEnglish : (typeof rawSoc?.secretaryNameEnglish === 'string' && rawSoc.secretaryNameEnglish !== '-') ? rawSoc.secretaryNameEnglish : baseData?.secretaryNameEnglish,
    secretaryMobileNo: effectiveSecMobile,
    secretaryEmail: effectiveSecEmail,
    societyAddress: effectiveAddress,
    societyAddressEnglish: (baseData?.societyAddressEnglish && baseData.societyAddressEnglish !== '-') ? baseData.societyAddressEnglish : (typeof rawSoc?.societyAddressEnglish === 'string' && rawSoc.societyAddressEnglish !== '-') ? rawSoc.societyAddressEnglish : baseData?.societyAddressEnglish,
    address: effectiveAddress,
    managerName: (baseData?.managerName && baseData.managerName !== '-') ? baseData.managerName : (typeof rawSoc?.managerName === 'string' && rawSoc.managerName !== '-') ? rawSoc.managerName : baseData?.managerName,
    managerNameEnglish: (baseData?.managerNameEnglish && baseData.managerNameEnglish !== '-') ? baseData.managerNameEnglish : (typeof rawSoc?.managerNameEnglish === 'string' && rawSoc.managerNameEnglish !== '-') ? rawSoc.managerNameEnglish : baseData?.managerNameEnglish,
    plotArea: effectivePlotArea,
    carpetBuiltUpArea: effectiveCarpetBuiltUp,
    carpetAreaFtMtr: baseData?.carpetAreaFtMtr,
    builtUpAreaFtMtr: baseData?.builtUpAreaFtMtr,
    oldCarpetBuiltUp: (baseData?.oldCarpetBuiltUp && baseData.oldCarpetBuiltUp !== '-') ? baseData.oldCarpetBuiltUp : (typeof rawSoc?.oldCarpetBuiltUp === 'string' && rawSoc.oldCarpetBuiltUp !== '-') ? rawSoc.oldCarpetBuiltUp : '-',
    oldCarpetAreaFtMtr: baseData?.oldCarpetAreaFtMtr,
    oldBuiltUpAreaFtMtr: baseData?.oldBuiltUpAreaFtMtr,
    totalFloors: effectiveTotalFloors,
    totalWings: effectiveTotalWings,
    wings: effectiveWings,
    totalPropertiesResCommAmen: effectiveTotalProperties,
    societyBuildingPhotoGuid: effectivePhotoGuid,
    imageUrl: effectivePhotoUrl,
    propertyDescriptionRegional: effectiveDescRegional,
    latitude: baseData?.latitude ?? (rawSoc?.latitude as string | number | null | undefined) ?? pageData?.latitude,
    longitude: baseData?.longitude ?? (rawSoc?.longitude as string | number | null | undefined) ?? pageData?.longitude,
    performance: perf || {
      thisAssessmentRevenue: '₹0',
      revenueGrowthPct: '',
      currentTax: '-',
      retroTax: '-',
      totalTax: '-',
      totalDemand: '-',
      currentDemand: '-',
      pendingDemand: '-',
      collectionAmount: '-',
      collectionPercent: '0%',
      totalBalance: '-',
      totalOutstanding: '-',
      arrears: '-',
      interest: '-',
      advance: '-',
      oldCurrentTax: '-',
      differenceAmount: '-',
      rawDifferenceAmount: null,
      changePercent: null,
      isGrowthNegative: false,
    },
  };
}
