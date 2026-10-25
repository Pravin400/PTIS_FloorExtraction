import 'server-only';

import { fetchPtisPageData } from '@/app/[locale]/property-tax/ptis/ptis-fetch.service';
import { fetchWardIdAction } from '@/app/[locale]/property-tax/ptis/actions';
import { buildInitialPropertyMasterData, type PtisPageData } from './apartment-master-builder';
import { toSafeString } from '@/lib/utils/format';
import {
  ApartmentQCTopSectionBelowFlexItemsDto,
  ApartmentQCTopSectionBelowFlexResponseDto,
  WingWiseDetailsItems,
} from '@/types/property-tax/apartment';
import { PtisInitialData } from '@/types/ptis.types';
import {
  getApartmentQcTopSectionAction,
  getApartmentQCTopSectionBelowFlex,
  getWingWiseDetails,
  getApartmentTaxDetails,
} from '@/lib/api/ptis/apartment';
import type { PropertyMasterData, ApartmentTaxDetailsItem } from '@/types/property-tax/apartment';
import type { PropertyWorkflowStage } from '@/types/propertyWorkflowStage.types';
import { propertyWorkflowStageService } from '@/lib/api/ptis/propertyWorkflowStage/propertyWorkflowStage.service';
import { extractCoordinates } from '@/lib/utils/coordinate-utils';
import { DEFAULT_WAYBACK_RELEASES } from '@/lib/api/wayback.service';

export interface LoadedApartmentPageData {
  wardNo: string;
  wardId: string;
  propertyNo: string;
  partitionNo: string;
  resolvedPropertyId?: number;
  isMainProp: boolean;
  currentCategoryId?: number;
  currentPropertyTypeId?: number;
  currentType: string | null;
  currentSocietyDetailId?: number;
  workflowStages: PropertyWorkflowStage[];
  currentWorkflowStageId?: number;
  pageData: PtisPageData;
  rawData: WingWiseDetailsItems | null;
  initialData: PtisInitialData;
  initialPropertyMasterData?: PropertyMasterData;
  initialQcTopSectionBelowFlex?:
    | ApartmentQCTopSectionBelowFlexItemsDto
    | ApartmentQCTopSectionBelowFlexResponseDto
    | Record<string, unknown>
    | null;
  initialApartmentTaxDetails: ApartmentTaxDetailsItem | null;
  isApartmentSocietyProperty: boolean;
  societyLatitude?: number;
  societyLongitude?: number;
  initialCertificateGrid?: unknown;
  initialMasterTypes?: unknown[] | null;
}

export async function loadApartmentPageData(
  searchParams: Record<string, string | string[] | undefined> | undefined,
  locale: string
): Promise<LoadedApartmentPageData> {
  const resolvedSearchParams = searchParams || {};
  const propertyIdRaw = resolvedSearchParams?.propertyId
    ? parseInt(resolvedSearchParams.propertyId as string, 10)
    : NaN;
  const isPropIdValid = Number.isFinite(propertyIdRaw) && propertyIdRaw > 0;

  const wardNo = toSafeString(resolvedSearchParams.wardNo);
  const wardId = toSafeString(resolvedSearchParams.wardId);
  const propertyNo = toSafeString(resolvedSearchParams.propertyNo);
  const rawPartitionNo = toSafeString(resolvedSearchParams.partitionNo);
  const partitionNo = rawPartitionNo === '0' ? '' : rawPartitionNo;

  const initialTaxModeParam = (resolvedSearchParams?.taxMode as string) || 'rateable';
  const initialTaxType =
    initialTaxModeParam === 'capital' ? 'CV' : initialTaxModeParam === 'dual' ? 'Dual' : 'RV';

  // Fast Early Section Parallel Fetch:
  // Mirrors individual screen - only awaits critical early-section data needed for immediate display.
  // Secondary modals (certificates, society photos, discount details) load on-demand client side.
  const [
    initialWardIdResult,
    workflowStagesResult,
    pageData,
    currentWorkflow,
    earlyTopSectionRes,
    earlyBelowFlexRes,
    earlyWingWiseRes,
    earlyTaxDetailsRes,
  ] = await Promise.all([
    !wardId && wardNo ? fetchWardIdAction(wardNo).catch(() => null) : Promise.resolve(null),
    propertyWorkflowStageService.getWorkflowStages().catch(() => null),
    fetchPtisPageData(
      {
        ...resolvedSearchParams,
        wardId: wardId || undefined,
        tab: 'apartment',
        valuationTab: 'apartment',
      },
      locale
    ),
    isPropIdValid
      ? propertyWorkflowStageService.getCurrentWorkflowDetail(propertyIdRaw).catch(() => null)
      : Promise.resolve(null),
    isPropIdValid ? getApartmentQcTopSectionAction(propertyIdRaw).catch(() => null) : Promise.resolve(null),
    (isPropIdValid || (wardId && propertyNo))
      ? getApartmentQCTopSectionBelowFlex({
          propertyId: isPropIdValid ? propertyIdRaw : undefined,
          ward: wardId || undefined,
          propertyNo: propertyNo || undefined,
          partitionNo: partitionNo || undefined,
        }).catch(() => null)
      : Promise.resolve(null),
    wardId && propertyNo
      ? getWingWiseDetails(wardId, propertyNo).catch(() => null)
      : Promise.resolve(null),
    wardId && propertyNo
      ? getApartmentTaxDetails({ wardId, propertyNo, taxType: initialTaxType }).catch(() => null)
      : Promise.resolve(null),
  ]);

  const workflowStages =
    workflowStagesResult?.success && workflowStagesResult.data ? workflowStagesResult.data : [];
  const currentWorkflowStageId = currentWorkflow?.success
    ? currentWorkflow.data?.workflowStageId
    : undefined;

  const { resolvedPropertyId: pDataPropId, resolvedWardId: pDataWardId } = pageData;
  const resolvedPropertyId = isPropIdValid ? propertyIdRaw : pDataPropId;
  const finalWardId = (wardId || initialWardIdResult?.data?.wardId?.toString() || (pDataWardId ? String(pDataWardId) : '')).trim();
  const targetPropNo = propertyNo || pageData.propertyDetailsResult?.propertyDetails?.propertyNo || '';

  // Late fallback only if property ID or ward was resolved from pageData (not initial URL params)
  const needsLateTopSection = !earlyTopSectionRes?.success && Boolean(resolvedPropertyId);
  const needsLateBelowFlex = !earlyBelowFlexRes?.success && (Boolean(resolvedPropertyId) || Boolean(finalWardId && targetPropNo));
  const needsLateWingWise = (!earlyWingWiseRes || !earlyWingWiseRes.wings || earlyWingWiseRes.wings.length === 0) && Boolean(finalWardId && targetPropNo);
  const needsLateTaxDetails = !earlyTaxDetailsRes && Boolean(finalWardId && targetPropNo);

  const [lateTopSectionRes, lateBelowFlexRes, lateWingWiseRes, lateTaxDetailsRes] =
    (needsLateTopSection || needsLateBelowFlex || needsLateWingWise || needsLateTaxDetails)
      ? await Promise.all([
          needsLateTopSection && resolvedPropertyId
            ? getApartmentQcTopSectionAction(resolvedPropertyId).catch(() => null)
            : Promise.resolve(null),
          needsLateBelowFlex
            ? getApartmentQCTopSectionBelowFlex({
                propertyId: resolvedPropertyId || undefined,
                ward: finalWardId || undefined,
                propertyNo: targetPropNo || undefined,
                partitionNo: partitionNo || undefined,
              }).catch(() => null)
            : Promise.resolve(null),
          needsLateWingWise
            ? getWingWiseDetails(finalWardId, targetPropNo).catch(() => null)
            : Promise.resolve(null),
          needsLateTaxDetails
            ? getApartmentTaxDetails({
                wardId: finalWardId,
                propertyNo: targetPropNo,
                taxType: initialTaxType,
              }).catch(() => null)
            : Promise.resolve(null),
        ])
      : [null, null, null, null];

  const topSectionRes = lateTopSectionRes?.success ? lateTopSectionRes : (earlyTopSectionRes || lateTopSectionRes);
  const belowFlexRes =
    (earlyBelowFlexRes?.success ? earlyBelowFlexRes : lateBelowFlexRes) ||
    earlyBelowFlexRes ||
    lateBelowFlexRes;
  let finalWingWiseRes = earlyWingWiseRes || lateWingWiseRes;

  if ((!finalWingWiseRes || !finalWingWiseRes.wings || finalWingWiseRes.wings.length === 0) && pageData.wings && pageData.wings.length > 0) {
    finalWingWiseRes = {
      ...(finalWingWiseRes || {}),
      wardId: Number(finalWardId) || 0,
      wardNo: wardNo || pageData.propertyDetailsResult?.propertyDetails?.wardNo || '',
      propertyNo: targetPropNo,
      wings: pageData.wings,
    } as unknown as WingWiseDetailsItems;
  }

  const rawData = finalWingWiseRes || null;
  const taxDetailsRes = earlyTaxDetailsRes || lateTaxDetailsRes;
  const initialApartmentTaxDetails =
    taxDetailsRes?.success && taxDetailsRes.items ? taxDetailsRes.items : null;
  const initialQcTopSectionBelowFlex =
    belowFlexRes?.success && (belowFlexRes.items || belowFlexRes.data)
      ? (belowFlexRes.items ?? belowFlexRes.data ?? null)
      : ((belowFlexRes?.items || belowFlexRes?.data) ?? null);

  const initialData: PtisInitialData = {
    propertyDetails: pageData.propertyDetailsResult?.propertyDetails || null,
    kycDetails: pageData.kycDetails,
    societyDetails: pageData.societyDetails,
    buildingPermission: pageData.buildingPermission,
    wardOptions: pageData.wardOptions,
    propertyOptions: pageData.propertyOptions,
    rawPropertyData: pageData.rawPropertyData,
    oldDetails: pageData.oldDetails,
    oldFloorTableData: pageData.oldFloorTableData,
    showOldFloorInfo: pageData.showFloorParam,
    oldTaxesData: pageData.oldTaxesData,
    showOldTaxInfo: pageData.showOldTaxParam,
    showOldMapInfo: pageData.showMapDetailsParam,
    discountDetails: pageData.discountDetails,
    socialDetails: pageData.socialDetails,
    tabHeaderInfo: pageData.tabHeaderInfo,
    mappedPropertiesData: pageData.mappedPropertiesData,
  };

  const currentSocietyDetailId =
    (pageData.societyDetails as unknown as { societyDetailId?: number })?.societyDetailId ??
    (pageData.propertyDetailsResult?.propertyDetails as unknown as { societyDetailId?: number })
      ?.societyDetailId ??
    rawData?.societyId ??
    (
      rawData?.wings?.find(
        (w) =>
          (w as unknown as { societyDetailId?: number })?.societyDetailId ||
          (w as unknown as { societyId?: number })?.societyId
      ) as unknown as { societyDetailId?: number; societyId?: number }
    )?.societyDetailId ??
    (
      rawData?.wings?.find(
        (w) =>
          (w as unknown as { societyDetailId?: number })?.societyDetailId ||
          (w as unknown as { societyId?: number })?.societyId
      ) as unknown as { societyDetailId?: number; societyId?: number }
    )?.societyId ??
    undefined;

  const baseData = topSectionRes?.success && topSectionRes.data ? topSectionRes.data : undefined;
  const initialPropertyMasterData = buildInitialPropertyMasterData({
    resolvedPropertyId,
    baseData,
    pageData,
    wardNo,
    propertyNo,
    rawData,
    initialApartmentTaxDetails,
  });

  if (pageData.latitude === undefined || pageData.longitude === undefined) {
    const aptCoords = extractCoordinates([
      { latitude: pageData.latitude, longitude: pageData.longitude },
      pageData.propertyDetailsResult?.propertyDetails as unknown as Record<string, unknown>,
      ...(rawData?.wings || []).map((w) => w as unknown as Record<string, unknown>),
      rawData as unknown as Record<string, unknown>,
      initialPropertyMasterData as unknown as Record<string, unknown>,
      pageData.societyDetails as unknown as Record<string, unknown>,
      { latitude: pageData.societyLatitude, longitude: pageData.societyLongitude },
    ]);
    if (aptCoords.hasCoords) {
      pageData.latitude = aptCoords.latitude;
      pageData.longitude = aptCoords.longitude;
    }
  }

  if (!pageData.waybackReleases || pageData.waybackReleases.length === 0) {
    pageData.waybackReleases = DEFAULT_WAYBACK_RELEASES;
  }

  const currentCategoryId =
    pageData.propertyDetailsResult?.propertyDetails?.categoryId ??
    initialPropertyMasterData?.categoryId ??
    undefined;
  const currentCategoryName =
    pageData.tabHeaderInfo?.category ?? initialPropertyMasterData?.category ?? '';
  const isIndividual =
    currentCategoryId === 2 || String(currentCategoryName).toLowerCase().includes('individual');
  const isApartment =
    currentCategoryId === 1 ||
    currentCategoryId === 0 ||
    String(currentCategoryName).toLowerCase().includes('apartment') ||
    (!isIndividual &&
      (Boolean(rawData?.societyId) ||
        Boolean(rawData?.wings && rawData.wings.length > 0) ||
        Boolean(pageData.societyDetails?.societyDetailId)));
  const isMainProp =
    isApartment &&
    (!partitionNo ||
      partitionNo === '0' ||
      partitionNo.trim() === '' ||
      partitionNo.trim() === '-');
  const currentPropertyTypeId =
    (pageData.propertyDetailsResult?.propertyDetails as unknown as { propertyTypeId?: number })
      ?.propertyTypeId ??
    initialPropertyMasterData?.propertyTypeId ??
    undefined;
  const currentType =
    pageData.tabHeaderInfo?.type ??
    (pageData.propertyDetailsResult?.propertyDetails as unknown as { type?: string })?.type ??
    (initialPropertyMasterData as unknown as { type?: string })?.type ??
    null;

  const isApartmentSocietyProperty =
    isMainProp ||
    currentCategoryId === 0 ||
    String(currentCategoryName).toLowerCase() === 'apartment society property';

  return {
    wardNo,
    wardId,
    propertyNo,
    partitionNo,
    resolvedPropertyId,
    isMainProp,
    currentCategoryId,
    currentPropertyTypeId,
    currentType,
    currentSocietyDetailId,
    workflowStages,
    currentWorkflowStageId,
    pageData,
    rawData,
    initialData,
    initialPropertyMasterData,
    initialQcTopSectionBelowFlex,
    initialApartmentTaxDetails,
    isApartmentSocietyProperty,
    societyLatitude: pageData.societyLatitude,
    societyLongitude: pageData.societyLongitude,
    initialCertificateGrid: null,
    initialMasterTypes: null,
  };
}
