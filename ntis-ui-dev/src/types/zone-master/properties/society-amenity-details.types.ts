export interface SocietyAmenityDetailItem {
  propertyId: number;
  societyDetailId: number;
  wingId: number;
  wingNo: string;
  wingName: string;
  wardId: number;
  wardNo: string;
  propertyNo: string;
  partitionNo: string;
  partType: string;
}

export interface SocietyAmenityDetailsResponse {
  success: boolean;
  message: string;
  items: SocietyAmenityDetailItem[];
}
