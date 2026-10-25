import type {
  BuildingPermissionData,
  KYCDetailsData,
  PropertyDetailsData,
  SocietyDetailsData,
} from './ptis-core.types';

export interface PropertySearchParams {
  wardNo?: string;
  wardId?: number;
  propertyNo?: string;
  upicId?: string;
  partitionNo?: string;
}

export interface PropertySearchResult {
  id: string;
  propertyId?: number;
  propertyNo: string;
  partitionNo?: string | null;
  ownerName: string;
  ownerNameEnglish?: string;
  ownerTitle?: string;
  ownerTitleEnglish?: string;
  occupierName?: string;
  occupierNameEnglish?: string;
  occupierTitle?: string;
  occupierTitleEnglish?: string;
  address: string;
  addressEnglish?: string;
  location?: string;
  locationEnglish?: string;
  wardNo: string;
  wardId?: number;
  upicId: string;
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

export type PropertySearchResultData = PropertySearchResult;

export interface ApartmentQCSearchWingSummary {
  wingDetailId: number;
  wingName: string;
}

export interface PropertyListItem {
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
  wings?: ApartmentQCSearchWingSummary[] | null;
  wingDetailId?: number | null;
  wingId?: number | null;
}

export interface WardData {
  wardID?: string;
  WardId?: string;
  wardId?: string;
  zoneId?: string;
  wardNo?: string;
}

export interface PropertySuggestionResponse {
  propertyNo: string;
  partitionNo?: string | null;
}

export interface PropwiseSuggestionItem {
  propertyId: number;
  zoneId?: number;
  zoneNo?: string;
  wardId?: number;
  wardNo?: string;
  propertyNo: string;
  partitionNo?: string | null;
  upicId?: string;
  displayLabel?: string;
  category?: number;
  categoryLabel?: string;
  societyDetailId?: number | null;
  societyName?: string | null;
  wings?: ApartmentQCSearchWingSummary[] | null;
  wingDetailId?: number | null;
}

export type ApartmentQCSearchSuggestionItem = PropwiseSuggestionItem;

export interface PropwiseSuggestionResponse {
  success: boolean;
  message: string;
  items: PropwiseSuggestionItem[];
}

export interface WardSuggestionResponse {
  wardNo: string;
  wardId?: string;
}

export interface PropertyPreviewData {
  upicId: string;
  propertyHolder: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages?: number;
  hasPrevious?: boolean;
  hasNext?: boolean;
}

export interface PropertyDetailsResponse {
  propertyDetails: PropertyDetailsData;
  kycDetails: KYCDetailsData;
  societyDetails: SocietyDetailsData;
  buildingPermission: BuildingPermissionData;
}