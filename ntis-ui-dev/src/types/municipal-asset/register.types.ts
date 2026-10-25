export type AssetRegisterRow = {
  id: number | null;
  assetId: string;
  authorityName: string;
  organizationName: string;
  departmentName: string;
  assetCode: string;
  assetName: string;
  categoryName: string;
  assetTypeName: string;
  parentAssetName: string;
  address: string;
  wardName: string;
  zoneName: string;
  latitude: string;
  longitude: string;
  csn: string;
  hasLift: string;
  purchaseDate: string;
  marketValueDate: string;
  capitalValue: string;
  lastCVCalculationDate: string;
  currentBookValue: string;
  depreciation: string;
  netBookValue: string;
  lifeYears: string;
  depreciationRate: string;
  isRevenueGenerating: string;
  operationalControl: string;
  fieldValues: string;
  occupancyStatus: string;
  encroachmentStatus?: string | null;
  ownershipType: string;
  assetCondition: string;
  status: string;
  purchaseValue: string;
  marketValue: string;
  builtUpAreaSqMeter: string;
  carpetAreaSqMeter: string;
  landAreaSqMeter: string;
  createdDate: string;
  // Edit-mode context
  assetCategoryId: number | null;
  assetTypeId: number | null;
};

export interface AssetFieldValueDto {
  id: number;
  fieldDefinitionId?: number;
  fieldName: string;
  textValue?: string | null;
  numberValue?: number | null;
  dateValue?: string | null;
  booleanValue?: boolean | null;
  fieldValue?: string | number | boolean | null;
  value?: string | number | boolean | null;
}

export interface AssetRegisterApiRecord {
  id: number;
  isActive: boolean;
  
  // Jurisdiction / Ownership Context
  authorityId?: number;
  organizationId?: number;
  departmentId?: number;

  // Identification / Category
  assetNo?: string;
  assetName?: string;
  name?: string;
  categoryName?: string;
  assetCategoryId?: number | null;
  assetTypeId?: number | null;
  department?: string;
  parentAssetId?: number;

  // Hierarchy
  hierarchyLevel?: number;
  hierarchyPath?: string;

  // Location
  address?: string;
  wardId?: number;
  zoneId?: number;
  subZoneId?: number;
  moujaId?: number;
  latitude?: number;
  longitude?: number;
  csn?: string;

  // Type of Use
  typeOfUseId?: number;
  subTypeOfUseId?: number;

  // Area Details
  builtUpAreaSqMeter?: number;
  carpetAreaSqMeter?: number;
  landAreaSqMeter?: number;
  hasLift?: boolean;

  // Valuation
  purchaseValue?: number;
  purchaseDate?: string;
  marketValue?: number;
  marketValueDate?: string;
  capitalValue?: number;
  lastCVCalculationDate?: string;
  currentBookValue?: number;
  depreciationRate?: number;
  depreciation?: number; // Might be needed for the UI table

  // Legal / Acquisition
  ownershipType?: string;

  // Status
  status?: string;
  occupancyStatus?: string;
  encroachmentStatus?: string | null;

  // Revenue & Operations
  isRevenueGenerating?: boolean;
  operationalControl?: string;
  assetCondition?: string;

  // Floor details reference
  floorDetailsId?: number;

  // Field Values for dynamic fields
  fieldValues?: AssetFieldValueDto[];

  // Navigation property names for display
  authorityName?: string;
  organizationName?: string;
  parentAssetName?: string;
  zoneName?: string;
  wardName?: string;
  moujaName?: string;
  typeOfUseName?: string;
  subTypeOfUseName?: string;
  
  // Base fields
  createdDate?: string;
  updatedDate?: string;
}

export type AssetRegisterPageResult = {
  items: AssetRegisterApiRecord[];
  totalCount: number;
  totalPurchaseValue?: number;
  totalMarketValue?: number;
  totalDepreciation?: number;
  netBookValue?: number;
  activeAssetsCount?: number;
  error?: string | null;
};
