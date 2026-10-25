/**
 * Types for Mapped Properties Society Wise API
 * GET /api/PropertyMapMaster/mapped-properties-society-wise
 */

export interface MappedPropertySocietyWiseItem {
  propertyId: number;
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
  taxZoneId: number | null;
  propertyTypeId: number | null;
  categoryId: number | null;
  wingDetailId: number | null;
  mappingCategory: string | null;
  oldWardNo: string | null;
  oldPropertyNo: string | null;
  oldPartitionNo: string | null;
  oldEgovNo: string | null;
  oldPropertyTypeId: number | null;
  oldALV: number | null;
  oldRV: number | null;
  oldGeneralTax: number | null;
  oldTotalTax: number | null;
  oldZoneNo: string | null;
  oldPlotNo: string | null;
  oldCSN: string | null;
  oldPlotArea: number | null;
  oldConstructionYear: string | null;
  oldAssessmentYear: string | null;
  oldFloor: string | null;
  oldConstructionTypeOfUseId: string | null;
  oldUseType: string | null;
  oldConstructionArea: number | null;
  oldOwnerName: string | null;
  oldOccupierName: string | null;
  oldAddress: string | null;
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
  oldFlatOrShopNumber: string | null;
  oldWing: string | null;
  oldMobileNo: string | null;
}

export interface MappedPropertySocietyWiseParams {
  wingDetailsId?: number | null;
  societyDetailId?: number | null;
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filterLogic?: number;
}

export interface MappedPropertySocietyWiseResponse {
  items: MappedPropertySocietyWiseItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}
