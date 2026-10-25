import type { UlbMaster } from '@/types/master.types';

export type { UlbMaster };

export interface Zone {
  zoneNo: string | number;
  zoneName: string;
}

export interface Ward {
  wardNo: string | number;
  wardName: string;
  zoneNo: string | number;
}

export interface GisZoneItem {
  zoneNo: string | number;
  zoneName: string;
  zoneId?: number;
}

export interface GisBlockItem {
  blockId: string | number;
  blockName: string;
}

export interface GisCategoryItem {
  category: string;
  categoryName?: string;
  count?: number;
}

export interface PropertyTypeMasterItem {
  propertyTypeID: number;
  PropertyTypeID?: number;
  propertyDescription: string;
  PropertyDescription?: string;
  isActive: boolean;
  type: string;
}

export interface RiskZones {
  flood: boolean;
  earthquake: boolean;
  complaints: boolean;
}

export interface GisDropdownItem {
  id?: string;
  label: string;
  value?: string | number;
  total: number;
  color?: string;
}

export interface PropertyGroup {
  id: string | number;
  value: string | number;
  label: string;
  labelMarathi?: string;
  total: number;
  color?: string;
}

export interface GisKpiSummary {
  totalCount: number;
  assessedCount: number;
  unassessedCount: number;
  internalSurveyCount: number;
  geoSequencingCount: number;
  underConstructionCount: number;
  totalApartmentCount: number;
  residentialCount: number;
  commercialCount: number;
  mixCount: number;
  plotCount: number;
  industryCount: number;
  governmentPropertyCount: number;
  newUnassessedCount: number;
  oldUnassessedCount: number;

  geoSequencingStructured?: number;
  geoSequencingUnit?: number;
  assessedStructured?: number;
  assessedUnit?: number;
  unassessedStructured?: number;
  unassessedUnit?: number;
  internalSurveyStructured?: number;
  internalSurveyUnit?: number;
  underConstructionStructured?: number;
  underConstructionUnit?: number;
  isDocumentSubmittedYesCount?: number;
  isDocumentSubmittedNoCount?: number;
  newlyAssessedStructureCount?: number;
  newlyAssessedUnitCount?: number;

  additionalConstructionCount?: number;
  changeInConstructionTypeCount?: number;
  changeInConstructionYearCount?: number;
  changeOfFloorCount?: number;
  changeOfUseCount?: number;
  noChangeCount?: number;
  underAssessedCount?: number;

  categoryCounts?: { categoryName: string; count: number }[];
}

export interface GisWardSummaryItem {
  newWardNo: string;
  totalCount: number;
  internalSurveyCount: number;
  geoSequencingCount: number;
  assessedCount: number;
  unassessedCount: number;
  underConstructionCount: number;
  totalApartmentCount: number;
  residentialCount: number;
  commercialCount: number;
  mixCount: number;
  plotCount: number;
  industryCount: number;
  governmentPropertyCount: number;
  newUnassessedCount: number;
  oldUnassessedCount: number;
}

export interface GisPropertyListItem {
  ownerID: number;
  newWardNo: string;
  newPropertyNo: string;
  UnicodeAddress?: string;
  marathiOwnerPrathamNav: string;
  occupierNameMarathi: string;
  category: string;
  propertyDescription: string;
  assessmentStatus: string;
  fileCode: string;
  photoA: string;
  planUrl: string;
  signImage: string;
}

export interface GisSearchParams {
  PropertyTypeID?: number | string;
  WardNo?: string;
  OwnerIDList?: string;
  Category?: string;
  PropertyTypeGroup?: string;
  StatusType?: string;
  SearchTerm?: string;
  ZoneId?: string;
  BlockId?: string;
  TaxStatus?: string;
  includeStatusMapping?: boolean;

  propertyTypeId?: string | number;
  wardNo?: string;
  ownerIdListCsv?: string;
  category?: string;
  propertyTypeGroup?: string;
  statusType?: string;
  searchTerm?: string;
  zoneId?: string;
  blockId?: string;
  taxStatus?: string;
  assessmentSubCategory?: string;
  AssessmentSubCategory?: string;
  documentSubmittedStatus?: string;
  DocumentSubmittedStatus?: string;
  [key: string]: unknown;
}

export interface GisDashboardInitData {
  zones: GisZoneItem[];
  blocks: GisBlockItem[];
  categories: GisCategoryItem[];
  propertyTypes?: PropertyTypeMasterItem[];
  propertyGroups?: PropertyGroup[];
}

export interface GisUnifiedDashboardData {
  kpiSummary: GisKpiSummary;
  wardSummary: GisWardSummaryItem[];
  properties: number[];
}

export interface GisPhotoItem {
  url: string;
  label: string;
  type?: string;
}

export interface GisDocumentItem {
  id?: number | string;
  name?: string;
  documentGuid?: string;
  url?: string;
  documentTypeName?: string;
}

export interface GisPropertyDetail {
  id?: number | string;
  assetId?: number | string;
  assetNo?: string;
  assetName?: string;
  assetRegionalName?: string;
  ownerID?: string | number;
  OwnerID?: string | number;
  latitude?: number;
  longitude?: number;
  centroidX?: number;
  centroidY?: number;
  address?: string;
  plotNo?: string;
  citySurveyNo?: string;
  plotArea?: number;
  parentAssetId?: number | string;
  parentAssetName?: string;
  parentAssetNo?: string;
  parentLatitude?: number;
  parentLongitude?: number;
  parentAddress?: string;
  parentPlotNo?: string;
  parentCitySurveyNo?: string;
  [key: string]: unknown;
}

export type GisDynamicRecord = Record<string, unknown>;

export interface GisInitialDataPayload {
  initData?: GisDashboardInitData;
  kpiSummary?: GisKpiSummary | Record<string, unknown>;
  wardSummary?: GisWardSummaryItem[] | Record<string, unknown>[];
  deepLinkCoords?: { lat: number; lng: number } | null;
  propertyDetail?: GisPropertyDetail | Record<string, unknown> | null;
  isSingleAssetMode?: boolean;
  ssrSuccess?: boolean;
  ulbData?: UlbMaster | Record<string, unknown> | null;
}

export interface AssetDocumentItem {
  id: number | string;
  documentGuid?: string;
  fileName: string;
  name: string;
  contentType?: string;
  uploadedDate?: string;
}

export interface GroupedDocumentCategory {
  groupKey: string;
  groupTitle: string;
  items: (AssetDocumentItem & { customUrl?: string })[];
  seenItemKeys: Set<string>;
}

export interface BlockGapData {
  id: string;
  name?: string;
  blockId?: string;
  photoMissing?: number;
  planMissing?: number;
  totalOldCount?: number;
  mergeOldCount?: number;
  missingOldCount?: number;
  [key: string]: unknown;
}

export interface ZoneGapData {
  id: string;
  name: string;
  zoneId?: string;
  totalGaps?: number;
  missingPhotos?: number;
  missingPlans?: number;
  photoMissing?: number;
  planMissing?: number;
  totalOldCount?: number;
  mergeOldCount?: number;
  missingOldCount?: number;
  blocks?: BlockGapData[];
  [key: string]: unknown;
}

export interface GisGapAnalysisResult {
  totalProperties?: number;
  totalGaps?: number;
  missingPhotos?: number;
  missingPlans?: number;
  zones?: ZoneGapData[];
  nodeName?: string;
  newWardNo?: string | number;
  ownerID?: string | number;
  totalOldPropertyCount?: number;
  mergeOldPropertyCount?: number;
  missingOldPropertyCount?: number;
  [key: string]: unknown;
}

export type Language = 'en' | 'mr' | 'hi';

export interface GisFilters {
  category?: string;
  propertyTypeGroup?: string;
  propertyTypeId?: number;
  PropertyTypeID?: number;
  zoneId?: string;
  blockId?: string;
  wardNo?: string;
  wardNoCsv?: string;
  statusType?: string;
  searchTerm?: string;
  ownerIdListCsv?: string;
  assessmentSubCategory?: string;
  documentSubmittedStatus?: string;
  taxStatus?: string;
  [key: string]: unknown;
}

export interface LanguageOption {
  code: string;
  label: string;
  nativeLabel: string;
  countryCode: string;
}

export interface GisDashboardInitialDataResult {
  initData?: Record<string, unknown>;
  kpiSummary?: Record<string, unknown>;
  wardSummary?: Array<Record<string, unknown>>;
  blockSummary?: Array<Record<string, unknown>>;
  deepLinkCoords?: Record<string, unknown> | null;
  propertyDetail?: Record<string, unknown> | null;
  isSingleAssetMode?: boolean;
  success: boolean;
  error?: string;
}
