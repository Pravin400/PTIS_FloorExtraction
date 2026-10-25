import type { PTISSearchSelectOption as SearchSelectOption } from '@/components/common/PTISSearchSelect';
import type { DiscountData, BuildingPermissionData } from './ptis-core.types';
export const PTIS_TABS = [
  'propertydetails',
  'kycdetails',
  'societydetails',
  'buildingpermission',
  'discountdetails',
  'olddetails',
] as const;
export type PtisTabId = (typeof PTIS_TABS)[number];

// Separate constant/type for valuation tabs
export const VALUATION_TABS = ['rateable', 'capital', 'dual', 'reassessment', 'apartment'] as const;
export type ValuationTabId = (typeof VALUATION_TABS)[number];

/** Maximum number of properties to fetch for a single ward to prevent OOM / backend overload. */
export const MAX_PROPERTY_FETCH = 500;

export interface PropertyDetailsData {
  division: string;
  wardNo: string;
  blockNo: string;
  propertyNo: string;
  partitionNo: string;
  flatOrShopNo: string;
  upicId: string;
  taxZoneNo: string;
  subZoneNo: string;
  surveyNo: string;
  plotNo: string;
  propertyDescription: string;
  plotArea: string;
  totalCarpetArea: string;
  builtupArea: string;
  category?: string;
  wingNo?: string;
  wingName?: string;
  moujaNo?: string;
  moujaDescription?: string;
  noOfResidentialToilets?: string;
  noOfCommercialToilets?: string;
  ownerName?: string;
  categoryId?: number;
  wingId?: number;
  wingDetailId?: number;
  rateSectionDescription?: string;
  latitude?: string | null;
  longitude?: string | null;
  constructionYear?: string | null;
  oldCarpetArea?: string;
  oldBuiltupArea?: string;
}

export interface KYCDetailsData {
  ownerType: string;
  title: string;
  ownerName?: string;
  ownerNameEnglish?: string;
  ownerNameRegional?: string;
  propertyHolderName: string;
  propertyHolderNameMarathi: string;
  propertyHolderNameEnglish?: string;
  occupierName: string;
  occupierNameMarathi: string;
  occupierNameEnglish?: string;
  aadharCardNo: string;
  mobileNumber: string;
  email: string;
  shopName: string;
  shopNameEnglish?: string;
  address: string;
  addressEnglish?: string;
  wingNo: string;
  flatNo: string;
  shopNo: string;
  buildingName?: string;
  alternateMobileNo?: string;
  pinCode?: string;
}

export interface SocietyDetailsData {
  buildingSocietyName: string;
  buildingSocietyNameMarathi: string;
  builderName: string;
  builderNameMarathi: string;
  landOwner: string;
  secretaryName: string;
  secretaryNameMarathi: string;
  secretaryMobileNo: string;
  secretaryEmail: string;
  societyEmail: string;
  societyEmailMain: string;
  ocDate: string;
  ocNumber: string;
  societyAddress: string;
  societyAddressMarathi: string;
  managerName: string;
  managerEmail: string;
  managerMobileNo: string;
  societyDetailId?: number;
  societyId?: number | null;
  wingDetailId?: number | null;
  wingId?: number | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
}

export interface OldDetailsData {
  oldZoneName: string;
  oldWardNo: string;
  oldPropertyNo: string;
  oldPartitionNo: string;
  oldEGovernanceNo: string;
  oldPlotArea: string;
  oldPlotNo: string;
  oldRV: string;
  oldCV: string;
  oldALV: string;
  oldPropertyTax: string;
  oldTotalTax: string;
  oldConstructionYear?: string;
  oldCarpetAreaSqMeter?: string;
  oldCarpetAreaSqFeet?: string;
  oldBuiltupAreaSqMeter?: string;
  oldBuiltupAreaSqFeet?: string;
  oldConstructionTypeId?: string;
  oldTypeOfUseId?: string;
  oldConstructionArea?: string;
  oldGeneralTax?: string;
  extra?: Record<string, unknown>;
}

export interface OldFloorDetailsData {
  wardPropPartNo: string; // combined "oldWardNo - oldPropertyNo - oldPartitionNo"
  floor: string;
  subFloor: string;
  assessmentYear: string;
  year: string;
  constructionType: string;
  typeOfUse: string;
  subType: string;
  carpetArea: string; // "Sq.ft / Sq.Mtr"
  builtupArea: string; // "Sq.ft / Sq.Mtr"
}

export interface WardIdentifiable {
  wardNo?: string;
  wardId?: number | string;
}

export interface PropertyIdentifiable extends WardIdentifiable {
  propertyNo: string;
  partitionNo?: string | null;
  propertyId?: number | string;
}

export interface PropertySearchParams extends Partial<PropertyIdentifiable> {
  upicId?: string;
}

export interface PropertySearchResult extends PropertyIdentifiable {
  id?: string | number;

  ownerName?: string;
  ownerNameEnglish?: string;
  ownerTitle?: string;
  ownerTitleEnglish?: string;
  occupierName?: string;
  occupierNameEnglish?: string;
  occupierTitle?: string;
  occupierTitleEnglish?: string;

  address?: string;
  addressEnglish?: string;
  location?: string;
  locationEnglish?: string;

  upicId?: string;

  taxZoneId?: number | string;
  subZoneNo?: string;
  plotNo?: string;
  plotArea?: number;
  csn?: string;

  categoryId?: number;
  categoryName?: string;
  category?: string;
  subCategoryName?: string;
  subCategory?: string;

  flatOrShopNo?: string;
  flatOrShopName?: string;
  flatOrShopNoEnglish?: string;
  flatOrShopNameEnglish?: string;

  mobileNo?: string;
  emailId?: string;
  wingNo?: string;

  openPlot?: boolean;
  propertyTypeId?: number;
  ownerType?: string;
  societyDetailId?: number | null;
  markedForDeletion?: boolean;
  displayProperty?: string;
  isActive?: boolean;
  createdDate?: string;
  updatedDate?: string;
}

export interface PropertyListItem extends PropertyIdentifiable {
  propertyId: number;
  propertyNo: string;
  partitionNo: string;
  upicId: string;
  ownerName: string;
  address: string;
  displayProperty: string;
  category?: number;
  categoryLabel?: string;
  societyDetailId?: number | null;
  societyId?: number | null;
  societyName?: string | null;
  wings?: { societyDetailId?: number; societyId?: number; wingDetailId: number; wingId?: number; wingMasterId?: number; wingName: string }[] | null;
  wingDetailId?: number | null;
  wingId?: number | null;
}

export interface Ward extends WardIdentifiable {
  description?: string | null;
  zoneId?: number | string | null;
  createdDate?: string | null;
  updatedDate?: string | null;
  wardID?: string | number;
}

export type PropertySuggestionResponse = Pick<PropertyIdentifiable, 'propertyNo' | 'partitionNo'>;

export type WardSuggestionResponse = WardIdentifiable;

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages?: number;
  hasPrevious?: boolean;
  hasNext?: boolean;
}

export interface OldTaxDetail {
  taxId: number;
  taxName: string;
  taxAmount: number;
}

export interface OldTaxYear {
  financeYearId: number;
  year: number;
  yearCode: string | null;
  rVorCV: string;
  rVorCVValue: number;
  taxes: OldTaxDetail[];
  taxTotal: number;
  interest: number;
  netTotal: number;
  oldWardNo?: string | number | null;
  oldPropertyNo?: string | null;
  oldPartitionNo?: string | number | null;
}

export interface OldTaxesData {
  propertyId: number;
  taxYears: OldTaxYear[];
}

// =============================================================================
// PTIS API RESPONSE TYPES (DTOs)
// =============================================================================

export interface KycDetailsApiResponse {
  propertyId: number | null;
  ownerTypeId: number | null;
  adharCardNo: string | null;
  ownerType: string | null;
  ownerTitle: string | null;
  ownerName: string | null;
  ownerTitleEnglish: string | null;
  ownerNameEnglish: string | null;
  occupierTitle: string | null;
  occupierName: string | null;
  occupierTitleEnglish: string | null;
  occupierNameEnglish: string | null;
  address: string | null;
  location: string | null;
  addressEnglish: string | null;
  locationEnglish: string | null;
  flatOrShopName: string | null;
  flatOrShopNameEnglish: string | null;
  flatOrShopNo: string | null;
  flatOrShopNoEnglish: string | null;
  mobileNo: string | null;
  emailId: string | null;
  wingNo?: string | null;
  alternateMobileNo?: string | null;
  pinCode?: string | null;
}

export interface PropertyBasicDetailsApiResponse {
  propertyId: number;
  propertyNo: string;
  partitionNo: string;
  wardId: number;
  wardNo: string;
  zoneId: number;
  division: string;
  flatOrShopNo: string;
  plotNo: string;
  surveyNo: string;
  taxZoneId: number;
  taxZoneNo: string;
  categoryId: number;
  categoryName: string;
  subCategoryId?: number;
  subCategoryName?: string;
  propertyTypeId: number;
  propertyDescription: string;
  upicId: string;
  subZoneNo: string;
  moujaId: number;
  moujaName: string;
  wingNo: string;
  noOfResidentialToilets: number;
  noOfCommercialToilets: number;
  totalCarpetAreaSqMeter: number;
  totalBuiltupAreaSqMeter: number;
  totalCarpetAreaSqFeet: number;
  totalBuiltupAreaSqFeet: number;
  plotArea: number;
  plotAreaFtLength: number;
  plotAreaFtWidth: number;
  plotAreaMtrLength: number;
  plotAreaMtrWidth: number;
  plotAreaSqFeet?: number | null;
  plotAreaSqMeter?: number | null;
  wingId: number;
  wingName: string;
  wingDetailId?: number;
  ownerName?: string;
  ownerNameEnglish?: string;
  rateSectionDescription?: string;
  latitude?: string | null;
  longitude?: string | null;
  constructionYear?: string | null;
  oldCarpetAreaSqFeet?: number | null;
  oldCarpetAreaSqMeter?: number | null;
  oldBuiltupAreaSqFeet?: number | null;
  oldBuiltupAreaSqMeter?: number | null;
}

export interface SocietyDetailsApiResponse {
  propertyId?: number;
  societyDetailId?: number;
  wingId?: number;
  wingNo?: string;
  wingName?: string;
  societyName?: string;
  societyNameEnglish?: string;
  builderName?: string;
  builderNameEnglish?: string;
  landOwnerName?: string;
  landOwnerNameEnglish?: string;
  secretaryName?: string;
  secretaryNameEnglish?: string;
  secretaryMobileNo?: string;
  secretaryEmailId?: string;
  societyEmailId?: string;
  ocDate?: string;
  ocNumber?: string;
  societyAddress?: string;
  societyAddressEnglish?: string;
  managerName?: string;
  managerNameEnglish?: string;
  managerEmailId?: string;
  managerMobileNo?: string;
  latitude?: string | number | null;
  longitude?: string | number | null;
}

export interface OldDetailsApiResponse {
  oldZoneNo?: number | string;
  oldWardNo?: string;
  oldPropertyNo?: string;
  oldPartitionNo?: string;
  oldEgovNo?: string;
  oldPlotArea?: number | string;
  oldPlotNo?: string;
  oldRV?: number | string;
  oldALV?: number | string;
  oldPropertyTax?: number | string;
  oldTotalTax?: number | string;
  oldConstructionYear?: number | string;
  oldCarpetAreaSqMeter?: number | string;
  oldCarpetAreaSqFeet?: number | string;
  oldBuiltupAreaSqMeter?: number | string;
  oldBuiltupAreaSqFeet?: number | string;
  oldConstructionArea?: number | string;
  oldGeneralTax?: number | string;
}

export interface OldFloorDetailApiResponse {
  floorDescription?: string;
  subFloorDescription?: string;
  oldAssessmentYear?: string;
  constructionYear?: number | string;
  oldConstructionYear?: number | string;
  constructionTypeDescription?: string;
  typeOfUseDescription?: string;
  subTypeOfUseDescription?: string;
  carpetAreaSqFeet?: number;
  carpetAreaSqMeter?: number;
  builtupAreaSqFeet?: number;
  builtupAreaSqMeter?: number;
  oldCarpetAreaSqFeet?: number;
  oldCarpetAreaSqMeter?: number;
  oldBuiltupAreaSqFeet?: number;
  oldBuiltupAreaSqMeter?: number;
  oldWardNo?: string | number;
  oldPropertyNo?: string;
  oldPartitionNo?: string | number;
}

export interface OldTaxDetailApiResponse {
  taxId: number;
  taxName: string;
  taxAmount: number;
}

export interface OldTaxYearApiResponse {
  financeYearId: number;
  year: number;
  yearCode: string | null;
  rVorCV: string;
  rVorCVValue: number;
  taxes: OldTaxDetailApiResponse[];
  taxTotal: number;
  interest: number;
  netTotal: number;
  oldWardNo?: string | number | null;
  oldPropertyNo?: string | null;
  oldPartitionNo?: string | number | null;
}

export interface OldTaxesApiResponse {
  propertyId: number;
  taxYears: OldTaxYearApiResponse[];
}

export interface TabHeaderInfoData {
  propertyId: number;
  statusName: string;
  oldWardNo: string | null;
  oldPropertyNo: string | null;
  oldPartitionNo: string | null;
  description: string | null;
  type: string | null;
  category: string | null;
  upicId: string | null;
  ownerName: string | null;
  address: string | null;
  typeOfUse: string | null;
  isCombined?: boolean;
}

export interface PtisInitialData {
  propertyDetails?: PropertyDetailsData;
  kycDetails?: KYCDetailsData;
  societyDetails?: SocietyDetailsData;
  buildingPermission?: BuildingPermissionData;
  wardOptions?: SearchSelectOption[];
  propertyOptions?: SearchSelectOption[];
  rawPropertyData?: PropertyListItem[];
  oldDetails?: OldDetailsData;
  oldFloorTableData?: OldFloorDetailsData[];
  showOldFloorInfo?: boolean;
  oldTaxesData?: OldTaxesData | null;
  showOldTaxInfo?: boolean;
  showOldMapInfo?: boolean;
  discountDetails?: DiscountData;
  socialDetails?: DiscountData;
  tabHeaderInfo?: TabHeaderInfoData | null;
  mappedPropertiesData?: MappedPropertyItem[];
}

export interface MappedPropertyItem {
  propertyId: number;
  mappingCategory: string;
  oldWardNo: string | null;
  oldPropertyNo: string | null;
  oldPartitionNo: string | null;
  oldEgovNo: string | null;
  oldPropertyTypeId: number | null;
  oldALV: number | null;
  oldRV: number | null;
  oldGeneralTax: number | null;
  oldTotalTax: number | null;
  oldZoneNo: string | null;
  oldPlotNo: string | null;
  oldCSN: string | null;
  oldPlotArea: number | null;
  oldConstructionYear: string | null;
  oldAssessmentYear: string | null;
  oldFloor: string | null;
  oldConstructionTypeOfUseId: string | null;
  oldUseType: string | null;
  oldConstructionArea: number | null;
  oldOwnerName: string | null;
  oldOccupierName: string | null;
  oldAddress: string | null;
  oldOwnerNameEnglish: string | null;
  oldOccupierNameEnglish: string | null;
  oldAddressEnglish: string | null;
  noOfOldToilets: number | null;
  oldTotalRooms: number | null;
  oldSocietyName: string | null;
  oldEmailId: string | null;
  oldParkingAreaSqFt: number | null;
  oldParkingAreaSqMtr: number | null;
  oldAssessmentDate: string | null;
  oldFlatOrShopNumber: string | null;
  oldWing: string | null;
  oldMobileNo: string | null;
  mappedNewBuildingNo: string | null;
}

export interface MappedPropertiesApiResponse {
  items: MappedPropertyItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export * from './ptis-core.types';
export * from './ptis-defaults.types';
export * from './ptis-search.types';
export * from './ptis-reference.types';
export * from './ptis-page.types';
export * from './dualMethod.types';
export * from './rateableValue.types';
export * from './capitalValue.types';
