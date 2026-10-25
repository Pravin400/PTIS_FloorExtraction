export interface ApartmentEditFormData {
  // Database IDs & Master IDs
  id?: number | null;
  propertyId?: number | null;
  societyDetailId?: number | null;
  moujaId?: number | null;
  taxZoneId?: number | null;
  categoryId?: number | null;
  propertyTypeId?: number | null;
  ownerTypeId?: number | null;

  // Header Identifiers
  propertyNo: string;
  upic: string;

  // Section 1: Property Information
  societyName: string;
  societyNameEnglish?: string;
  propertyDescription: string;
  division: string;
  wardNo: string;
  category: string;
  taxZoneAndName: string;
  subZoneCsnNo: string;
  plotNo: string;
  surveyNo?: string;
  pinCode?: string;
  aadharNo?: string;
  societyAddress: string;
  societyAddressEnglish?: string;
  landOwnerName: string;
  landOwnerNameEnglish?: string;
  occupierName?: string;
  occupierNameEnglish?: string;
  builderName: string;
  builderNameEnglish?: string;
  builderMobileNo?: string;
  mobileNo?: string;
  alternateMobileNo?: string;

  // Section 2: Manager & Secretary Information
  societyEmail: string;
  managerName: string;
  managerNameEnglish?: string;
  managerMobileNo: string;
  managerEmail: string;
  secretaryName: string;
  secretaryNameEnglish?: string;
  secretaryMobileNo: string;
  secretaryEmail: string;
}

export interface SectionWingScope {
  applyToAll: boolean;
  selectedWingIds: number[];
}
