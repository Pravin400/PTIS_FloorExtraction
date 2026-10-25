/**
 * Types for Zone-Ward-Property relationships
 * Used in Zone Master for property listing
 */

/**
 * Property item as returned from the API
 */
export interface ZonePropertyItem {
  id: number;
  taxZoneId: number;
  wardId: number;
  propertyNo: string;
  partitionNo: string | null;
  propertyTypeId: number | null;
  upicId: string;
  openPlot: boolean;
  csn: string | null;
  subZoneNo: string | null;
  plotNo: string | null;
  categoryId: number | null;
  type: string | null;
  ownerTitle: string | null;
  ownerName: string | null;
  ownerTitleEnglish: string | null;
  ownerNameEnglish: string | null;
  occupierTitle: string | null;
  occupierName: string | null;
  occupierTitleEnglish: string | null;
  occupierNameEnglish: string | null;
  flatOrShopNo: string | null;
  flatOrShopName: string | null;
  flatOrShopNoEnglish: string | null;
  flatOrShopNameEnglish: string | null;
  address: string | null;
  location: string | null;
  addressEnglish: string | null;
  locationEnglish: string | null;
  mobileNo: string | null;
  emailId: string | null;
  societyDetailId: number | null;
  markedForDeletion: boolean;
  propertySeqNo: number | null;
  displayProperty: string | null;
  isActive: boolean;
  createdDate: string;
  updatedDate: string | null;
}

/**
 * Paginated response for property list
 */
export interface ZonePropertyListResponse {
  items: ZonePropertyItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

/**
 * Property item as returned by GET /Property/search-by-category
 */
export interface ZonePropertySearchByCategoryItem {
  propertyId: number;
  taxZoneId: number;
  zoneId: number;
  zoneNo: string | null;
  wardId: number;
  wardNo: string | null;
  propertyNo: string;
  partitionNo: string | null;
  property: string | null;
  mobileNo: string | null;
  upicId: string;
  propertyTypeId: number | null;
  partType: string | null;
  categoryId: number | null;
  propertyCategoryName: string | null;
  isWing: boolean;
  propertyAssessmentStatusId: number | null;
}

/**
 * Inner paginated payload of the search-by-category response
 */
export interface ZonePropertySearchByCategoryData {
  items: ZonePropertySearchByCategoryItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

/**
 * Envelope returned by GET /Property/search-by-category
 */
export interface ZonePropertySearchByCategoryResponse {
  success: boolean;
  message: string | null;
  items: ZonePropertySearchByCategoryData;
  errors: unknown;
  correlationId: string | null;
}

/**
 * Pagination data for property list in Zone Master
 */
export interface ZonePropertyPaginationData {
  properties: ZonePropertyItem[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  searchTerm?: string;
}

/**
 * Property type for category/type display
 */
export interface PropertyTypeInfo {
  id: number;
  name: string;
  categoryId: number | null;
  categoryName?: string;
}

/**
 * Category info for display
 */
export interface PropertyCategoryInfo {
  id: number;
  name: string;
}

/**
 * Lookup data for property display
 */
export interface PropertyLookupData {
  categories: Map<number, string>;
  propertyTypes: Map<number, PropertyTypeInfo>;
}
