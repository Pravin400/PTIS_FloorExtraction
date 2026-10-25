/**
 * TypeScript Data Models for Municipal Asset GIS API
 * Endpoint: /api/gis/asset/*
 */

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  statusCode?: number;
  items?: T;
  data?: T;
  totalCount?: number;
  errors?: string[] | null;
}

// 1. Dynamic Filter Option & Group
export interface FilterOption {
  id: string | number;
  name: string;
  code?: string;
  parentId?: string | number | null;
  colorCode?: string;
  borderColor?: string;
  color?: string;
  border?: string;
  assetWardNo?: string;
}

export interface GisFilterGroup {
  filterKey: 'zoneId' | 'wardId' | 'assetCategoryId' | 'assetTypeId' | string;
  filterLabel: string;
  controlType?: string;
  displayOrder?: number;
  options: FilterOption[];
}

// 2. Dynamic KPI Card Model
export interface GisKpiCard {
  kpiCode: string;
  title: string;
  rawValue: number;
  formattedValue: string;
  unit?: string;
  icon: string;
  color: string;
  displayOrder?: number;
  filterKey?: string;
  filterValue?: string;
  isSelected?: boolean;
}

// KPI Summary Response
export interface GisKpiSummaryResponse {
  departmentId?: number;
  departmentCode?: string;
  totalAssets?: number;
  geoSequenced?: number;
  internalSurvey?: number;
  fixedAssets?: number;
  movableAssets?: number;
  totalSubUnits?: number;
  cards: GisKpiCard[];
  [key: string]: unknown;
}

// 3. Filter Request State Parameters
export interface GisAssetFilterState {
  zoneId?: number | string | null;
  wardId?: number | string | null;
  assetCategoryId?: number | string | null;
  assetTypeId?: number | string | null;
  kpiCode?: string | null;
  financeYear?: number | null;
  searchTerm?: string | null;
  encroachmentStatus?: string | null;
  minLat?: number | null;
  minLng?: number | null;
  maxLat?: number | null;
  maxLng?: number | null;
  [key: string]: unknown;
}

// 4. Asset Identify / Geometry Details
export interface GisAssetGeometryDetails {
  id: number;
  assetMasterId: number;
  assetNo: string;
  assetName: string;
  categoryName?: string;
  typeName?: string;
  buildingId?: string;
  totalAreaSqMeter?: number;
  totalAreaSqFeet?: number;
  centroidX?: number;
  centroidY?: number;
  googleMapLink?: string;
  link360?: string;
  encroachmentStatus?: string;
  rawGeoJson?: string;
}

// 5. Asset Media Item
export interface GisAssetPhotoDto {
  photoId: number;
  photoTypeId?: number;
  photoTypeName?: string;
  photoTypeCode?: string;
  documentBindingId?: number;
  documentGuid?: string;
  fileName?: string;
  fileExtension?: string;
  mimeType?: string;
  fileSizeBytes?: number;
  fileUrl: string;
  remarks?: string;
  displayOrder?: number;
}

// 6. Asset Document Item
export interface GisAssetDocumentDto {
  documentId: number;
  documentDefinitionId?: number;
  documentName: string;
  documentCode?: string;
  documentBindingId?: number;
  documentGuid?: string;
  fileName?: string;
  fileExtension?: string;
  mimeType?: string;
  fileSizeBytes?: number;
  fileUrl: string;
  remarks?: string;
  displayOrder?: number;
}

// 6.5 Child Shop / Sub-unit DTO for Shopping Complexes
export interface GisAssetChildShopDto {
  assetId: number;
  parentAssetId?: number | null;
  assetNo?: string;
  mpmsNo?: string;
  assetName?: string;
  unitNo?: string;
  floorName?: string;
  carpetAreaSqFt?: number | null;
  builtUpAreaSqFt?: number | null;
  tenantName?: string;
  tenantMobile?: string;
  occupancyStatus?: string;
  monthlyRent?: number | null;
  capitalValue?: number | null;
  annualRevenue?: number | null;
  photoCount?: number;
  documentCount?: number;
  primaryPhotoUrl?: string;
}

// 7. Complete Asset Map Popup Details DTO
export interface GisAssetPopupDetailsDto {
  assetId: number;
  parentAssetId?: number | null;
  parentAssetName?: string;
  parentAssetNo?: string;
  mpmsId?: string;
  assetNo?: string;
  assetType?: string;
  department?: string;
  inCharge?: string;
  tenantName?: string;
  encroachment?: string;
  mobileNo?: string;
  plotNo?: string;
  plotAreaSqFt?: number;
  formattedPlotArea?: string;
  citySurveyNo?: string;
  carpetAreaSqFt?: number;
  formattedCarpetArea?: string;
  builtUpAreaSqFt?: number;
  formattedBuiltUpArea?: string;
  constYear?: string;
  totalFloors?: number;
  roomsOrUnits?: number;
  address?: string;
  assetName?: string;
  capitalValue?: number;
  formattedCapitalValue?: string;
  annualRevenue?: number;
  formattedAnnualRevenue?: string;
  monthlyRent?: number;
  formattedMonthlyRent?: string;
  googleMapLink?: string;
  link360?: string;
  photos?: GisAssetPhotoDto[];
  documents?: GisAssetDocumentDto[];
  childShops?: GisAssetChildShopDto[];
  childUnits?: (GisAssetChildShopDto | Record<string, unknown>)[];
  [key: string]: unknown;
}

// 8. Master GIS Architecture Models
export interface GisCorporationConfigDto {
  id?: number;
  corporationCode?: string;
  corporationName?: string;
  defaultDepartmentId?: number;
  centerLatitude?: number;
  centerLongitude?: number;
  defaultZoom?: number;
  minZoom?: number;
  maxZoom?: number;
  boundingBox?: [number, number, number, number];
  activeFeatures?: string[];
  [key: string]: unknown;
}

export interface GisDepartmentKpiMappingDto {
  id: number;
  departmentId: number;
  kpiId?: number;
  kpiCode: string;
  kpiName: string;
  iconName?: string;
  colorHex?: string;
  displayOrder: number;
  isActive: boolean;
  filterKey?: string;
  filterValue?: string;
  calculationType?: string;
  [key: string]: unknown;
}

export interface GisDepartmentFilterMappingDto {
  id: number;
  departmentId: number;
  filterId?: number;
  filterKey: string;
  filterLabel: string;
  controlType?: string;
  displayOrder: number;
  isActive: boolean;
  dataSourceUrl?: string;
  [key: string]: unknown;
}

export interface GisLayerMasterDto {
  id: number;
  layerKey: string;
  layerName: string;
  layerType?: string;
  geometryType?: string;
  tileUrl?: string;
  color?: string;
  borderColor?: string;
  fillOpacity?: number;
  minZoom?: number;
  maxZoom?: number;
  zIndex?: number;
  isVisibleDefault?: boolean;
  legendGroup?: string;
  [key: string]: unknown;
}

