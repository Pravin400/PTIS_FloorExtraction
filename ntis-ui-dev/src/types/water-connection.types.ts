import type { PagedResponse } from "./common.types";

export type { PagedResponse };

/* ============================================================
   TAP STATUS
============================================================ */
export interface TapStatus {
  [key: string]: unknown;
  waterConnectionStatusId: number;
  statusCode: string;
  statusName: string;
  isActive: boolean;
}

export interface TapStatusFormModel {
  waterConnectionStatusId?: number;
  statusCode?: string;
  statusName: string;
  isActive: boolean;
}

/* ============================================================
   TAP TYPE
============================================================ */
export interface TapType {
  [key: string]: unknown;
  waterConnectionTypeId: number;
  typeCode: string;
  typeName: string;
  isActive: boolean;
}

export interface TapTypeFormModel {
  waterConnectionTypeId?: number;
  typeCode: string;
  typeName: string;
  isActive: boolean;
}

/* ============================================================
   TAP SIZE
============================================================ */
export interface TapSize {
  [key: string]: unknown;
  waterConnectionSizeId: number;
  sizeName: string;
  unit: string;
  displayLabel: string;
  isActive: boolean;
}

export interface TapSizeFormModel {
  waterConnectionSizeId?: number;
  sizeName: string;
  unit: string;
  isActive: boolean;
}

/* ============================================================
   PAGE PROPS
============================================================ */
export interface TapStatusMasterProps {
  data: PagedResponse<TapStatus>;
}

export interface TapTypeMasterProps {
  data: PagedResponse<TapType>;
}

export interface TapSizeMasterProps {
  data: PagedResponse<TapSize>;
}

/* ============================================================
   WATER RATE MASTER
============================================================ */
export interface WaterRate {
  [key: string]: unknown;
  id: number;
  waterConnectionTypeId: number;
  connectionTypeName?: string | null;
  waterConnectionSizeId: number;
  connectionSizeDisplay?: string | null;
  financeYearId: number;
  yearCode?: string | null;
  yearlyRate?: number | null;
  quarterlyRate?: number | null;
  monthlyRate?: number | null;
  isActive: boolean;
}

export interface WaterRateFormModel {
  id?: number;
  waterConnectionTypeId: number;
  waterConnectionSizeId: number;
  financeYearId: number;
  yearlyRate?: number | null;
  quarterlyRate?: number | null;
  monthlyRate?: number | null;
  isActive: boolean;
}

export interface WaterRateMasterProps {
  data: PagedResponse<WaterRate>;
}

/* ============================================================
   WATER CONNECTION (CONSUMER)
============================================================ */
export interface WaterConnection extends Record<string, unknown> {
  id: number;
  propertyId: number;
  connectionNo: string;
  meterNo: string | null;
  waterConnectionTypeId: number;
  type: string;
  waterConnectionSizeId: number;
  tapSize: string;
  waterConnectionStatusId: number | null;
  statusName: string | null;
  connectionStartDate: string;
  connectionStopDate: string | null;
  installDate: string | null;
  activatedDate: string | null;
  stoppedDate: string | null;
  applicableRate: number | null;
  applicableCharges: number | null;
  category: string;
  isActive: boolean;
}

/** Raw API response from GET /api/Property?Id={id} */
export interface PropertyApiResponse {
  id: number;
  taxZoneId: number;
  wardId: number;
  propertyNo: string;
  partitionNo: string;
  propertyTypeId: number;
  upicId: string | null;
  openPlot: boolean;
  csn: string;
  subZoneNo: string;
  plotNo: string;
  categoryId: number;
  type: string | null;
  partType: string;
  ownerTitle: string;
  ownerName: string;
  ownerTitleEnglish: string;
  ownerNameEnglish: string;
  occupierTitle: string;
  occupierName: string;
  occupierTitleEnglish: string | null;
  occupierNameEnglish: string;
  flatOrShopNo: string;
  flatOrShopName: string;
  flatOrShopNoEnglish: string;
}

export interface PropertyInfo {
  id: number;
  propertyNo: string;
  ownerName: string;
  customerId: string;
  customerType: 'Individual' | 'Organization';
  contact: string;
  email: string;
  address: string;
  zone: string;
  ward: string;
  buildingType: string;
}

export interface WaterConnectionFormModel {
  id?: number;
  propertyId: number;
  connectionNo: string;
  meterNo: string;
  waterConnectionTypeId: number | '';
  waterConnectionSizeId: number | '';
  waterConnectionStatusId: number | null;
  installDate: string;
  connectionStopDate?: string | null;
  isActive: boolean;
  applicableRate?: number | null;
  rateType?: "yearly" | "quarterly" | "monthly";
}

export interface WaterConnectionTypeLookup {
  id: number;
  connectionTypeCode: string;
  connectionTypeName: string;
}

export interface WaterConnectionSizeLookup {
  id: number;
  connectionSize: number;
  connectionSizeUnit: string;
  displayLabel: string;
}

export interface WaterConnectionStatusLookup {
  id: number;
  statusName: string;
}

export interface WaterRateMasterLookup {
  id: number;
  waterConnectionTypeId: number;
  connectionTypeName?: string;
  waterConnectionSizeId: number;
  connectionSizeDisplay?: string;
  financeYearId: number;
  yearCode?: string | null;
  yearlyRate: number;
  quarterlyRate?: number | null;
  monthlyRate?: number | null;
  isActive: boolean;
}

export interface WaterConnectionPageData {
  property: PropertyInfo;
  connections: WaterConnection[];
  totalCount: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
  typeOptions: WaterConnectionTypeLookup[];
  sizeOptions: WaterConnectionSizeLookup[];
  statusOptions: WaterConnectionStatusLookup[];
  rateMasters: WaterRateMasterLookup[];
}

/** Module-specific paged response that handles APIs returning either items[] or data[] */
export interface WaterConnectionPagedResponse<T> {
  data?: T[];
  items?: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}
