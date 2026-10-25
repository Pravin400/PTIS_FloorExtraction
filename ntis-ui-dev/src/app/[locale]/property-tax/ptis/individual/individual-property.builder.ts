import 'server-only';

import type {
  IndividualPropertyMasterData,
  IndividualPerformanceData,
} from '@/types/property-tax/individual';
import type { fetchPtisPageData } from '@/app/[locale]/property-tax/ptis/ptis-fetch.service';
import { formatAadharNumber } from '@/lib/utils/format';
import { resolvePropertyFrontPhoto } from '@/lib/utils/ptis-photo-match.utils';
import {
  formatIndianCurrency,
  formatAddressWithWingAndPincode,
} from '@/lib/api/ptis/individual/individual-property.mapper';
import { isPropertyRevenueZero } from '@/lib/utils/ptis-revenue.utils';

export type PtisPageData = Awaited<ReturnType<typeof fetchPtisPageData>>;

export interface BuildIndividualMasterDataParams {
  resolvedPropertyId?: number;
  baseData?: IndividualPropertyMasterData;
  pageData: PtisPageData;
  wardNo?: string;
  propertyNo?: string;
}

/**
 * Safely extracts a non-empty, non-dash string property from an unknown record.
 */
function getSafeString(obj: unknown, key: string): string | undefined {
  if (!obj || typeof obj !== 'object') return undefined;
  const val = (obj as Record<string, unknown>)[key];
  if (typeof val === 'string') {
    const trimmed = val.trim();
    return trimmed !== '' && trimmed !== '-' ? trimmed : undefined;
  }
  if (typeof val === 'number' && !isNaN(val)) {
    return String(val);
  }
  return undefined;
}

const DEFAULT_PERFORMANCE: IndividualPerformanceData = {
  thisAssessmentRevenue: '₹0',
  revenueGrowthPct: '',
  isGrowthNegative: false,
  currentTax: '-',
  retroTax: '-',
  totalTax: '-',
  totalDemand: '-',
  currentDemand: '-',
  pendingDemand: '-',
  collectionPercent: 0,
  collectionAmount: '₹0',
  totalBalance: '₹0',
  differenceAmount: '₹0',
  rawDifferenceAmount: 0,
  oldCurrentTax: '-',
  changePercent: 0,
};

/**
 * Builds the canonical, normalized IndividualPropertyMasterData domain model.
 * Acts as the Single Source of Truth (SSOT) so UI components receive clean,
 * non-null, pre-formatted values without repeating fallback logic.
 */
export function buildInitialIndividualMasterData(
  params: BuildIndividualMasterDataParams
): IndividualPropertyMasterData | undefined {
  const { resolvedPropertyId, baseData, pageData, wardNo, propertyNo } = params;
  if (!resolvedPropertyId && !baseData) return undefined;

  const { propertyDetailsResult, societyDetails, kycDetails, tabHeaderInfo, rawPropertyData } =
    pageData;
  const propDetails = propertyDetailsResult?.propertyDetails;

  const { guid: photoGuid, url: photoUrl } = resolvePropertyFrontPhoto(
    pageData.initialPhotos,
    pageData.initialPhotoSlots
  );

  // 1. Identifiers
  const effectiveWardNo =
    baseData?.wardNo && baseData.wardNo !== '-'
      ? baseData.wardNo
      : wardNo && wardNo !== '-'
        ? wardNo
        : getSafeString(propDetails, 'wardNo') || getSafeString(tabHeaderInfo, 'oldWardNo') || '-';

  const effectivePropNo =
    baseData?.propertyNo && baseData.propertyNo !== '-'
      ? baseData.propertyNo
      : propertyNo && propertyNo !== '-'
        ? propertyNo
        : getSafeString(propDetails, 'propertyNo') ||
          getSafeString(tabHeaderInfo, 'oldPropertyNo') ||
          '-';

  const effectiveUpic =
    baseData?.upic && baseData.upic !== '-'
      ? baseData.upic
      : getSafeString(tabHeaderInfo, 'upicId') ||
        getSafeString(propDetails, 'upicId') ||
        getSafeString(rawPropertyData?.[0], 'upicId') ||
        '-';

  // 2. Ownership & Occupancy
  const isDevanagari = (val?: string | null) => Boolean(val && /[\u0900-\u097F]/.test(val));

  // Regional Owner Name: for Tabsection Owner and Holder Regional
  const effectiveHolderRegional =
    baseData?.ownerNameRegional && baseData.ownerNameRegional !== '-'
      ? baseData.ownerNameRegional
      : baseData?.holderRegional && baseData.holderRegional !== '-'
        ? baseData.holderRegional
        : getSafeString(kycDetails, 'ownerName') ||
          getSafeString(kycDetails, 'ownerNameRegional') ||
          getSafeString(kycDetails, 'propertyHolderNameMarathi') ||
          (baseData?.ownerName && baseData.ownerName !== '-' && isDevanagari(baseData.ownerName)
            ? baseData.ownerName
            : '') ||
          '-';

  // English Owner Name: for Top Header "OWNER NAME:"
  const effectiveOwnerNameEnglish =
    baseData?.ownerNameEnglish && baseData.ownerNameEnglish !== '-'
      ? baseData.ownerNameEnglish
      : getSafeString(kycDetails, 'ownerNameEnglish') ||
        getSafeString(kycDetails, 'propertyHolderNameEnglish') ||
        getSafeString(kycDetails, 'propertyHolderName') ||
        (baseData?.ownerName && baseData.ownerName !== '-' && !isDevanagari(baseData.ownerName)
          ? baseData.ownerName
          : '') ||
        getSafeString(tabHeaderInfo, 'ownerName') ||
        getSafeString(propDetails, 'ownerName') ||
        (baseData?.ownerName && baseData.ownerName !== '-' ? baseData.ownerName : '') ||
        (effectiveHolderRegional !== '-' ? effectiveHolderRegional : '-');

  // For the red-highlighted "Owner" row in tabsection: prefer regional name, fallback to English
  const effectiveOwner =
    effectiveHolderRegional !== '-'
      ? effectiveHolderRegional
      : baseData?.owner && baseData.owner !== '-'
        ? baseData.owner
        : effectiveOwnerNameEnglish;

  const effectivePropertyHolder =
    baseData?.propertyHolder && baseData.propertyHolder !== '-'
      ? baseData.propertyHolder
      : effectiveOwnerNameEnglish !== '-'
        ? effectiveOwnerNameEnglish
        : effectiveHolderRegional;

  const effectiveOccupierName =
    baseData?.occupierName && baseData.occupierName !== '-'
      ? baseData.occupierName
      : getSafeString(kycDetails, 'occupierName') || '-';

  const effectiveOccupierRegional =
    baseData?.occupierNameRegional && baseData.occupierNameRegional !== '-'
      ? baseData.occupierNameRegional
      : baseData?.occupierRegional && baseData.occupierRegional !== '-'
        ? baseData.occupierRegional
        : getSafeString(kycDetails, 'occupierNameMarathi') || '-';

  // 3. Category & Description
  const effectiveCategory =
    baseData?.category && baseData.category !== '-' && baseData.category !== baseData.ownerCategory
      ? baseData.category
      : getSafeString(tabHeaderInfo, 'category') ||
        getSafeString(propDetails, 'categoryName') ||
        getSafeString(propDetails, 'category') ||
        getSafeString(rawPropertyData?.[0], 'categoryLabel') ||
        getSafeString(rawPropertyData?.[0], 'category') ||
        (baseData?.category && baseData.category !== '-' ? baseData.category : 'Individual');

  const effectiveOwnerCategory =
    baseData?.ownerCategory && baseData.ownerCategory !== '-'
      ? baseData.ownerCategory
      : getSafeString(kycDetails, 'ownerCategory') ||
        (effectiveCategory !== '-' ? effectiveCategory : '-');

  const effectiveDescRegional =
    baseData?.propertyDescriptionRegional && baseData.propertyDescriptionRegional !== '-'
      ? baseData.propertyDescriptionRegional
      : getSafeString(propDetails, 'propertyDescriptionRegional') ||
        getSafeString(propDetails, 'propertyDescription') ||
        getSafeString(tabHeaderInfo, 'description') ||
        '-';

  // 4. Geographical & Cadastral
  const effectiveDivision =
    baseData?.division && baseData.division !== '-'
      ? baseData.division
      : getSafeString(propDetails, 'division') ||
        getSafeString(propDetails, 'divisionName') ||
        getSafeString(tabHeaderInfo, 'division') ||
        '-';

  const effectiveMoujaName =
    baseData?.moujaName && baseData.moujaName !== '-'
      ? baseData.moujaName
      : getSafeString(propDetails, 'moujaName') || getSafeString(tabHeaderInfo, 'moujaName') || '-';

  const effectiveRateSectionName =
    baseData?.rateSectionName && baseData.rateSectionName !== '-'
      ? baseData.rateSectionName
      : getSafeString(propDetails, 'rateSectionName') ||
        getSafeString(propDetails, 'rateSection') ||
        getSafeString(rawPropertyData?.[0], 'rateSectionName') ||
        getSafeString(rawPropertyData?.[0], 'rateSection') ||
        getSafeString(tabHeaderInfo, 'rateSectionName') ||
        getSafeString(tabHeaderInfo, 'rateSection') ||
        '-';

  const rawTaxZone = getSafeString(propDetails, 'taxZone');
  const rawTaxZoneName = getSafeString(propDetails, 'taxZoneName');
  const effectiveTaxZoneAndName =
    baseData?.taxZoneAndName && baseData.taxZoneAndName !== '-'
      ? baseData.taxZoneAndName
      : rawTaxZone && rawTaxZoneName
        ? `${rawTaxZone} - ${rawTaxZoneName}`
        : rawTaxZone || '-';

  const effectiveTaxZone =
    baseData?.taxZone && baseData.taxZone !== '-' ? baseData.taxZone : rawTaxZone || '-';

  const effectiveSurveyNo =
    baseData?.surveyNo && baseData.surveyNo !== '-'
      ? baseData.surveyNo
      : getSafeString(propDetails, 'surveyNo') || getSafeString(tabHeaderInfo, 'surveyNo') || '-';

  const effectivePlotNo =
    baseData?.plotNo && baseData.plotNo !== '-'
      ? baseData.plotNo
      : getSafeString(propDetails, 'plotNo') || getSafeString(tabHeaderInfo, 'plotNo') || '-';

  // 5. Aadhar & Title Normalization
  const effectiveAadharNo =
    baseData?.aadharNo && baseData.aadharNo !== ''
      ? baseData.aadharNo
      : getSafeString(kycDetails, 'aadharNo') || '';

  const effectiveTitle =
    baseData?.title && baseData.title !== ''
      ? baseData.title
      : baseData?.ownerTitle && baseData.ownerTitle !== ''
        ? baseData.ownerTitle
        : getSafeString(kycDetails, 'title') || getSafeString(kycDetails, 'ownerTitle') || '';

  const formattedAadhar = formatAadharNumber(effectiveAadharNo);

  const effectiveAadharWithTitle = formattedAadhar || '-';

  // 6. Contact & Address
  const effectiveMobileNo =
    baseData?.mobileNo && baseData.mobileNo !== '-'
      ? baseData.mobileNo
      : getSafeString(kycDetails, 'mobileNo') ||
        getSafeString(kycDetails, 'alternateMobileNo') ||
        '-';

  const effectiveEmailId =
    baseData?.emailId && baseData.emailId !== '-'
      ? baseData.emailId
      : getSafeString(kycDetails, 'emailId') || '-';

  const effectiveWingName =
    (baseData?.wingName && baseData.wingName !== '-')
      ? baseData.wingName
      : getSafeString(propDetails, 'wingName') ||
        getSafeString(tabHeaderInfo, 'wingName') ||
        undefined;

  const effectivePinCode =
    (baseData?.pinCode && baseData.pinCode !== '-')
      ? baseData.pinCode
      : getSafeString(kycDetails, 'pinCode') ||
        getSafeString(propDetails, 'pinCode') ||
        getSafeString(propDetails, 'pincode') ||
        getSafeString(societyDetails, 'pinCode') ||
        getSafeString(societyDetails, 'pincode') ||
        getSafeString(tabHeaderInfo, 'pinCode') ||
        undefined;

  const rawAddressEnglish =
    baseData?.addressEnglish && baseData.addressEnglish !== '-'
      ? baseData.addressEnglish
      : getSafeString(kycDetails, 'addressEnglish') ||
        getSafeString(propDetails, 'addressEnglish') ||
        undefined;

  const rawAddressRegional =
    baseData?.addressRegional && baseData.addressRegional !== '-'
      ? baseData.addressRegional
      : getSafeString(kycDetails, 'addressRegional') ||
        getSafeString(propDetails, 'addressRegional') ||
        undefined;

  const rawAddress =
    baseData?.societyAddress && baseData.societyAddress !== '-'
      ? baseData.societyAddress
      : baseData?.address && baseData.address !== '-'
        ? baseData.address
        : getSafeString(kycDetails, 'address') ||
          getSafeString(societyDetails, 'societyAddress') ||
          getSafeString(propDetails, 'address') ||
          '-';

  const effectiveAddress = formatAddressWithWingAndPincode(
    rawAddress,
    effectiveWingName,
    effectivePinCode
  );

  const effectiveAddressEnglish = rawAddressEnglish
    ? formatAddressWithWingAndPincode(rawAddressEnglish, effectiveWingName, effectivePinCode)
    : undefined;

  const effectiveAddressRegional = rawAddressRegional
    ? formatAddressWithWingAndPincode(rawAddressRegional, effectiveWingName, effectivePinCode)
    : undefined;

  // 7. Area Dimensions
  const rawPlotAreaStr = getSafeString(propDetails, 'plotArea') || '';
  const effectivePlotArea =
    baseData?.plotAreaFtMtr && baseData.plotAreaFtMtr !== '-'
      ? baseData.plotAreaFtMtr
      : rawPlotAreaStr !== '' && rawPlotAreaStr !== '0'
        ? `${rawPlotAreaStr} sqft`
        : '-';

  const rawCarpet = getSafeString(propDetails, 'carpetArea') || '';
  const effectiveCarpetArea =
    baseData?.carpetAreaFtMtr && baseData.carpetAreaFtMtr !== '-'
      ? baseData.carpetAreaFtMtr
      : rawCarpet !== ''
        ? `${rawCarpet} sqft`
        : '-';

  const rawBuiltUp = getSafeString(propDetails, 'builtUpArea') || '';
  const effectiveBuiltUpArea =
    baseData?.builtUpAreaFtMtr && baseData.builtUpAreaFtMtr !== '-'
      ? baseData.builtUpAreaFtMtr
      : rawBuiltUp !== ''
        ? `${rawBuiltUp} sqft`
        : '-';

  let perf = baseData?.performance ? { ...baseData.performance } : { ...DEFAULT_PERFORMANCE };

  // Fallback: If performance has 0/empty tax but pageData already has calculated tax from rateable/capital calculation,
  // sync the calculated tax into performance domain model
  const isPerfZero = isPropertyRevenueZero(perf);

  if (isPerfZero) {
    const capData = pageData.capitalResult?.data;
    const capitalTax = Array.isArray(capData)
      ? capData.reduce((acc, curr) => acc + (curr.taxTotal ?? 0), 0)
      : (capData?.totalTax ?? 0);

    const calculatedTax =
      pageData.rateableResult?.data?.totalTax ??
      pageData.rateableResult?.data?.policy?.taxTotal ??
      capitalTax;

    if (calculatedTax > 0) {
      const formatted = formatIndianCurrency(calculatedTax);
      const oldTaxNum = perf?.oldCurrentTax ? parseFloat(String(perf.oldCurrentTax).replace(/[^0-9.-]/g, '')) : NaN;
      const hasOldTax = !isNaN(oldTaxNum) && oldTaxNum >= 0;
      const diffAmount = hasOldTax ? calculatedTax - oldTaxNum : calculatedTax;
      const formattedDiff = formatIndianCurrency(diffAmount);

      perf = {
        ...perf,
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

  const hasPhotosList = Array.isArray(pageData.initialPhotos) || Array.isArray(pageData.initialPhotoSlots);
  const effectivePhotoGuid = photoGuid || (!hasPhotosList ? baseData?.societyBuildingPhotoGuid : undefined);
  const effectivePhotoUrl = photoUrl || (!hasPhotosList ? baseData?.imageUrl : undefined);

  return {
    ...(baseData || {}),
    propertyId: resolvedPropertyId ?? baseData?.propertyId ?? undefined,
    propertyNo: effectivePropNo,
    upic: effectiveUpic,
    ownerName: effectiveOwnerNameEnglish,
    ownerNameEnglish: effectiveOwnerNameEnglish !== '-' ? effectiveOwnerNameEnglish : undefined,
    ownerNameRegional: effectiveHolderRegional !== '-' ? effectiveHolderRegional : undefined,
    owner: effectiveOwner,
    propertyHolder: effectivePropertyHolder,
    holderRegional: effectiveHolderRegional,
    occupierName: effectiveOccupierName,
    occupierRegional: effectiveOccupierRegional,
    ownerCategory: effectiveOwnerCategory,
    division: effectiveDivision,
    moujaName: effectiveMoujaName,
    rateSectionName: effectiveRateSectionName,
    wardNo: effectiveWardNo,
    category: effectiveCategory,
    taxZoneAndName: effectiveTaxZoneAndName,
    taxZone: effectiveTaxZone,
    surveyNo: effectiveSurveyNo,
    plotNo: effectivePlotNo,
    aadharNo: effectiveAadharNo,
    title: effectiveTitle,
    ownerTitle: effectiveTitle,
    aadharWithTitle: effectiveAadharWithTitle,
    mobileNo: effectiveMobileNo,
    emailId: effectiveEmailId,
    wingName: effectiveWingName,
    pinCode: effectivePinCode,
    societyAddress: effectiveAddress,
    address: effectiveAddress,
    addressEnglish: effectiveAddressEnglish,
    addressRegional: effectiveAddressRegional,
    plotAreaFtMtr: effectivePlotArea,
    carpetAreaFtMtr: effectiveCarpetArea,
    builtUpAreaFtMtr: effectiveBuiltUpArea,
    societyBuildingPhotoGuid: effectivePhotoGuid,
    imageUrl: effectivePhotoUrl,
    propertyDescription: effectiveDescRegional,
    propertyDescriptionRegional: effectiveDescRegional,
    performance: perf,
  };
}
