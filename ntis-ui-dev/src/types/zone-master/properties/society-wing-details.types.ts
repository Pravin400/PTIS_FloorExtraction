/**
 * Types for Society Wing Details API
 * Used to fetch wing and amenity counts for a property
 */
/**
 * Individual society wing detail item from the API
 */
export interface SocietyWingDetailItem {
  propertyId: number;
  societyDetailId: number;
  wingId: number;
  wingNo: string;
  wardNo: string;
  propertyNo: string;
  wingName: string;
  societyName: string;
  societyAddress: string;
  secretaryName: string;
  managerName: string;
  landOwnerName: string;
  builderName: string;
  societyNameEnglish: string;
  societyAddressEnglish: string;
  secretaryNameEnglish: string;
  managerNameEnglish: string;
  landOwnerNameEnglish: string;
  builderNameEnglish: string;
  managerMobileNo: string;
  secretaryMobileNo: string;
  societyEmailId: string;
  secretaryEmailId: string;
  managerEmailId: string;
  propertyCount: number;
  aminityCount: number;
}
/**
 * Response from the Society Wing Details API
 */
export interface SocietyWingDetailsResponse {
  success: boolean;
  message: string;
  items: SocietyWingDetailItem[];
  errors: string | null;
  correlationId: string | null;
}
