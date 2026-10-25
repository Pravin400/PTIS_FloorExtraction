/* eslint-disable @typescript-eslint/no-explicit-any */
export interface FloorDetailApiRequest {
  isActive: boolean;
  createdBy?: number;
  assetId: number;
  floorId: number;
  subFloorId?: number;
  constructionYear: string;
  assessmentYear: string | null;
  constructionTypeId: number;
  typeOfUseId: number;
  subTypeOfUseId: number | null;
  carpetAreaSqMeter: number;
  carpetAreaSqFeet: number;
  builtUpAreaSqMeter: number;
  builtUpAreaSqFeet: number;
  noOfRooms: number;
  isRented?: boolean;
  rentMonthly?: number | null;
  rentYearly?: number | null;
  nonCalculateRentMonthly?: number | null;
  renterNameEnglish?: string | null;
  renterNameLocal?: string | null;
  agreementFromDate?: string | null;
  agreementDate?: string | null;
  agreementToDate?: string | null;
  taxLiability?: string | null;
  isTaxable?: boolean;
  occupancyDate?: string | null;
  occupancyApplied?: boolean | null;
  occupancyNumber?: string | null;
  capitalValue?: number | null;
  marketValue?: number | null;
  baseValue?: number | null;
  lastCVCalculationDate?: string | null;
  cvBaseRate?: number | null;
  cvAgeFactor?: number | null;
  cvFloorFactor?: number | null;
  cvNatureFactor?: number | null;
  cvUseFactor?: number | null;
  cvCalculationFormula?: string | null;
  markedForDeletion?: boolean;
  markedForDeletionDate?: string | null;
}

export interface FloorDetailApiResponse extends FloorDetailApiRequest {
  id: number;
  createdDate: string;
  updatedDate?: string | null;
  subFloorName?: string | null;
  subTypeOfUseName?: string | null;
  useTypeName?: string | null;
  roomDetails?: any[] | null;
  roomWiseDetails?: any[] | null;
}

export interface SubUnitApiRequest {
  floorDetailId: number;
  unitNumber: string;
  unitType: string;
  carpetAreaSqFt: number;
  status: string;
  baseValue: number;
  isActive: boolean;
}

export interface SubUnitApiResponse extends SubUnitApiRequest {
  id: number;
  createdDate: string;
  modifiedDate?: string;
}

export interface BulkGenerateChildAssetsRequest {
  parentAssetId: number;
  type: string;
  count: number;
  floorDetailsId?: number;
  prefix?: string;
  startNumber?: number;
  areaSqFt?: number;
  createdBy?: number;
}

export interface GeneratedAssetDto {
  assetId: number;
  assetNo: string;
  assetName: string;
  roomWiseSubmissionDetailsId?: number | null;
}

export interface BulkGenerateChildAssetsResponse {
  totalGenerated: number;
  generatedAssets: GeneratedAssetDto[];
  errors: string[];
}

export interface RentInformationDto {
  leaseRentType?: string | null;
  leaseStart?: string | null;
  leaseEnd?: string | null;
  agreementId?: string | null;
  duration?: number | null;
  rentFrequency?: string | null;
  rentAmount?: number | null;
  securityDeposit?: number | null;
  depositType?: string | null;
}

export interface FloorConfigurationDto {
  unitAreaSqFt?: number | null;
  calculatedCapitalValue?: number | null;
}

export interface RoomDetailDto {
  lengthMtr?: number | null;
  widthMtr?: number | null;
  heightMtr?: number | null;
  areaSqMtr?: number | null;
  base1Mtr?: number | null;
  base2Mtr?: number | null;
  noOfRooms?: number | null;
  totalAreaSqMtr?: number | null;
  roomNo?: string | null;
  roomType?: string | null;
  shape?: string | null;
  submissionType?: string | null;
  outerYesNo: boolean;
  minusYesNo: boolean;
}

export interface CreateChildAssetRequest {
  parentAssetId: number;
  assetId: number;
  floorDetailsId?: number;
  floorId?: number | null;
  complexName?: string | null;
  renterName?: string | null;
  propertyDescription?: string | null;
  shopUnitName?: string | null;
  shopUnitNameLocal?: string | null;
  zoneNo?: number | null;
  unitNo?: string | null;
  wardNo?: number | null;
  propertyNo?: string | null;
  partitionNo?: string | null;
  mpmsNo?: string | null;
  mobileNo?: string | null;
  surveyNo?: string | null;
  emailId?: string | null;
  gstNo?: string | null;
  totalAreaSqFt?: number | null;
  aadhaarCardNo?: string | null;
  panCardNo?: string | null;
  createdBy?: number | null;
  rentInformation?: RentInformationDto | null;
  floorConfiguration?: FloorConfigurationDto | null;
  isRoomWiseValuationActive: boolean;
  roomDetails?: RoomDetailDto[] | null;
  departmentId?: number | null;
  locationAddress?: string | null;
  locationLat?: string | null;
  locationLng?: string | null;
  rooms?: any[] | null;
  subFloorId?: number | null;
  // ── SubUnitsDetails fields (persisted to AMS.SubUnitsDetails by backend STEP 5) ──
  constructionTypeId?: number | null;
  typeOfUseId?: number | null;
  subTypeOfUseId?: number | null;
  carpetAreaSqMeter?: number | null;
  carpetAreaSqFeet?: number | null;
  builtupAreaSqMeter?: number | null;
  builtupAreaSqFeet?: number | null;
}

export interface CreateChildAssetResponse {
  success: boolean;
  message: string;
  assetId?: number | null;
  assetNo?: string | null;
  shopUnitName?: string | null;
  roomWiseSubmissionDetailsId?: number | null;
  renterDetailsId?: number | null;
  errors: string[];
}
