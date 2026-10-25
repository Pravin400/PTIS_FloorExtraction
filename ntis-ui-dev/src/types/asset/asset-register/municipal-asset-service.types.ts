import type { AssetCategory } from "../../asset-masters/asset-category.types";

export interface AssetRegisterOption {
  id: number;
  label: string;
}

export interface AssetRegisterWardOption extends AssetRegisterOption {
  zoneId: number | null;
}

export interface ApiOwnershipTypeItem {
  id: number;
  ownershipTypeName: string;
  description?: string | null;
  isActive?: boolean;
  createdDate?: string | null;
  updatedDate?: string | null;
}

export interface ApiTypeOfUseItem {
  id: number;
  assetCategoryId?: number | null;
  assetTypeId?: number | null;
  typeOfUseCode?: string | null;
  description?: string | null;
  type?: string | null;
  typeOfUseGroupId?: number | null;
  typeOfUseGroupName?: string | null;
  searchSequence?: number | null;
  isActive?: boolean;
  markedForDeletion?: boolean;
}

export type EncroachmentStatusType = 'all' | 'Fully Encroached' | 'Partially Encroached' | 'Clean';

export interface AssetType {
  id: number;
  typeCode?: string;
  typeName?: string;
  assetTypeName?: string;
  categoryId?: number;
  assetCategoryId?: number;
  categoryName?: string;
  description?: string;
  isActive: boolean;
  allowUnitRegistration?: boolean;
  allowRoomRegistration?: boolean;
  createdDate?: string;
  updatedDate?: string | null;
}

export interface Department {
  id: number;
  departmentName: string;
  owningDepartmentName?: string;
  departmentCode?: string;
  imageUrl?: string;
  logo?: string;
  logoUrl?: string;
  icon?: string;
  image?: string;
  isActive?: boolean;
}

export interface Ward {
  id: number;
  wardName: string;
  WardName?: string;
  wardNo?: string;
  WardNo?: string;
  name?: string;
  Name?: string;
  description?: string;
  Description?: string;
  wardCode?: string;
  isActive?: boolean;
  zoneId?: number | string | null;
}

export interface Zone {
  id: number;
  zoneNo: string;
  ZoneNo?: string;
  zoneName?: string;
  ZoneName?: string;
  description?: string;
  sequenceNo?: number;
  isActive?: boolean;
}

export interface ApiCategoryItem extends AssetCategory {
  IsActive?: boolean;
  status?: string;
}

export interface ApiTypeItem extends AssetType {
  IsActive?: boolean;
  status?: string;
  category?: number;
  AssetCategory?: number;
}

export interface ApiDepartmentItem extends Department {
  IsActive?: boolean;
  status?: string;
  owningDepartmentName?: string;
  departmentIcon?: string;
  deptImage?: string;
  deptLogo?: string;
}

export interface AssetFieldValueDto {
  id: number;
  fieldDefinitionId?: number;
  fieldName: string;
  textValue?: string | null;
  numberValue?: number | null;
  dateValue?: string | null;
  booleanValue?: boolean | null;
}

export interface AssetRegisterApiRecord {
  id: number;
  isActive: boolean;
  authorityId?: number;
  organizationId?: number;
  departmentId?: number;
  assetNo?: string;
  assetName?: string;
  name?: string;
  categoryName?: string;
  assetCategoryId?: number | null;
  assetTypeId?: number | null;
  department?: string;
  parentAssetId?: number;
  hierarchyLevel?: number;
  hierarchyPath?: string;
  address?: string;
  wardId?: number;
  zoneId?: number;
  subZoneId?: number;
  moujaId?: number;
  latitude?: number;
  longitude?: number;
  csn?: string;
  typeOfUseId?: number;
  subTypeOfUseId?: number;
  builtUpAreaSqMeter?: number;
  carpetAreaSqMeter?: number;
  plotAreaSqMeter?: number;
  landAreaSqMeter?: number;
  hasLift?: boolean;
  purchaseValue?: number;
  purchaseDate?: string;
  marketValue?: number;
  marketValueDate?: string;
  capitalValue?: number;
  lastCVCalculationDate?: string;
  currentBookValue?: number;
  depreciationRate?: number;
  depreciation?: number;
  ownershipType?: string;
  status?: string;
  occupancyStatus?: string;
  isRevenueGenerating?: boolean;
  operationalControl?: string;
  assetCondition?: string;
  floorDetailsId?: number;
  fieldValues?: AssetFieldValueDto[];
  details?: Record<string, unknown>;
  authorityName?: string;
  organizationName?: string;
  parentAssetName?: string;
  zoneName?: string;
  wardName?: string;
  moujaName?: string;
  typeOfUseName?: string;
  subTypeOfUseName?: string;
  departmentName?: string;
  assetTypeName?: string;
  assetCategoryName?: string;
  createdDate?: string;
  updatedDate?: string;
  assetDocumentId?: number | null;
  assetLife?: number | null;
  constructionYear?: number | null;
  constructionTypeName?: string | null;
  mpmsNo?: string | null;
  totalFloors?: number | null;
  totalSubUnits?: number;
  annualRevenue?: number;
  outstandingAmount?: number;
  encroachmentStatus?: string | null;
  photoCount?: number;
  documentCount?: number;
  hasPlanDocument?: boolean;
  hasTitleDocument?: boolean;
  hasSurveyDocument?: boolean;
  activeLeaseCount?: number;
}

export interface AssetRegisterPageResult {
  items: AssetRegisterApiRecord[];
  totalCount: number;
  summary?: AssetRegisterSummary;
  totalPurchaseValue?: number;
  totalMarketValue?: number;
  totalDepreciation?: number;
  netBookValue?: number;
  totalCapitalValue?: number;
  activeAssetsCount?: number;
  error?: string | null;
}

export interface AssetRegisterSummary {
  totalParentAssets: number;
  activeParentAssets: number;
  totalSubUnits: number;
  activeSubUnits: number;
  totalCapitalValue: number;
  totalAnnualRevenue: number;
  totalOutstanding: number;
  encroachedAssets: number;
}

export interface ApiSubUnitFloorDetail {
  id: number;
  assetId: number;
  floorId: number;
  subFloorId?: number | null;
  constructionYear?: string | number | null;
  assessmentYear?: string | number | null;
  constructionTypeId?: number | null;
  typeOfUseId?: number | null;
  subTypeOfUseId?: number | null;
  carpetAreaSqMeter?: number | null;
  carpetAreaSqFeet?: number | null;
  builtupAreaSqMeter?: number | null;
  builtupAreaSqFeet?: number | null;
  noOfRooms?: number | null;
  baseValue?: number | null;
  capitalValue?: number | null;
  cvAgeFactor?: number | null;
  cvFloorFactor?: number | null;
  cvNatureFactor?: number | null;
  cvUseFactor?: number | null;
  cvBaseRate?: number | null;
  isRented?: boolean;
  isActive?: boolean;
  floorName?: string | null;
  subFloorName?: string | null;
  constructionTypeName?: string | null;
  typeOfUseName?: string | null;
  subTypeOfUseName?: string | null;
}

export interface ApiSubUnitRecord {
  assetId: number;
  assetNo: string;
  assetName: string;
  assetRegionalName?: string | null;
  assetCategoryId: number;
  assetCategoryName: string;
  assetTypeId: number;
  assetTypeName: string;
  occupancyStatus?: string | null;
  isActive: boolean;
  createdDate?: string | null;
  floorDetails?: ApiSubUnitFloorDetail[];
  photos?: unknown[];
  documents?: unknown[];
}

export interface ParentAssetSubUnitApiResponse {
  parentAssetId: number;
  parentAssetNo?: string;
  parentAssetName?: string;
  parentIsActive?: boolean;
  totalSubUnits: number;
  items: ApiSubUnitRecord[];
  totalCount?: number;
  pageNumber?: number;
  pageSize?: number;
  totalPages?: number;
  hasPrevious?: boolean;
  hasNext?: boolean;
}
