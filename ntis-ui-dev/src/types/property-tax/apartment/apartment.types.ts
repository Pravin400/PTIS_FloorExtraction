/**
 * PTIS Apartment Module Type Definitions & API Schemas
 */

export interface SurveyPhotoDto {
  documentGuid?: string | null;
  photoTypeCode?: string | null;
}

export interface OldTaxDetailItem {
  id?: number;
  propertyMastOldId?: number | null;
  financeYearId?: number | null;
  calculationType?: string | null;
  calculationValue?: number | null;
  calculationAnnualValue?: number | null;
  taxId?: number;
  taxName?: string;
  taxAmount?: number;
}

export interface SurveyDetailDto {
  id?: number;
  pdnId?: number | null;
  taxZoneId?: number | null;
  zoneNo?: string | null;
  propertyNo?: string | null;
  oldPropertyNo?: string | null;
  partitionNo?: string | null;
  propertyFloorId?: number | null;
  wardId?: number | null;
  wardNo?: string | null;
  mobileNo?: string | null;
  emailId?: string | null;
  ocDate?: string | null;
  flatOrShopNo?: string | null;
  flatOrShopName?: string | null;
  flatOrShopNoEnglish?: string | null;
  flatOrShopNameEnglish?: string | null;
  ownerName?: string | null;
  ownerNameEnglish?: string | null;
  occupierName?: string | null;
  occupierNameEnglish?: string | null;
  propertyType?: number | null;
  propertyTypeName?: string | null;
  rentYearly?: number | null;
  rentMonthly?: number | null;
  renterName?: string | null;
  renterNameEnglish?: string | null;
  typeOfUse?: string | null;
  typeOfUseCode?: string | null;
  type?: string | null;
  apartmentType?: string | null;
  partType?: string | null;
  bhk?: string | null;
  wing?: string | null;
  wingDetailId?: number | null;
  noOfRooms?: number | null;
  floor?: string | null;
  floorCode?: string | null;
  subFloor?: string | null;
  subTypeOfUse?: string | null;
  constructionYear?: string | null;
  assessmentYear?: string | null;
  constructionType?: string | null;
  constructionCode?: string | null;
  constructionArea?: number | null;
  oldConstructionArea?: number | null;
  oldConstructionYear?: string | null;
  oldAssessmentYear?: string | null;
  oldAssessmentDate?: string | null;
  oldPropertyTypeId?: number | null;
  /** Name and short code (R, C, I, N) of the old property type. */
  oldPropertyTypeName?: string | null;
  oldPropertyTypeCode?: string | null;
  oldPartitionNo?: string | null;
  oldEgovNo?: string | null;
  oldPlotNo?: string | null;
  oldConstructionTypeOfUseId?: string | null;
  oldUseType?: string | null;
  oldConstructionType?: string | null;
  oldRV?: number | null;
  oldTotalTax?: number | null;
  totalTax?: number | null;
  oldCSN?: string | null;
  csn?: string | null;
  calculationValue?: number | null;
  capitalValue?: number | null;
  rateableValue?: number | null;
  newTaxTotal?: number | null;
  newTaxTotalCV?: number | null;
  newTaxTotalRV?: number | null;
  retroTaxTotal?: number | null;
  currentDemand?: number | null;
  yearlyRent?: number | null;
  monthlyRate?: number | null;
  yearlyRate?: number | null;
  depreciation?: number | null;
  annualRentalValue?: number | null;
  alv?: number | null;
  maintenance?: number | null;
  sdrr?: number | null;
  baseValue?: number | null;
  floorFactor?: number | null;
  ageFactor?: number | null;
  natureFactor?: number | null;
  useFactor?: number | null;
  floorFactorId?: number | null;
  ageFactorId?: number | null;
  natureFactorId?: number | null;
  useFactorId?: number | null;
  carpetASqMtr?: number | null;
  carpetASqFt?: number | null;
  builtupASqMtr?: number | null;
  builtupASqFt?: number | null;
  ocNo?: string | null;
  occupancyNumber?: string | null;
  occupancyDate?: string | null;
  appliedOn?: string | null;
  depreciationPer?: number | null;
  propertyPhotoDocumentGuid?: string | null;
  planPhotoDocumentGuid?: string | null;
  photos?: SurveyPhotoDto[] | null;
  oldTaxDetails?: OldTaxDetailItem[] | null;
}

export interface DifferenceDetailDto {
  carpetAreaSqMeterDiff?: number | null;
  carpetAreaSqFeetDiff?: number | null;
  builtupAreaSqMeterDiff?: number | null;
  builtupAreaSqFeetDiff?: number | null;
  rateableValueDiff?: number | null;
  capitalValueDiff?: number | null;
  totalTaxDiff?: number | null;
  retroTaxDiff?: number | null;
}

export interface ApartmentWingWiseItemDto {
  newSurvey: SurveyDetailDto;
  oldSurvey: SurveyDetailDto;
  difference: DifferenceDetailDto;
}

export interface WingWisePaginationContainerDto {
  items: ApartmentWingWiseItemDto[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface ApartmentDetailsWingWiseResponseDto {
  success: boolean;
  message?: string | null;
  data?: WingWisePaginationContainerDto | null;
  items?: WingWisePaginationContainerDto | ApartmentWingWiseItemDto[] | null;
  errors?: string[] | null;
  correlationId?: string | null;
}

export interface SearchWingWiseFilters {
  wingDetailId?: number | null;
  propertyId?: number | null;
  wingId?: number | null;
  societyId?: number | null;
  wingName?: string | null;
  floor?: string | null;
  pageNumber?: number | null;
  pageSize?: number | null;
  searchTerm?: string | null;
  sortBy?: string | null;
  sortOrder?: string | null;
  filterLogic?: number | null;
}

export * from './unit.types';

