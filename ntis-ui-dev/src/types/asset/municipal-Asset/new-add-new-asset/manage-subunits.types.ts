export interface RentInformationDto {
  agreementStartDate?: string;
  agreementEndDate?: string;
  monthlyRentAmount?: number;
  securityDeposit?: number;
  noticePeriodDays?: number;
  occupantName?: string;
  occupantContactNumber?: string;
  occupantEmail?: string;
  occupantPanNumber?: string;
  occupantAadhaarNumber?: string;
  remarks?: string;
  [key: string]: unknown;
}

export interface FloorConfigurationDto {
  floorId: number;
  floorName?: string;
  carpetArea?: number;
  builtUpArea?: number;
  superBuiltUpArea?: number;
  roomDetails?: RoomDetailDto[];
  [key: string]: unknown;
}

export interface RoomDetailDto {
  roomTypeId: number;
  roomCount: number;
  area: number;
  [key: string]: unknown;
}

export interface CreateSubUnitRequest {
  parentAssetId: number;
  subUnitName: string;
  subUnitCode?: string;
  subUnitType?: string;
  propertyClassificationId?: number;
  ownershipTypeId?: number;
  subUsageTypeId?: number;
  carpetArea?: number;
  builtUpArea?: number;
  superBuiltUpArea?: number;
  isLeased?: boolean;
  rentInformation?: RentInformationDto;
  floorConfiguration?: FloorConfigurationDto[];
  [key: string]: unknown;
}

export interface SubUnitResponseDto {
  id: number;
  parentAssetId: number;
  subUnitName: string;
  subUnitCode: string;
  subUnitType?: string;
  carpetArea?: number;
  builtUpArea?: number;
  isLeased?: boolean;
  createdDate?: string;
  [key: string]: unknown;
}

export interface BulkGenerateRequest {
  parentAssetId: number;
  prefix: string;
  startNumber: number;
  count: number;
  floorDetailsId?: number;
  [key: string]: unknown;
}

export interface GeneratedAssetDto {
  id: number;
  assetNo: string;
  name?: string;
  [key: string]: unknown;
}

export interface BulkGenerateResponse {
  success: boolean;
  count: number;
  generatedAssets: GeneratedAssetDto[];
  message?: string;
}
