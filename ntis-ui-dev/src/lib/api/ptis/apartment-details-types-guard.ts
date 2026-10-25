import {
  SurveyPhotoDto,
  SurveyDetailDto,
  DifferenceDetailDto,
  ApartmentWingWiseItemDto,
  WingWisePaginationContainerDto,
  OldTaxDetailItem,
} from '@/types/property-tax/apartment';

function toNullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const str = String(value).trim();
  return str.length > 0 ? str : null;
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function toNumberWithDefault(value: unknown, fallback = 0): number {
  if (value === null || value === undefined || value === '') return fallback;
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

/**
 * Type guard for SurveyPhotoDto
 */
export function isSurveyPhotoShape(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function normalizeSurveyPhoto(data: Record<string, unknown>): SurveyPhotoDto {
  return {
    documentGuid: toNullableString(data.documentGuid),
    photoTypeCode: toNullableString(data.photoTypeCode),
  };
}

/**
 * Type guard for SurveyDetailDto
 */
export function isSurveyDetailShape(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function normalizeSurveyDetail(data: Record<string, unknown> | null | undefined): SurveyDetailDto {
  if (!data || typeof data !== 'object') {
    return {
      id: 0,
      pdnId: null,
      taxZoneId: null,
      zoneNo: null,
      propertyNo: '',
      oldPropertyNo: null,
      partitionNo: null,
      oldPartitionNo: null,
      wardId: null,
      wardNo: null,
      mobileNo: null,
      emailId: null,
      ocNo: null,
      ocDate: null,
      flatOrShopNo: null,
      flatOrShopName: null,
      flatOrShopNoEnglish: null,
      flatOrShopNameEnglish: null,
      ownerName: null,
      ownerNameEnglish: null,
      occupierName: null,
      occupierNameEnglish: null,
      propertyType: null,
      propertyTypeName: null,
      rentYearly: null,
      rentMonthly: null,
      renterName: null,
      renterNameEnglish: null,
      typeOfUse: null,
      typeOfUseCode: null,
      type: null,
      apartmentType: null,
      partType: null,
      bhk: null,
      wing: null,
      noOfRooms: null,
      floor: null,
      floorCode: null,
      subFloor: null,
      subTypeOfUse: null,
      constructionYear: null,
      assessmentYear: null,
      oldAssessmentYear: null,
      oldPropertyTypeName: null,
      oldPropertyTypeCode: null,
      constructionType: null,
      constructionCode: null,
      oldConstructionArea: null,
      constructionArea: null,
      oldConstructionYear: null,
      oldUseType: null,
      oldConstructionType: null,
      oldRV: null,
      oldTotalTax: null,
      totalTax: null,
      oldCSN: null,
      csn: null,
      calculationValue: null,
      capitalValue: null,
      rateableValue: null,
      newTaxTotal: null,
      newTaxTotalCV: null,
      newTaxTotalRV: null,
      retroTaxTotal: null,
      currentDemand: null,
      yearlyRent: null,
      monthlyRate: null,
      yearlyRate: null,
      depreciation: null,
      annualRentalValue: null,
      alv: null,
      maintenance: null,
      sdrr: null,
      baseValue: null,
      floorFactor: null,
      ageFactor: null,
      natureFactor: null,
      useFactor: null,
      floorFactorId: null,
      ageFactorId: null,
      natureFactorId: null,
      useFactorId: null,
      carpetASqMtr: null,
      carpetASqFt: null,
      builtupASqMtr: null,
      builtupASqFt: null,
      propertyPhotoDocumentGuid: null,
      planPhotoDocumentGuid: null,
      photos: [],
      oldTaxDetails: null,
    };
  }

  const rawPhotos = Array.isArray(data.photos) ? data.photos : [];
  const photos = rawPhotos
    .filter(isSurveyPhotoShape)
    .map(normalizeSurveyPhoto);

  return {
    id: toNumberWithDefault(data.id, 0),
    pdnId: toNullableNumber(data.pdnId),
    taxZoneId: toNullableNumber(data.taxZoneId),
    zoneNo: toNullableString(data.zoneNo),
    propertyNo: toNullableString(data.propertyNo) ?? '',
    oldPropertyNo: toNullableString(data.oldPropertyNo),
    partitionNo: toNullableString(data.partitionNo ?? data.partNo ?? data.partition ?? data.partitionNumber),
    oldPartitionNo: toNullableString(data.oldPartitionNo),
    propertyFloorId: toNullableNumber(data.propertyFloorId),
    wingDetailId: toNullableNumber(data.wingDetailId ?? data.wingDetailsId),
    wardId: toNullableNumber(data.wardId),
    wardNo: toNullableString(data.wardNo),
    mobileNo: toNullableString(data.mobileNo),
    emailId: toNullableString(data.emailId),
    ocNo: toNullableString(data.ocNo),
    ocDate: toNullableString(data.ocDate),
    flatOrShopNo: toNullableString(data.flatOrShopNo),
    flatOrShopName: toNullableString(data.flatOrShopName),
    flatOrShopNoEnglish: toNullableString(data.flatOrShopNoEnglish),
    flatOrShopNameEnglish: toNullableString(data.flatOrShopNameEnglish),
    ownerName: toNullableString(data.ownerName),
    ownerNameEnglish: toNullableString(data.ownerNameEnglish),
    occupierName: toNullableString(data.occupierName),
    occupierNameEnglish: toNullableString(data.occupierNameEnglish),
    propertyType: toNullableNumber(data.propertyType),
    propertyTypeName: toNullableString(data.propertyTypeName),
    rentYearly: toNullableNumber(data.rentYearly),
    rentMonthly: toNullableNumber(data.rentMonthly),
    renterName: toNullableString(data.renterName),
    renterNameEnglish: toNullableString(data.renterNameEnglish),
    typeOfUse: toNullableString(data.typeOfUse),
    typeOfUseCode: toNullableString(data.typeOfUseCode),
    type: toNullableString(data.type),
    apartmentType: toNullableString(data.apartmentType),
    partType: toNullableString(data.partType),
    bhk: toNullableString(data.bhk),
    wing: toNullableString(data.wing),
    noOfRooms: toNullableNumber(data.noOfRooms),
    floor: toNullableString(data.floor),
    floorCode: toNullableString(data.floorCode),
    subFloor: toNullableString(data.subFloor),
    subTypeOfUse: toNullableString(data.subTypeOfUse),
    constructionYear: toNullableString(data.constructionYear),
    assessmentYear: toNullableString(data.assessmentYear),
    oldAssessmentYear: toNullableString(data.oldAssessmentYear),
    oldPropertyTypeName: toNullableString(data.oldPropertyTypeName),
    oldPropertyTypeCode: toNullableString(data.oldPropertyTypeCode),
    constructionType: toNullableString(data.constructionType),
    constructionCode: toNullableString(data.constructionCode),
    oldConstructionArea: toNullableNumber(data.oldConstructionArea ?? data.constructionArea),
    constructionArea: toNullableNumber(data.constructionArea ?? data.oldConstructionArea),
    oldConstructionYear: toNullableString(data.oldConstructionYear),
    oldUseType: toNullableString(data.oldUseType),
    oldConstructionType: toNullableString(data.oldConstructionType),
    oldRV: toNullableNumber(data.oldRV ?? data.rateableValue),
    totalTax: toNullableNumber(data.totalTax ?? data.oldTotalTax),
    oldTotalTax: toNullableNumber(data.oldTotalTax ?? data.totalTax),
    oldCSN: toNullableString(data.oldCSN ?? data.csn),
    csn: toNullableString(data.csn ?? data.oldCSN),
    calculationValue: toNullableNumber(data.calculationValue),
    capitalValue: toNullableNumber(data.capitalValue),
    rateableValue: toNullableNumber(data.rateableValue ?? data.oldRV),
    newTaxTotal: toNullableNumber(data.newTaxTotal),
    newTaxTotalCV: toNullableNumber(data.newTaxTotalCV),
    newTaxTotalRV: toNullableNumber(data.newTaxTotalRV),
    retroTaxTotal: toNullableNumber(data.retroTaxTotal),
    currentDemand: toNullableNumber(data.currentDemand),
    yearlyRent: toNullableNumber(data.yearlyRent),
    monthlyRate: toNullableNumber(data.monthlyRate),
    yearlyRate: toNullableNumber(data.yearlyRate),
    depreciation: toNullableNumber(data.depreciation),
    annualRentalValue: toNullableNumber(data.annualRentalValue ?? data.alv),
    alv: toNullableNumber(data.alv ?? data.annualRentalValue),
    maintenance: toNullableNumber(data.maintenance),
    sdrr: toNullableNumber(data.sdrr),
    baseValue: toNullableNumber(data.baseValue),
    floorFactor: toNullableNumber(data.floorFactor),
    ageFactor: toNullableNumber(data.ageFactor),
    natureFactor: toNullableNumber(data.natureFactor),
    useFactor: toNullableNumber(data.useFactor),
    floorFactorId: toNullableNumber(data.floorFactorId),
    ageFactorId: toNullableNumber(data.ageFactorId),
    natureFactorId: toNullableNumber(data.natureFactorId),
    useFactorId: toNullableNumber(data.useFactorId),
    carpetASqMtr: toNullableNumber(data.carpetASqMtr),
    carpetASqFt: toNullableNumber(data.carpetASqFt),
    builtupASqMtr: toNullableNumber(data.builtupASqMtr),
    builtupASqFt: toNullableNumber(data.builtupASqFt),
    propertyPhotoDocumentGuid: toNullableString(data.propertyPhotoDocumentGuid),
    planPhotoDocumentGuid: toNullableString(data.planPhotoDocumentGuid),
    photos,
    oldTaxDetails: Array.isArray(data.oldTaxDetails)
      ? (data.oldTaxDetails as OldTaxDetailItem[]).map((t) => ({
          id: toNumberWithDefault(t.id, 0),
          propertyMastOldId: toNullableNumber(t.propertyMastOldId),
          financeYearId: toNullableNumber(t.financeYearId),
          calculationType: toNullableString(t.calculationType),
          calculationValue: toNullableNumber(t.calculationValue),
          calculationAnnualValue: toNullableNumber(t.calculationAnnualValue),
          taxId: toNumberWithDefault(t.taxId, 0),
          taxName: toNullableString(t.taxName) || '',
          taxAmount: toNumberWithDefault(t.taxAmount, 0),
        }))
      : null,
  };
}

/**
 * Type guard for DifferenceDetailDto
 */
export function isDifferenceDetailShape(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function normalizeDifferenceDetail(
  data: Record<string, unknown> | null | undefined
): DifferenceDetailDto {
  if (!data || typeof data !== 'object') {
    return {
      carpetAreaSqMeterDiff: 0,
      carpetAreaSqFeetDiff: 0,
      builtupAreaSqMeterDiff: 0,
      builtupAreaSqFeetDiff: 0,
      rateableValueDiff: 0,
      capitalValueDiff: 0,
      totalTaxDiff: 0,
      retroTaxDiff: 0,
    };
  }

  return {
    carpetAreaSqMeterDiff: toNumberWithDefault(data.carpetAreaSqMeterDiff, 0),
    carpetAreaSqFeetDiff: toNumberWithDefault(data.carpetAreaSqFeetDiff, 0),
    builtupAreaSqMeterDiff: toNumberWithDefault(data.builtupAreaSqMeterDiff, 0),
    builtupAreaSqFeetDiff: toNumberWithDefault(data.builtupAreaSqFeetDiff, 0),
    rateableValueDiff: toNumberWithDefault(data.rateableValueDiff, 0),
    capitalValueDiff: toNumberWithDefault(data.capitalValueDiff, 0),
    totalTaxDiff: toNumberWithDefault(data.totalTaxDiff, 0),
    retroTaxDiff: toNumberWithDefault(data.retroTaxDiff, 0),
  };
}

/**
 * Type guard for ApartmentWingWiseItemDto
 */
export function isApartmentWingWiseItemShape(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return 'newSurvey' in obj || 'oldSurvey' in obj || 'id' in obj;
}

export function normalizeApartmentWingWiseItem(data: Record<string, unknown>): ApartmentWingWiseItemDto {
  const newSurveyRaw = (data.newSurvey ?? data.newSurveyDetail ?? data) as Record<string, unknown> | undefined;
  const mergedNewSurveyRaw = newSurveyRaw
    ? {
        ...newSurveyRaw,
        partitionNo: newSurveyRaw.partitionNo ?? data.partitionNo ?? data.partNo ?? data.partition,
      }
    : undefined;
  const oldSurveyRaw = (data.oldSurvey ?? data.oldSurveyDetail) as Record<string, unknown> | undefined;
  const diffRaw = (data.difference ?? data.differenceDetail) as Record<string, unknown> | undefined;

  const oldSurveyWithTaxes = oldSurveyRaw
    ? {
        ...oldSurveyRaw,
        oldTaxDetails: oldSurveyRaw.oldTaxDetails ?? data.oldTaxDetails,
        partitionNo: oldSurveyRaw.partitionNo ?? oldSurveyRaw.oldPartitionNo ?? data.oldPartitionNo ?? data.partitionNo,
      }
    : data.oldTaxDetails
    ? { oldTaxDetails: data.oldTaxDetails, partitionNo: data.oldPartitionNo ?? data.partitionNo }
    : undefined;

  return {
    newSurvey: normalizeSurveyDetail(mergedNewSurveyRaw),
    oldSurvey: normalizeSurveyDetail(oldSurveyWithTaxes),
    difference: normalizeDifferenceDetail(diffRaw),
  };
}

/**
 * Type guard for WingWisePaginationContainerDto
 */
export function isWingWisePaginationContainerShape(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return Array.isArray(obj.items);
}

export function normalizeWingWisePaginationContainer(
  data: Record<string, unknown>
): WingWisePaginationContainerDto {
  const rawItems = Array.isArray(data.items) ? data.items : [];
  const normalizedItems = rawItems
    .filter(isApartmentWingWiseItemShape)
    .map(normalizeApartmentWingWiseItem);

  return {
    items: normalizedItems,
    totalCount: toNumberWithDefault(data.totalCount, normalizedItems.length),
    pageNumber: toNumberWithDefault(data.pageNumber, 1),
    pageSize: toNumberWithDefault(data.pageSize, normalizedItems.length || 10),
    totalPages: toNumberWithDefault(data.totalPages, 1),
    hasPrevious: Boolean(data.hasPrevious),
    hasNext: Boolean(data.hasNext),
  };
}
