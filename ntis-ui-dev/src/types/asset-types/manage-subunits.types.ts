/**
 * Manage SubUnits API Types
 */

export interface RentInformationDto {
  leaseRentType?: string;
  leaseStart?: string;
  leaseEnd?: string;
  duration?: string;
  rentFrequency?: string;
  rentAmount?: number;
  securityDeposit?: number;
  depositType?: string;
}

export interface FloorConfigurationDto {
  unitAreaSqFt?: number;
  calculatedCapitalValue?: number;
}

export interface RoomDetailDto {
  lengthMtr?: number;
  widthMtr?: number;
  heightMtr?: number;
  areaSqMtr?: number;
  base1Mtr?: number;
  base2Mtr?: number;
  noOfRooms?: number;
  totalAreaSqMtr?: number;
  roomNo?: string;
  roomType?: string;
  shape?: string;
  submissionType?: string;
  outerYesNo?: boolean;
  minusYesNo?: boolean;
}

export interface CreateSubUnitRequest {
  parentAssetId: number;
  assetId: number;
  complexName?: string;
  renterName?: string;
  propertyDescription?: string;
  shopUnitName?: string;
  zoneNo?: number;
  unitNo?: string;
  wardNo?: number;
  propertyNo?: string;
  partitionNo?: string;
  mpmsNo?: string;
  mobileNo?: string;
  surveyNo?: string;
  emailId?: string;
  gstNo?: string;
  totalAreaSqFt?: number;
  shopActNo?: string;
  aadhaarCardNo?: string;
  panCardNo?: string;
  createdBy?: number;
  typeOfUseId?: number;
  subTypeOfUseId?: number;
  constructionTypeId?: number;
  constructionYear?: number;
  assessmentYear?: number;
  rentInformation?: RentInformationDto;
  floorConfiguration?: FloorConfigurationDto;
  isRoomWiseValuationActive?: boolean;
  roomDetails?: RoomDetailDto[];
  departmentId?: number;
  locationAddress?: string;
  locationLat?: string;
  locationLng?: string;
}

export interface SubUnitResponseDto {
  id: number;
  parentAssetId: number;
  assetId: number;
  complexName?: string;
  shopUnitName?: string;
  unitNo?: string;
  totalAreaSqFt?: number;
  calculatedCapitalValue?: number;
  createdDate?: string;
}

export interface BulkGenerateRequest {
  parentAssetId: number;
  floorDetailsId: number;
  type: string;
  prefix: string;
  startNumber: number;
  count: number;
  areaSqFt: number;
  createdBy?: number;
}

export interface GeneratedAssetDto {
  assetId: number;
  assetNo: string;
  assetName: string;
  roomWiseSubmissionDetailsId?: number;
}

export interface BulkGenerateResponse {
  totalGenerated: number;
  generatedAssets: GeneratedAssetDto[];
  errors: string[];
}
