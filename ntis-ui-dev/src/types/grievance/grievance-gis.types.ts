/**
 * Grievance GIS Types
 * Standard: Clean Architecture / ntis-ui
 * Strictly mirrors GisGrievanceDashboardController backend DTOs. Zero static/hardcoded dummy data.
 */

export interface GisGrievanceKpiCardDto {
  kpiCode: string;
  title: string;
  rawValue?: number;
  formattedValue?: string;
  unit?: string;
  icon?: string;
  color?: string;
  displayOrder?: number;
  filterKey?: string;
  filterValue?: string;
  isSelected?: boolean;
  count?: number;
  percentage?: number;
  colorCode?: string;
  iconName?: string;
  description?: string;
}

export interface GisGrievanceKpiSummaryResponseDto {
  departmentId: number;
  departmentCode: string;
  departmentName: string;
  totalGrievances: number;
  cards: GisGrievanceKpiCardDto[];
  appliedFilters: GisGrievanceQueryParameters;
  generatedAtUtc: string;
}

export interface GisGrievanceFilterOptionDto {
  id: number;
  name: string;
  code?: string;
  parentId?: number;
  count?: number;
  colorCode?: string;
}

export interface GisGrievanceFilterGroupDto {
  filterKey: string;
  filterLabel: string;
  controlType: string;
  apiSourceUrl?: string;
  displayOrder: number;
  options: GisGrievanceFilterOptionDto[];
}

export interface GisGrievanceQueryParameters {
  zoneId?: number;
  wardId?: number;
  grievanceDepartmentId?: number;
  grievanceTypeId?: number;
  currentStateId?: number;
  workflowId?: number;
  kpiCode?: string;
  isEscalated?: boolean;
  startDate?: string;
  endDate?: string;
  searchTerm?: string;
  minLat?: number;
  minLng?: number;
  maxLat?: number;
  maxLng?: number;
}

export interface GisGrievancePopupPhotoDto {
  photoId: number;
  photoTypeId: number;
  photoTypeName: string;
  photoTypeCode: string;
  documentBindingId?: number;
  documentGuid?: string;
  fileName?: string;
  fileExtension?: string;
  mimeType?: string;
  fileUrl: string;
  remarks?: string;
  isLatest: boolean;
  uploadedDate?: string;
}

export interface GisGrievanceActivityTimelineDto {
  activityId: number;
  actionAt: string;
  fromState?: string;
  toState?: string;
  actionByUserName?: string;
  assignedToUserName?: string;
  remark?: string;
}

export interface GisGrievancePopupDetailsDto {
  grievanceId: number;
  grievanceNo: string;
  description?: string;
  citizenId: number;
  citizenName?: string;
  citizenMobile?: string;
  grievanceDepartmentId: number;
  departmentName?: string;
  grievanceTypeId: number;
  grievanceTypeName?: string;
  workflowId: number;
  currentStateId: number;
  currentStateName?: string;
  isInitial: boolean;
  isFinal: boolean;
  isResolved: boolean;
  currentAssignedToUserId?: number;
  currentAssignedToUserName?: string;
  submittedDate: string;
  resolvedDate?: string;
  closedDate?: string;
  daysOpen: number;
  slaStatus: string;
  isEscalated: boolean;
  escalationCount: number;
  escalationReason?: string;
  zoneId?: number;
  zoneName?: string;
  wardId?: number;
  wardName?: string;
  roadLandmark?: string;
  latitude?: number;
  longitude?: number;
  googleMapLink?: string;
  photos: GisGrievancePopupPhotoDto[];
  activityTimeline: GisGrievanceActivityTimelineDto[];
}

export interface GisGrievanceIdentifyResult {
  grievanceId: number;
  [key: string]: unknown;
}

export interface GisCorporationConfigDto {
  id: number;
  ulbId: number;
  defaultCenterLat: number;
  defaultCenterLng: number;
  defaultZoom: number;
  minZoom: number;
  maxZoom: number;
  boundingBoxJson?: string;
  basemapsJson?: string;
  propertyBoundaryColor?: string;
}

export interface GisLayerItemDto {
  id: number;
  layerCode: string;
  layerName: string;
  geometryType: string;
  styleConfigJson?: string;
  popupSchemaJson?: string;
  displayOrder: number;
  isVisibleByDefault: boolean;
  geoJsonData?: string;
}
