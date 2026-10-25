export interface PropertyPerformanceData {
  gradeScore?: number;
  maxScore?: number;
  gradeLabel?: string;
  gradeDescription?: string;
  starRating?: number;
  healthScore?: number;
  healthStatus?: string;
  thisAssessmentRevenue?: string;
  revenueGrowthPct?: string;
  revisionNote?: string;

  // Summary and Tax metrics
  currentTax?: string;
  retroTax?: string;
  totalTax?: string;
  totalDemand?: string;
  currentDemand?: string;
  pendingDemand?: string;
  collectionAmount?: string;
  collectionPercent?: number | string;
  totalBalance?: string;
  totalOutstanding?: string;
  arrears?: string;
  interest?: string;
  advance?: string;

  // Additional revenue parameters
  oldCurrentTax?: string;
  differenceAmount?: string;
  rawDifferenceAmount?: number | null;
  changePercent?: number | null;
  isGrowthNegative?: boolean;
}

export type PropertyCategoryType = 'APARTMENT' | 'INDIVIDUAL' | string;

export interface ApartmentQcWingDto {
  wingDetailId?: number;
  wingMasterId?: number;
  wingName?: string;
  wingNo?: string | null;
  secretaryName?: string | null;
  secretaryNameEnglish?: string | null;
  secretaryMobileNo?: string | null;
  secretaryEmailId?: string | null;
  managerName?: string | null;
  managerNameEnglish?: string | null;
  managerMobileNo?: string | null;
  managerEmailId?: string | null;
}

export interface PropertyMasterData {
  propertyId?: number;
  propertyNo?: string;
  upic: string;
  societyName?: string;
  ownerName?: string;
  ownerNameEnglish?: string;
  status?: 'ACTIVE PROPERTY' | 'INACTIVE' | 'PENDING' | string;
  syncStatus?: string;

  // Apartment & Individual specific fields
  societyNameEnglish?: string;
  landOwnerName?: string;
  landOwnerNameEnglish?: string;
  builderName?: string;
  builderNameEnglish?: string;
  builderMobileNo?: string;
  societyEmail?: string;
  societyAddressEnglish?: string;
  secretaryName?: string;
  secretaryNameEnglish?: string;
  secretaryMobileNo?: string;
  secretaryEmail?: string;
  managerName?: string;
  managerNameEnglish?: string;
  managerMobileNo?: string;
  managerEmail?: string;
  owner?: string;
  propertyHolder?: string;
  holderRegional?: string;
  occupierName?: string;
  occupierRegional?: string;
  occupierNameEnglish?: string;

  division: string;
  wardNo?: string;
  moujaName?: string;
  surveyNo?: string;
  subZoneCsnNo?: string;
  taxZoneAndName?: string;
  ownerCategory?: string;

  plotNo: string;
  taxZone: string;
  aadharNo?: string;
  title?: string;

  mobileNo?: string;
  altMobileNo?: string;
  alternateMobileNo?: string;
  emailId?: string;

  societyAddress?: string;
  address?: string;
  pincode?: string;
  pinCode?: string;

  moujaId?: number | null;
  taxZoneId?: number | null;
  categoryId?: number | null;
  propertyTypeId?: number | null;
  ownerTypeId?: number | null;

  secretaryTargetWingDetailIds?: number[];
  managerTargetWingDetailIds?: number[];

  plotArea?: string;
  plotAreaFtMtr?: string;
  carpetBuiltUpArea?: string;
  carpetAreaFtMtr?: string;
  builtUpAreaFtMtr?: string;
  oldCarpetBuiltUp?: string;
  oldCarpetAreaFtMtr?: string;
  oldBuiltUpAreaFtMtr?: string;
  totalFloors?: string;
  totalWings?: number | string;
  totalPropertiesResCommAmen?: string;

  societyBuildingPhotoGuid?: string;
  imageUrl?: string;

  performance?: PropertyPerformanceData;
  category?: PropertyCategoryType;
  categoryTag?: string;
  propertyDescriptionRegional?: string;
  wings?: ApartmentQcWingDto[];
  latitude?: string | number | null;
  longitude?: string | number | null;
}

export type IndividualPropertyMasterData = PropertyMasterData;

export interface WardOption {
  value: string;
  label: string;
}

export interface PropertySearchOption {
  value: string;
  label: string;
}

export interface PartitionOption {
  value: string;
  label: string;
}
