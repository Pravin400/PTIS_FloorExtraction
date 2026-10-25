// Server-side mapping helper — imported only from server modules, not a callable action

import {
  defaultDiscountData,
  defaultBuildingPermission,
} from '@/lib/constants/ptis.constants';
import { buildDetailsFromResults, buildPropertyOptions, InitialDataResult } from './ptis-data';
import { normalizePartition } from '@/lib/utils/format';
import { type WaybackRelease, DEFAULT_WAYBACK_RELEASES } from '@/lib/api/wayback.service';
import { extractCoordinates } from '@/lib/utils/coordinate-utils';
import { assembleDualMethodSectionData } from '@/components/modules/property-tax/ptis/dualmethod/dual-method-data';
import type { ActionResult } from '@/types/common.types';
import type { PropertyListItem } from '@/types/ptis.types';
import type { PropertyRuleLogItem } from '@/types/rule-engine';
import type { SearchSelectOption } from '@/components/common/SearchSelect';
import type { PagedResponse, ApartmentQCDetail } from '@/types/apartmentQC.types';
import type { RateableValueResponse } from '@/types/rateableValue.types';
import type { CapitalValueResponse } from '@/types/capitalValue.types';
import type { DualMethodResponse } from '@/types/dualMethod.types';
import type { PropertyComparisonResponse } from '@/types/propertyComparison.types';
import type {
  KYCDetailsData,
  SocietyDetailsData,
  BuildingPermissionData,
  OldDetailsData,
  OldFloorDetailsData,
  OldTaxesData,
  DiscountData,
  TabHeaderInfoData,
  MappedPropertyItem,
} from '@/types/ptis.types';
import type { PropertyPhotoTypeWithStatusDto, PropertyPhotoDto } from '@/types/photoplan.types';
import type { TaxDetailsResult } from './TaxDetails/fetchTaxDetails';
import type { WingWiseWingDetails } from '@/types/property-tax/apartment';

type ConcurrentResultsTuple = [
  {
    amenities: PagedResponse<ApartmentQCDetail>;
    commercial: PagedResponse<ApartmentQCDetail>;
    residential: PagedResponse<ApartmentQCDetail>;
  } | null,
  ActionResult<RateableValueResponse> | null,
  ActionResult<CapitalValueResponse> | null,
  ActionResult<KYCDetailsData> | null,
  ActionResult<SocietyDetailsData> | null,
  ActionResult<BuildingPermissionData> | null,
  ActionResult<OldDetailsData> | null,
  ActionResult<OldFloorDetailsData[]> | null,
  ActionResult<OldTaxesData[]> | null,
  ActionResult<DiscountData> | null,
  ActionResult<DiscountData> | null,
  ActionResult<PropertyPhotoTypeWithStatusDto[]> | null,
  ActionResult<PropertyPhotoDto[]> | null,
  ActionResult<DualMethodResponse> | null,
  TaxDetailsResult | null,
  ActionResult<{ items: PropertyRuleLogItem[] }> | null,
  WaybackRelease[] | null,
  ActionResult<TabHeaderInfoData> | null,
  ActionResult<MappedPropertyItem[]> | null,
  ActionResult<PropertyComparisonResponse> | null
];


export async function mapPtisFetchResults({
  propertyDetailsResult,
  propertyListResult,
  detailResults,
  valuationTab,
  resolvedPropertyId,
  activeTab,
  criticalError,
  resolvedWardId,
  showFloorParam,
  showOldTaxParam,
  showMapDetailsParam,
  showDetailsParam,
  searchParams,
  locale,
  propertyIdParam,
  wardOptions,
  wings = [],
  societyLatitude,
  societyLongitude,
}: {
  propertyDetailsResult: InitialDataResult;
  propertyListResult: ActionResult<PropertyListItem[]> | null;
  detailResults: unknown[];
  valuationTab: 'rateable' | 'capital' | 'dual' | 'apartment' | 'reassessment' | undefined;
  resolvedPropertyId: number | undefined;
  activeTab: string;
  criticalError: string | undefined;
  resolvedWardId: number | undefined;
  showFloorParam: boolean;
  showOldTaxParam: boolean;
  showOldTaxInfo?: boolean;
  showMapDetailsParam: boolean;
  showDetailsParam: boolean;
  searchParams: Record<string, string | string[] | undefined>;
  locale: string;
  propertyIdParam: number | undefined;
  wardOptions: SearchSelectOption[];
  wings?: WingWiseWingDetails[];
  societyLatitude?: number;
  societyLongitude?: number;
}) {
  const results = detailResults.length > 0 ? detailResults : Array(20).fill(null);
  const [
    aptData, rateableRes, capitalRes, kycResult, societyResult,
    buildingPermissionResult, oldDetailsResult, oldFloorResult, oldTaxesResult,
    discountResult, socialResult, photoSlotsRes, photosRes, dualResult, taxDetailsRes, ruleLogsRes,
    waybackReleasesRes, tabHeaderInfoResult, mappedPropertiesResult, comparisonResult
  ] = results as unknown as ConcurrentResultsTuple;

  const emptyPaged: PagedResponse<ApartmentQCDetail> = { items: [], totalCount: 0, pageNumber: 1, pageSize: 10, totalPages: 1, hasPrevious: false, hasNext: false };

  const apartmentData = aptData || {
    amenities: emptyPaged,
    commercial: emptyPaged,
    residential: emptyPaged,
  };

  const rawPropertyData = propertyListResult?.success && propertyListResult.data ? propertyListResult.data : [];
  const propertyOptions = buildPropertyOptions(rawPropertyData);

  const { kycDetails, societyDetails, oldDetails, oldFloorTableData, oldTaxesData } = buildDetailsFromResults(
    kycResult,
    societyResult,
    oldDetailsResult,
    oldFloorResult,
    oldTaxesResult
  );

  const buildingPermission = buildingPermissionResult?.success && buildingPermissionResult.data
    ? { ...defaultBuildingPermission, ...buildingPermissionResult.data }
    : defaultBuildingPermission;

  const discountDetails = discountResult?.success && discountResult.data
    ? { ...defaultDiscountData, ...discountResult.data }
    : defaultDiscountData;

  const socialDetails = socialResult?.success && socialResult.data
    ? { ...defaultDiscountData, ...socialResult.data }
    : defaultDiscountData;

  const initialPhotoSlots = photoSlotsRes?.success && Array.isArray(photoSlotsRes.data)
    ? photoSlotsRes.data
    : [];

  const initialPhotos = photosRes?.success && Array.isArray(photosRes.data)
    ? photosRes.data
    : [];

  const waybackReleases =
    Array.isArray(waybackReleasesRes) && waybackReleasesRes.length > 0
      ? waybackReleasesRes
      : DEFAULT_WAYBACK_RELEASES;

  const rawPropObj = propertyDetailsResult?.propertyDetails as unknown as Record<string, unknown> | undefined;
  const rawDataObj = (Array.isArray(rawPropertyData) ? rawPropertyData[0] : rawPropertyData) as unknown as Record<string, unknown> | undefined;
  const matchedProp = rawPropertyData.find((p) => p.propertyId === resolvedPropertyId);

  const rawCatId =
    propertyDetailsResult?.propertyDetails?.categoryId ??
    (matchedProp as unknown as Record<string, unknown>)?.categoryId ??
    (rawPropObj as Record<string, unknown>)?.categoryId ??
    (rawPropObj as Record<string, unknown>)?.CategoryId ??
    (rawDataObj as Record<string, unknown>)?.categoryId ??
    (rawDataObj as Record<string, unknown>)?.CategoryId;
  const categoryId = rawCatId !== undefined && rawCatId !== null ? Number(rawCatId) : undefined;
  const rawCatName = String(
    propertyDetailsResult?.propertyDetails?.category ??
    (rawPropObj as Record<string, unknown>)?.categoryName ??
    (matchedProp as unknown as Record<string, unknown>)?.category ??
    (matchedProp as unknown as Record<string, unknown>)?.categoryName ??
    ''
  ).toLowerCase();
  const isIndividual = categoryId === 2 || rawCatName.includes('individual');
  const isApartmentCategory = !isIndividual && (categoryId === 1 || rawCatName.includes('apartment') || rawCatName.includes('society'));

  const rawPartitionNo = String(
    searchParams?.partitionNo ??
    matchedProp?.partitionNo ??
    propertyDetailsResult?.propertyDetails?.partitionNo ??
    (rawPropObj as Record<string, unknown>)?.partitionNo ??
    (rawDataObj as Record<string, unknown>)?.partitionNo ??
    ''
  ).trim();
  const hasValidPartition = rawPartitionNo !== '' && rawPartitionNo !== '0' && rawPartitionNo !== '-';
  const isApartmentInnerProperty = isApartmentCategory && hasValidPartition;

  const allWings: WingWiseWingDetails[] = isApartmentCategory
    ? [
        ...(wings || []),
        ...(((matchedProp?.wings as unknown as WingWiseWingDetails[]) || [])),
      ]
    : [];

  const searchWingDetailIdParam = isApartmentInnerProperty
    ? (searchParams?.wingDetailId ||
       searchParams?.wingdetailid ||
       searchParams?.wingId ||
       searchParams?.wingid)
    : undefined;

  const targetWingDetailId = isApartmentInnerProperty
    ? (searchWingDetailIdParam ||
       matchedProp?.wingDetailId ||
       matchedProp?.wingId ||
       (rawPropObj as Record<string, unknown>)?.wingDetailId ||
       (rawPropObj as Record<string, unknown>)?.WingDetailId ||
       (rawDataObj as Record<string, unknown>)?.wingDetailId ||
       (rawDataObj as Record<string, unknown>)?.WingDetailId ||
       (rawPropObj as Record<string, unknown>)?.wingId ||
       (rawPropObj as Record<string, unknown>)?.WingId ||
       (rawDataObj as Record<string, unknown>)?.wingId ||
       (rawDataObj as Record<string, unknown>)?.WingId)
    : undefined;

  const matchedWing = isApartmentInnerProperty
    ? allWings.find(
        (w) =>
          (targetWingDetailId && String(w.wingDetailId) === String(targetWingDetailId)) ||
          (targetWingDetailId && String(w.wingMasterId) === String(targetWingDetailId)) ||
          (searchParams?.wingId && String(w.wingMasterId) === String(searchParams.wingId)) ||
          (searchParams?.wingid && String(w.wingMasterId) === String(searchParams.wingid))
      )
    : undefined;

  const searchSocietyDetailIdParam = isApartmentCategory
    ? (searchParams?.societyDetailId ||
       searchParams?.societydetailid ||
       searchParams?.societyId ||
       searchParams?.societyid)
    : undefined;

  const finalSocietyDetailId = isApartmentCategory
    ? (searchSocietyDetailIdParam ||
       matchedProp?.societyDetailId ||
       matchedProp?.societyId ||
       matchedWing?.societyId ||
       matchedWing?.societyDetailId ||
       allWings[0]?.societyId ||
       allWings[0]?.societyDetailId ||
       societyDetails?.societyDetailId ||
       (rawPropObj as Record<string, unknown>)?.societyDetailId ||
       (rawPropObj as Record<string, unknown>)?.SocietyDetailId ||
       (rawDataObj as Record<string, unknown>)?.societyDetailId ||
       (rawDataObj as Record<string, unknown>)?.SocietyDetailId ||
       (rawPropObj as Record<string, unknown>)?.societyId ||
       (rawPropObj as Record<string, unknown>)?.SocietyId ||
       (rawDataObj as Record<string, unknown>)?.societyId ||
       (rawDataObj as Record<string, unknown>)?.SocietyId)
    : undefined;

  const finalWingDetailId = isApartmentInnerProperty
    ? (targetWingDetailId ||
       matchedWing?.wingDetailId ||
       allWings[0]?.wingDetailId)
    : undefined;

  if (isApartmentCategory && finalSocietyDetailId && Number(finalSocietyDetailId) > 0) {
    societyDetails.societyDetailId = Number(finalSocietyDetailId);
    societyDetails.societyId = Number(finalSocietyDetailId);
  } else if (!isApartmentCategory) {
    societyDetails.societyDetailId = undefined;
    societyDetails.societyId = undefined;
  }

  if (isApartmentInnerProperty && finalWingDetailId && Number(finalWingDetailId) > 0) {
    societyDetails.wingDetailId = Number(finalWingDetailId);
    societyDetails.wingId = Number(finalWingDetailId);
  } else {
    societyDetails.wingDetailId = undefined;
    societyDetails.wingId = undefined;
  }

  const searchLatParam = searchParams?.latitude ?? searchParams?.lat;
  const searchLngParam = searchParams?.longitude ?? searchParams?.lng;

  const { latitude, longitude } = extractCoordinates([
    {
      latitude: searchLatParam as string | number | undefined,
      longitude: searchLngParam as string | number | undefined,
      gisCoordinates: (searchParams?.gisCoordinates ?? searchParams?.coordinates) as string | undefined,
    },
    matchedProp as unknown as Record<string, unknown>,
    rawPropObj,
    matchedWing as unknown as Record<string, unknown>,
    societyDetails as unknown as Record<string, unknown>,
    { latitude: societyLatitude, longitude: societyLongitude },
    rawDataObj,
  ]);

  const mappedPropertiesData = mappedPropertiesResult?.success && Array.isArray(mappedPropertiesResult.data)
    ? mappedPropertiesResult.data
    : [];

  const rateableResult = rateableRes ?? undefined;
  const capitalResult = capitalRes ?? undefined;

  const dualSectionData = valuationTab === 'dual' && resolvedPropertyId
    ? await assembleDualMethodSectionData(resolvedPropertyId, oldDetails, rateableRes, capitalRes, dualResult)
    : undefined;

  const taxDetails = taxDetailsRes ?? {
    rateableTaxDetails: null,
    capitalTaxDetails: null,
    rateableTaxError: undefined,
    capitalTaxError: undefined,
  };

  let shouldRedirect = false;
  let redirectUrl = '';

  const resolvedWingName = isApartmentInnerProperty
    ? (matchedWing?.wingName?.trim() ||
       matchedWing?.wingNo?.trim() ||
       propertyDetailsResult.propertyDetails?.wingName?.trim() ||
       propertyDetailsResult.propertyDetails?.wingNo?.trim())
    : undefined;

  if (isApartmentInnerProperty && resolvedWingName) {
    if (propertyDetailsResult.propertyDetails && !propertyDetailsResult.propertyDetails.wingName) {
      propertyDetailsResult.propertyDetails.wingName = resolvedWingName;
    }
    if (propertyDetailsResult.propertyDetails && !propertyDetailsResult.propertyDetails.wingNo && matchedWing?.wingNo) {
      propertyDetailsResult.propertyDetails.wingNo = matchedWing.wingNo;
    }
    if (propertyDetailsResult.propertyDetails && !propertyDetailsResult.propertyDetails.wingDetailId && targetWingDetailId) {
      propertyDetailsResult.propertyDetails.wingDetailId = Number(targetWingDetailId);
    }
  } else if (!isApartmentInnerProperty && propertyDetailsResult.propertyDetails) {
    propertyDetailsResult.propertyDetails.wingDetailId = undefined;
    propertyDetailsResult.propertyDetails.wingName = undefined;
    propertyDetailsResult.propertyDetails.wingNo = undefined;
  }

  const hasSocietyInParams = Boolean(
    searchParams?.societyDetailId ||
    searchParams?.societydetailid ||
    searchParams?.societyId ||
    searchParams?.societyid ||
    searchParams?.societyMasterId ||
    searchParams?.societyMasterid
  );

  const hasWingInParams = Boolean(
    searchParams?.wingDetailId ||
    searchParams?.wingdetailid ||
    searchParams?.wingId ||
    searchParams?.wingid
  );

  const hasSpuriousParams =
    (!isApartmentCategory && hasSocietyInParams) ||
    (!isApartmentInnerProperty && hasWingInParams);

  const hasMissingParams = Boolean(resolvedPropertyId) && (
    !searchParams?.propertyNo ||
    !searchParams?.wardNo ||
    (isApartmentCategory && Boolean(finalSocietyDetailId) && !hasSocietyInParams) ||
    (isApartmentInnerProperty && Boolean(finalWingDetailId) && !hasWingInParams) ||
    (isApartmentInnerProperty && Boolean(resolvedWingName) && !searchParams?.wingName && !searchParams?.wingname)
  );

  const isIdMismatch = Boolean(resolvedPropertyId) && (!propertyIdParam || propertyIdParam !== resolvedPropertyId);

  if (resolvedPropertyId && (isIdMismatch || hasMissingParams || hasSpuriousParams)) {
    const matchedProp = rawPropertyData.find(p => p.propertyId === resolvedPropertyId);
    const finalPropNo = matchedProp?.propertyNo || propertyDetailsResult.propertyDetails?.propertyNo;
    const finalPartNo = matchedProp?.partitionNo ?? propertyDetailsResult.propertyDetails?.partitionNo;
    const finalWardNo = propertyDetailsResult.wardNo || propertyDetailsResult.propertyDetails?.wardNo;
    const finalWardId = resolvedWardId || propertyDetailsResult.wardId;

    const newParams = new URLSearchParams();
    if (searchParams) {
      Object.entries(searchParams).forEach(([k, v]) => {
        if (typeof v === 'string') {
          newParams.set(k, v);
        } else if (Array.isArray(v) && v.length > 0 && typeof v[0] === 'string') {
          newParams.set(k, v[0]);
        }
      });
    }
    newParams.set('propertyId', resolvedPropertyId.toString());

    if (!isApartmentCategory) {
      newParams.delete('societyDetailId');
      newParams.delete('societydetailid');
      newParams.delete('societyId');
      newParams.delete('societyid');
      newParams.delete('societyMasterId');
      newParams.delete('societyMasterid');
    }
    if (!isApartmentInnerProperty) {
      newParams.delete('wingDetailId');
      newParams.delete('wingdetailid');
      newParams.delete('wingId');
      newParams.delete('wingid');
      newParams.delete('wingName');
      newParams.delete('wingname');
    }

    if (finalPropNo && !searchParams?.propertyNo) {
      newParams.set('propertyNo', finalPropNo);
    }
    if (finalPartNo !== undefined && finalPartNo !== null && searchParams?.partitionNo === undefined) {
      newParams.set('partitionNo', normalizePartition(finalPartNo));
    }
    if (finalWardNo && !searchParams?.wardNo) {
      newParams.set('wardNo', finalWardNo);
    }
    if (finalWardId && !searchParams?.wardId) {
      newParams.set('wardId', finalWardId.toString());
    }

    if (isApartmentCategory && finalSocietyDetailId && !hasSocietyInParams) {
      newParams.set('societyDetailId', String(finalSocietyDetailId));
    }
    if (isApartmentInnerProperty && finalWingDetailId && !hasWingInParams) {
      newParams.set('wingDetailId', String(finalWingDetailId));
    }
    if (isApartmentInnerProperty && resolvedWingName && !searchParams?.wingName && !searchParams?.wingname) {
      newParams.set('wingName', resolvedWingName);
    }
    const currentParams = new URLSearchParams();
    if (searchParams) {
      Object.entries(searchParams).forEach(([k, v]) => {
        if (typeof v === 'string') {
          currentParams.set(k, v);
        } else if (Array.isArray(v) && v.length > 0 && typeof v[0] === 'string') {
          currentParams.set(k, v[0]);
        }
      });
    }

    let paramsChanged = false;
    newParams.forEach((val, key) => {
      if (currentParams.get(key) !== val) {
        paramsChanged = true;
      }
    });
    currentParams.forEach((val, key) => {
      if (newParams.get(key) !== val) {
        paramsChanged = true;
      }
    });

    if (paramsChanged) {
      shouldRedirect = true;
      redirectUrl = `/${locale}/property-tax/ptis?${newParams.toString()}`;
    }
  }

  const tabHeaderInfo = tabHeaderInfoResult?.success && tabHeaderInfoResult.data
    ? tabHeaderInfoResult.data : null;

  // Guarantee that the currently resolved property is present in rawPropertyData for pagination
  if (resolvedPropertyId && resolvedPropertyId > 0) {
    const exists = rawPropertyData.some((p) => Number(p.propertyId) === resolvedPropertyId);
    if (!exists) {
      const activePropNo = propertyDetailsResult.propertyDetails?.propertyNo || (searchParams?.propertyNo as string) || '';
      const activePartNo = propertyDetailsResult.propertyDetails?.partitionNo || (searchParams?.partitionNo as string) || '';
      const activeUpic = propertyDetailsResult.propertyDetails?.upicId || (searchParams?.upicId as string) || '';
      const activeOwner = propertyDetailsResult.propertyDetails?.ownerName || '';
      const activeAddress = kycDetails?.address || (propertyDetailsResult.propertyDetails as unknown as { address?: string })?.address || '';
      const currentItem: PropertyListItem = {
        propertyId: resolvedPropertyId,
        propertyNo: activePropNo,
        partitionNo: activePartNo,
        upicId: activeUpic,
        ownerName: activeOwner,
        address: activeAddress,
        displayProperty: activePartNo && activePartNo !== '0' && activePartNo !== '-' ? `${activePropNo}-${activePartNo}` : activePropNo,
        category: categoryId,
        categoryLabel: rawCatName || undefined,
        societyDetailId: finalSocietyDetailId ? Number(finalSocietyDetailId) : null,
        wingDetailId: finalWingDetailId ? Number(finalWingDetailId) : null,
      };

      const insertIndex = rawPropertyData.findIndex((p) => {
        const cmp = (p.propertyNo || '').localeCompare(activePropNo, undefined, { numeric: true, sensitivity: 'base' });
        if (cmp !== 0) return cmp > 0;
        return (p.partitionNo || '').localeCompare(activePartNo, undefined, { numeric: true, sensitivity: 'base' }) > 0;
      });

      if (insertIndex === -1) {
        rawPropertyData.push(currentItem);
      } else {
        rawPropertyData.splice(insertIndex, 0, currentItem);
      }
    }
  }

  return {
    criticalError,
    resolvedPropertyId,
    resolvedWardId,
    propertyDetailsResult,
    rawPropertyData,
    propertyOptions,
    wardOptions,
    kycDetails,
    societyDetails,
    buildingPermission,
    oldDetails,
    oldFloorTableData,
    oldTaxesData,
    discountDetails,
    socialDetails,
    apartmentData,
    rateableResult,
    capitalResult,
    comparisonResult,
    dualSectionData,
    initialPhotoSlots,
    initialPhotos,
    showFloorParam,
    showOldTaxParam,
    showMapDetailsParam,
    showDetailsParam,
    rateableTaxDetails: taxDetails.rateableTaxDetails ?? undefined,
    capitalTaxDetails: taxDetails.capitalTaxDetails ?? undefined,
    rateableTaxError: taxDetails.rateableTaxError,
    capitalTaxError: taxDetails.capitalTaxError,
    shouldRedirect,
    redirectUrl,
    activeTab,
    hasAppliedRules: ruleLogsRes?.success && ruleLogsRes.data && ruleLogsRes.data.items && ruleLogsRes.data.items.length > 0 ? true : false,
    appliedRulesList: ruleLogsRes?.success && ruleLogsRes.data && ruleLogsRes.data.items ? ruleLogsRes.data.items : [],
    latitude,
    longitude,
    societyLatitude,
    societyLongitude,
    waybackReleases,
    tabHeaderInfo,
    mappedPropertiesData,
    wings: allWings,
  };
}
