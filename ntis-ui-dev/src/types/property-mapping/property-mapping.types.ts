export interface NewProperty {
  id: string;
  propNo: string;
  partitionNo?: string | null;
  owner: string;
  address: string;
  mobile: string;
  plotArea: number;
  builtUpArea: number;
  carpetArea?: number;
  floors: string;
  use: string;
  rv: number;
  tax: number;
  cts: string;
  status: "Needs verification" | "Mapped" | "Unmapped";
  verificationResult: string;
  remark: string;
  mappingType: string;
  ward?: string;
  zone?: string;
  plotNo?: string;
  constructionYear?: string;
  [key: string]: unknown;
}

export interface OldPropertyCandidate {
  id: string;
  status: "Mapped" | "Unmapped" | "Blocked";
  propNo: string;
  partitionNo?: string;
  owner: string;
  address: string;
  area: number;
  carpetArea?: number;
  tax: number;
  floors: string;
  evidence: { text: string; type: "good" | "warn" | "bad" }[];
  score: number;
  isHardConflict: boolean;
  belongsToNewId: string;
  cts?: string;
  rv?: number;
  use?: string;
  ward?: string;
  zone?: string;
  plotNo?: string;
  constructionYear?: string;
  isMapped?: boolean;
  mappedNewPropertyNo?: string | null;
  isSearchResult?: boolean;
  [key: string]: unknown;
}

export interface FloorDetail {
  floor: string;
  use: string;
  construction: string;
  carpetAreaSqFeet: number;
  builtupAreaSqFeet: number;
  level: "good" | "warn" | "bad";
  constructionYear?: string;
  assessmentYear?: string;
  [key: string]: unknown;
}

export interface MappingLink {
  id: string;
  newPropNo: string;
  oldPropNos: string[];
  mapType: string;
  confidence: number;
  note: string;
  mappedBy: string;
  mappedAt: string;
  status: "Mapped" | "Unmapped";
  [key: string]: unknown;
}

export interface AuditHistory {
  id: string;
  time: string;
  action: "Mapped" | "Unmapped" | "Search" | "Edit Remark";
  newPropNo: string;
  oldPropNos: string[];
  user: string;
  reason: string;
  [key: string]: unknown;
}

export interface NewPropertyInfo {
  id: number;
  propertyNo: string;
  partitionNo: string | null;
  ownerName: string | null;
  ownerNameEnglish: string | null;
  occupierName: string | null;
  occupierNameEnglish: string | null;
  address: string | null;
  addressEnglish: string | null;
  mobileNo: string | null;
  emailId: string | null;
  flatOrShopName: string | null;
  flatOrShopNo: string | null;
  csn: string | null;
  plotNo: string | null;
  wardId: number | null;
  wardNo: string | null;
  wardDescription: string | null;
  taxZoneId: number | null;
  taxZoneNo: string | null;
  taxZoneRemark: string | null;
  propertyTypeId: number | null;
  propertyTypeDescription: string | null;
  categoryId: number | null;
  categoryName: string | null;
}

export interface NewPropertyDetail {
  id: number;
  floorId: number;
  floorCode: string | null;
  floorDescription: string | null;
  subFloorId: number | null;
  subFloorCode: string | null;
  subFloorDescription: string | null;
  typeOfUseId: number | null;
  typeOfUseCode: string | null;
  typeOfUseDescription: string | null;
  subTypeOfUseId: number | null;
  subTypeOfUseDescription: string | null;
  constructionTypeId: number | null;
  constructionCode: string | null;
  constructionTypeDescription: string | null;
  constructionYear: string | null;
  assessmentYear: string | null;
  carpetAreaSqMeter: number;
  carpetAreaSqFeet: number;
  builtupAreaSqMeter: number;
  builtupAreaSqFeet: number;
  noOfRooms: number;
  isRenter: boolean;
  isTaxable: boolean;
  isOpenPlot: boolean;
}

export interface MappedPropertyApiItem {
  propertyId: number;
  mappingCategory: string;
  oldWardNo: string;
  oldPropertyNo: string;
  oldPartitionNo: string | null;
  oldEgovNo: string;
  oldPropertyTypeId: number | null;
  oldALV: number;
  oldRV: number;
  oldGeneralTax: number;
  oldTotalTax: number;
  oldZoneNo: string;
  oldPlotNo: string | null;
  oldCSN: string | null;
  oldPlotArea: number | null;
  oldConstructionYear: number | null;
  oldAssessmentYear: number | null;
  oldFloor: string;
  oldConstructionTypeOfUseId: string;
  oldUseType: string;
  oldConstructionArea: number;
  oldOwnerName: string | null;
  oldOccupierName: string | null;
  oldAddress: string;
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
  oldFlatOrShopNumber: string;
  oldWing: string | null;
  oldMobileNo: string | null;
  mappedNewBuildingNo: string | null;
  propertyDetailsOld: Array<{
    id: number;
    propertyId: number;
    oldFloorId: number;
    floorDescription: string | null;
    oldSubFloorId: number;
    subFloorDescription: string | null;
    oldConstructionYear: number | null;
    constructionYearValue: number | null;
    oldAssessmentYear: number | null;
    assessmentYearValue: number | null;
    oldConstructionTypeId: number;
    constructionTypeDescription: string | null;
    oldTypeOfUseId: number;
    typeOfUseDescription: string | null;
    oldSubTypeOfUseId: number;
    subTypeOfUseDescription: string | null;
    oldCarpetAreaSqMeter: number;
    oldCarpetAreaSqFeet: number;
    oldBuiltupAreaSqMeter: number;
    oldBuiltupAreaSqFeet: number;
    markedForDeletion: boolean;
    markedForDeletionDate: string | null;
  }>;
  newPropertyInfo?: NewPropertyInfo | null;
  newPropertyDetails?: NewPropertyDetail[] | null;
  transMastRecords?: TransMastRecord[] | null;
  transMastOldRecords?: TransMastRecord[] | null;
}

export interface TransMastRecord {
  id: number;
  propertyId: number;
  /** The actual old property master ID — returned by backend as propertyMastOldId on transMastOldRecords */
  propertyMastOldId?: number;
  financeYearId: number | null;
  calculationType: string | null;
  calculationValue: number | null;
  taxId: number | null;
  taxAmount: number | null;
}

export interface MappedPropertyApiResponse {
  items: MappedPropertyApiItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface SearchOldPropertySuggestion {
  id: number;
  isMapped: boolean;
  mappedNewPropertyNo: string | null;
  oldPropertyNo: string;
  oldPartitionNo: string | null;
  oldEgovNo: string;
  oldWardNo: string;
  oldOwnerName: string | null;
  oldOwnerNameEnglish: string | null;
  oldAddress: string;
  oldAddressEnglish: string | null;
  oldZoneNo: string;
  oldPlotNo: string | null;
  oldCSN: string | null;
  oldALV: number;
  oldRV: number;
  oldGeneralTax: number;
  oldTotalTax: number;
  oldPlotArea: number | null;
  oldConstructionArea: number;
  oldFloor: string;
  oldUseType: string;
  oldOccupierName: string | null;
  oldOccupierNameEnglish: string | null;
  oldSocietyName: string | null;
  oldFlatOrShopNumber: string | null;
  oldWing: string | null;
  oldEmailId: string | null;
  oldParkingAreaSqFt: number | null;
  oldParkingAreaSqMtr: number | null;
  oldPropertyTypeId: number | null;
  oldAssessmentYear: number | null;
  oldConstructionYear: number | null;
  oldConstructionTypeOfUseId: string;
  noOfOldToilets: number | null;
  oldTotalRooms: number | null;
  oldAssessmentDate: string | null;
  oldMobileNo: string | null;
  propertyDetailsOld: Array<{
    id: number;
    propertyId: number;
    oldFloorId: number;
    floorDescription: string | null;
    oldSubFloorId: number | null;
    subFloorDescription: string | null;
    oldConstructionYear: string | null;
    constructionYearValue: number | null;
    oldAssessmentYear: string | null;
    assessmentYearValue: number | null;
    oldConstructionTypeId: number;
    constructionTypeDescription: string | null;
    oldTypeOfUseId: number;
    typeOfUseDescription: string | null;
    oldSubTypeOfUseId: number;
    subTypeOfUseDescription: string | null;
    oldCarpetAreaSqMeter: number;
    oldCarpetAreaSqFeet: number;
    oldBuiltupAreaSqMeter: number;
    oldBuiltupAreaSqFeet: number;
    markedForDeletion: boolean;
    markedForDeletionDate: string | null;
  }>;
  transMastOldRecords: TransMastRecord[];
}

export interface SearchOldPropertiesParams {
  searchTerm?: string;
  oldOwnerName?: string;
  oldOwnerNameEnglish?: string;
  oldMobileNo?: string;
  oldAddress?: string;
  oldSocietyName?: string;
  oldOccupierName?: string;
  oldBuilderName?: string;
  oldConstructionYear?: string;
  pageSize?: number;
  pageNumber?: number;
}

export interface SearchOldPropertiesApiResponse {
  oldPropertySuggestions: SearchOldPropertySuggestion[];
  totalCount?: number;
  totalRecords?: number;
  pageNumber?: number;
  pageSize?: number;
  totalPages?: number;
  hasPrevious?: boolean;
  hasNext?: boolean;
}

export interface FloorTab {
  key: string;
  label: string;
  isNew: boolean;
  displayPropNo: string;
}

export interface CandidatesTableProps {
  autoCandidates: OldPropertyCandidate[];
  manualCandidates: OldPropertyCandidate[];
  activeCheckedIds: string[];
  mappedOldPropNos: string[];
  onToggleCandidate: (id: string) => void;
  onCompareClick: (candidate: OldPropertyCandidate) => void;
  money: (val: number) => string;
  hasSearchActive: boolean;
  currentWard?: string;
  currentPartition?: string | null;
  currentPropNo?: string;
  // Step 1.1 Server Pagination Props
  page12?: number;
  pageSize12?: number;
  totalCount12?: number;
  onPageChange12?: (page: number) => void;
  onPageSizeChange12?: (size: number) => void;
  // Step 1.2 Server Pagination Props
  page13?: number;
  pageSize13?: number;
  totalCount13?: number;
  onPageChange13?: (page: number) => void;
  onPageSizeChange13?: (size: number) => void;
}

export interface ReconciliationMetrics {
  totalOldArea: number;
  areaDiff: number;
  areaPercentDiff: number;
  totalOldCarpetArea: number;
  carpetAreaDiff: number;
  carpetAreaPercentDiff: number;
  totalOldTax: number;
  taxDiff: number;
  taxPercentDiff: number;
  floorStatus: string;
  floorStatusLevel: string;
}

export interface ComparisonCardsProps {
  currentNewProperty: NewProperty | undefined;
  selectedCandidates: OldPropertyCandidate[];
  metrics: ReconciliationMetrics;
  money: (val: number) => string;
  percentText: (val: number) => string;
  getDifferenceColorClass: (val: number) => string;
  getBadgeForPercent: (val: number) => React.ReactNode;
  stepNumber?: number;
}

export interface BasePropertySidebarProps {
  currentProperty: NewProperty | undefined;
  inferredMappingType: string;
  selectedNewIndex: number;
  totalCount: number;
  onPrevRecord: () => void;
  onNextRecord: () => void;
  rvLabel?: string;
}

export interface FloorVisualizerProps {
  floorPropertyTabs: FloorTab[];
  selectedFloorProperty: string;
  setSelectedFloorProperty: (val: string) => void;
  floorDataMap: Record<string, FloorDetail[]>;
  hoveredFloorIndex: number | null;
  setHoveredFloorIndex: (idx: number | null) => void;
  money: (val: number) => string;
  stepNumber?: number;
}

export interface ActionFooterProps {
  selectedCandidates: OldPropertyCandidate[];
  validationStatus: {
    isValid: boolean;
    errorMsg: string | null;
    warnings: string[];
  };
  onConfirmClick: () => void;
}

export interface CompareRow {
  label: string;
  baseVal: string;
  candVal: string;
  isMatch: boolean;
  [key: string]: unknown;
}

export interface DiffModalProps {
  candidate: OldPropertyCandidate | null;
  currentNewProperty: NewProperty | undefined;
  onClose: () => void;
  money: (val: number) => string;
  rvLabel?: string;
}

export interface ActiveMappingsRegisterProps {
  mappings: MappingLink[];
  onDisconnectMapping: (newPropNo: string, id: string) => void;
}

export interface AuditTrailProps {
  historyList: AuditHistory[];
}

export interface MappedNewPropertyItem {
  id: number;
  pdnId?: number | null;
  taxZoneId?: number | null;
  zoneNo?: string | null;
  propertyNo?: string | null;
  partitionNo?: string | null;
  wardId?: number | null;
  wardNo?: string | null;
  mobileNo?: string | null;
  emailId?: string | null;
  ocNo?: string | null;
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
  calculationValue?: number | null;
  capitalValue?: number | null;
  rateableValue?: number | null;
  newTaxTotal?: number | null;
  newTaxTotalCV?: number | null;
  newTaxTotalRV?: number | null;
  totalTax?: number | null;
  oldTotalTax?: number | null;
  retroTaxTotal?: number | null;
  currentDemand?: number | null;
  carpetASqMtr?: number | null;
  carpetASqFt?: number | null;
  builtupASqMtr?: number | null;
  builtupASqFt?: number | null;
  propertyPhotoDocumentGuid?: string | null;
  planPhotoDocumentGuid?: string | null;
  photos?: unknown[];
}

export interface MappedNewPropertiesApiResponse {
  items: MappedNewPropertyItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface MappedNewPropertiesParams {
  oldPropertyId?: number | null;
  wingDetailsId?: number | string | null;
  pageNumber?: number | null;
  pageSize?: number | null;
  searchTerm?: string | null;
  sortBy?: string | null;
  sortOrder?: string | null;
  filterLogic?: number | null;
}

export interface MappedOldTaxDetailItem {
  id: number;
  propertyMastOldId: number;
  financeYearId?: number | null;
  calculationType?: string | null;
  calculationValue?: number | null;
  calculationAnnualValue?: number | null;
  taxId?: number | null;
  taxName?: string | null;
  taxAmount?: number | null;
}

export interface MappedOldPropertyItem {
  id: number;
  propertyNo?: string | null;
  oldPropertyNo?: string | null;
  wardNo?: string | null;
  zoneNo?: string | null;
  mobileNo?: string | null;
  emailId?: string | null;
  ocNo?: string | null;
  ocDate?: string | null;
  oldPropertyTypeId?: number | null;
  oldPartitionNo?: string | null;
  oldEgovNo?: string | null;
  oldPlotNo?: string | null;
  oldAssessmentYear?: string | null;
  oldAssessmentDate?: string | null;
  oldConstructionTypeOfUseId?: string | null;
  flatOrShopNo?: string | null;
  flatOrShopName?: string | null;
  ownerName?: string | null;
  ownerNameEnglish?: string | null;
  occupierName?: string | null;
  occupierNameEnglish?: string | null;
  floor?: string | null;
  floorCode?: string | null;
  wing?: string | null;
  noOfRooms?: number | null;
  constructionYear?: string | null;
  typeOfUse?: string | null;
  typeOfUseCode?: string | null;
  constructionType?: string | null;
  constructionCode?: string | null;
  rateableValue?: number | null;
  capitalValue?: number | null;
  totalTax?: number | null;
  oldTotalTax?: number | null;
  retroTaxTotal?: number | null;
  csn?: string | null;
  constructionArea?: number | null;
  carpetASqMtr?: number | null;
  carpetASqFt?: number | null;
  builtupASqMtr?: number | null;
  builtupASqFt?: number | null;
  propertyPhotoDocumentGuid?: string | null;
  planPhotoDocumentGuid?: string | null;
  photos?: unknown[];
  oldTaxDetails?: MappedOldTaxDetailItem[];
}

export interface MappedOldPropertiesApiResponse {
  items: MappedOldPropertyItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface MappedOldPropertiesParams {
  propertyId?: number | null;
  pageNumber?: number | null;
  pageSize?: number | null;
  searchTerm?: string | null;
  sortBy?: string | null;
  sortOrder?: string | null;
  filterLogic?: number | null;
}

