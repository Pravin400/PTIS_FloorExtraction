export interface AssetChildAssetItem {
  id: number | string;
  assetNo?: string | null;
  assetName?: string | null;
  assetTypeName?: string | null;
  parentAssetId?: number | string | null;
  hierarchyLevel?: number | string | null;
  wardName?: string | null;
  zoneName?: string | null;
  builtUpAreaSqMeter?: number | string | null;
  carpetAreaSqMeter?: number | string | null;
  status?: string | null;
  occupancyStatus?: string | null;
  isActive?: boolean | null;
}

export interface AssetDocumentListItem {
  id: number | string;
  documentId?: number | string | null;
  documentDefinitionId?: number | string | null;
  documentCode?: string | null;
  documentName?: string | null;
  name?: string | null;
  fileName?: string | null;
  fileExtension?: string | null;
  fileSize?: number | string | null;
  filePath?: string | null;
  isVerified?: boolean | null;
  documentTitle?: string | null;
  documentDate?: string | null;
  documentNumber?: string | null;
  remarks?: string | null;
  createdDate?: string | null;
  uploadedDate?: string | null;
  contentType?: string | null;
  status?: string | null;
  assetId?: number | string | null;
}

export interface AssetFieldDefinitionItem {
  id: number | string;
  fieldName?: string | null;
  fieldLabel?: string | null;
  fieldType?: string | null;
  fieldGroup?: string | null;
  dataType?: string | null;
  isRequired?: boolean | null;
  displayOrder?: number | string | null;
}

export interface AssetFloorDetailItem {
  id: number | string;
  assetId?: number | string | null;
  floorId?: number | string | null;
  floorNo?: number | string | null;
  floorName?: string | null;
  subFloorName?: string | null;
  constructionYear?: string | null;
  assessmentYear?: string | null;
  constructionTypeName?: string | null;
  typeOfUseName?: string | null;
  subTypeOfUseName?: string | null;
  builtUpAreaSqMeter?: number | string | null;
  builtUpAreaSqFeet?: number | string | null;
  carpetAreaSqMeter?: number | string | null;
  carpetAreaSqFeet?: number | string | null;
  noOfRooms?: number | string | null;
  baseValue?: number | string | null;
  capitalValue?: number | string | null;
  marketValue?: number | string | null;
}

export interface AssetFloorSummary {
  floorDetails: AssetFloorDetailItem[];
  totalBaseValue?: number | string | null;
  totalCapitalValue?: number | string | null;
  totalMarketValue?: number | string | null;
  totalFloors?: number | string | null;
}

export interface AssetFloorDetailsRequest {
  floorId: number;
  subFloorId?: number | null;
  constructionYear?: string;
  assessmentYear?: string;
  constructionTypeId: number;
  typeOfUseId: number;
  subTypeOfUseId?: number | null;
  carpetAreaSqMeter?: number;
  carpetAreaSqFeet?: number;
  builtUpAreaSqMeter?: number;
  builtUpAreaSqFeet?: number;
  noOfRooms?: number;
  isRented?: boolean | null;
  rentMonthly?: number | null;
  rentYearly?: number | null;
  nonCalculateRentMonthly?: number | null;
  renterNameEnglish?: string | null;
  renterNameLocal?: string | null;
  agreementFromDate?: string | null;
  agreementDate?: string | null;
  agreementToDate?: string | null;
  taxLiability?: string | null;
  isTaxable?: boolean | null;
  occupancyDate?: string | null;
  occupancyApplied?: boolean | null;
  occupancyNumber?: string | null;
  capitalValue?: number | null;
  marketValue?: number | null;
  lastCvCalculationDate?: string | null;
  cvBaseRate?: number | null;
  cvAgeFactor?: number | null;
  cvFloorFactor?: number | null;
  cvNatureFactor?: number | null;
  cvUseFactor?: number | null;
  cvCalculationFormula?: string | null;
  isActive: boolean;
}
