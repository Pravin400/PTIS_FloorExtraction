import type { AssetCategory } from "./asset-type/asset-category.types";

export interface AssetRegisterOption {
  id: number;
  label: string;
}

export interface AssetRegisterWardOption extends AssetRegisterOption {
  zoneId: number | null;
}

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
  mpmsNo?: string | null;
  mpmsId?: string | number | null;
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
  plotNo?: string;
  typeOfUseId?: number;
  subTypeOfUseId?: number;
  builtUpAreaSqMeter?: number;
  carpetAreaSqMeter?: number;
  landAreaSqMeter?: number;
  hasLift?: boolean;
  purchaseValue?: number;
  purchaseDate?: string;
  marketValue?: number;
  marketValueDate?: string;
  capitalValue?: number;
  annualRevenue?: number;
  leaseStartDate?: string | null;
  leaseEndDate?: string | null;
  lastCVCalculationDate?: string;
  currentBookValue?: number;
  depreciationRate?: number;
  depreciation?: number;
  ownershipType?: string;
  status?: string;
  occupancyStatus?: string;
  encroachmentStatus?: string | null;
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
  assetPhotoGuid?: string | null;
  floorPlanGuid?: string | null;
  gisMapGuid?: string | null;
  assetLife?: number | null;
  constructionYear?: number | null;
  totalSubUnits?: number;
  totalPhotos?: number;
  /** Real health score (0-100) computed backend-side from actual condition, occupancy,
   *  documents, photos, sub-units, capital value, and workflow state — the single source
   *  of truth; the frontend should not recompute its own value when this is present. */
  healthScore?: number | null;
  healthScoreRating?: string | null;
}

export interface AssetRegisterPageResult {
  items: AssetRegisterApiRecord[];
  totalCount: number;
  totalSubUnits?: number;
  totalPurchaseValue?: number;
  totalMarketValue?: number;
  totalDepreciation?: number;
  netBookValue?: number;
  totalOutstanding?: number;
  totalCapitalValue?: number;
  totalAnnualRevenue?: number;
  activeAssetsCount?: number;
  encroachmentsCount?: number;
  /** Average HealthScore across every asset matching the current filter (not just the
   *  current page), computed backend-side the same way each asset's own score is. */
  avgHealthScore?: number | null;
  error?: string | null;
}
