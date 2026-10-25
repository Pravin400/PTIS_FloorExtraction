import type { ApartmentQcWingDto } from './property-master.types';

export interface ApartmentPropertyCountsDto {
  total?: number | null;
  residential?: number | null;
  commercial?: number | null;
  amenity?: number | null;
}

export interface ApartmentQcPropertyOverviewDto {
  upic?: string | null;
  propertyId?: string | null;
  wardNo?: string | null;
  wardName?: string | null;
  subZoneNo?: string | null;
  csn?: string | null;
  isActive?: boolean;
  isLocked?: boolean;
  propertyStatus?: string | null;
  totalFloor?: string | number | null;
  totalFloors?: string | number | null;
  propertyCounts?: ApartmentPropertyCountsDto | null;
  secretaryName?: string | null;
  secretaryNameEnglish?: string | null;
  secretaryMobileNo?: string | null;
  managerName?: string | null;
  managerNameEnglish?: string | null;
  managerMobileNo?: string | null;
  propertyHolder?: string | null;
  propertyCategory?: string | null;
  propertyDescription?: string | null;
  societyName?: string | null;
  societyNameEnglish?: string | null;
  builderName?: string | null;
  builderNameEnglish?: string | null;
  builder?: string | null;
  builderEnglish?: string | null;
  owner?: string | null;
  ownerName?: string | null;
  ownerNameEnglish?: string | null;
  holderRegional?: string | null;
  occupierName?: string | null;
  occupierNameEnglish?: string | null;
  occupierRegional?: string | null;
  ownerCategory?: string | null;
  moujaId?: number | null;
  taxZoneId?: number | null;
  categoryId?: number | null;
  propertyTypeId?: number | null;
  ownerTypeId?: number | null;
  secretaryTargetWingDetailIds?: number[] | null;
  managerTargetWingDetailIds?: number[] | null;
  societyBuildingPhotoGuid?: string | null;
  wings?: ApartmentQcWingDto[];
}

export interface ApartmentQcPropertyInfoDto {
  division?: string | null;
  wardNo?: string | null;
  wardName?: string | null;
  moujaName?: string | null;
  moujaId?: number | null;
  taxZoneId?: number | null;
  categoryId?: number | null;
  propertyTypeId?: number | null;
  ownerTypeId?: number | null;
  surveyNo?: string | null;
  plotNo?: string | null;
  taxZone?: string | null;
  subZoneNo?: string | null;
  subZone?: string | null;
  csn?: string | null;
  subZoneCsnNo?: string | null;
  mobileNo?: string | null;
  alternateMobileNo?: string | null;
  builderMobileNo?: string | null;
  managerMobileNo?: string | null;
  managerEmailId?: string | null;
  secretaryMobileNo?: string | null;
  secretaryEmailId?: string | null;
  aadharNo?: string | null;
  emailId?: string | null;
  address?: string | null;
  pincode?: string | null;
  pinCode?: string | null;
  plotAreaFt?: number | null;
  plotAreaMtr?: number | null;
  carpetAreaFt?: number | null;
  carpetAreaMtr?: number | null;
  builtUpAreaFt?: number | null;
  builtUpAreaMtr?: number | null;
  oldCarpetAreaFt?: number | null;
  oldCarpetAreaMtr?: number | null;
  oldBuiltUpAreaFt?: number | null;
  oldBuiltUpAreaMtr?: number | null;
  totalFloor?: string | number | null;
  totalFloors?: string | number | null;
}

export interface ApartmentQcAdditionalRevenueDto {
  currentTax?: number | null;
  retroTax?: number | null;
  totalTax?: number | null;
  pendingCurrent?: number | null;
  pendingDemand?: number | null;
  totalDemand?: number | null;
  currentDemand?: number | null;
  collection?: number | null;
  totalBalance?: number | null;
  oldCurrentTax?: number | null;
  differenceAmount?: number | null;
  changePercent?: number | null;
  thisAssessment?: number | null;
  previousAssessment?: number | null;
  totalOutstanding?: number | null;
  arrears?: number | null;
  interest?: number | null;
  advance?: number | null;
  basis?: string | null;
  dataAvailable?: boolean;
}

export interface ApartmentQcPerformanceSummaryDto {
  propertyGrade?: {
    score7?: number;
    letterGrade?: string;
    stars?: number;
    label?: string;
    dataAvailable?: boolean;
  };
  healthScore?: {
    percent?: number;
    label?: string;
    dataAvailable?: boolean;
    auditItems?: Array<{
      stageId?: number;
      stageName?: string;
      description?: string;
      isCompleted?: boolean;
    }>;
  };
  additionalRevenue?: ApartmentQcAdditionalRevenueDto;
}

export interface ApartmentQcTopSectionDto {
  propertyOverview?: ApartmentQcPropertyOverviewDto;
  propertyInfo?: ApartmentQcPropertyInfoDto;
  performanceSummary?: ApartmentQcPerformanceSummaryDto;
  additionalRevenue?: ApartmentQcAdditionalRevenueDto;
}

export interface ApartmentQcTopSectionResponse {
  success: boolean;
  message?: string;
  items?: ApartmentQcTopSectionDto;
  data?: ApartmentQcTopSectionDto;
  errors?: unknown;
  correlationId?: string | null;
}
