/**
 * Types for Property Edit Screen Drawer
 */

export interface DrawerFloorDataRow {
  id: string;
  pdnId: number | null;
  floorId: string;
  conYear: string;
  asstYear: string;
  constructionTypeId: string;
  typeOfUseId: string;
  subTypeOfUseId: string;
  noOfRooms: string;
  area: string;
  // Rateable method fields
  rentMY: string;
  rateMY: string;
  monthlyRate?: string | number | null;
  yearlyRate?: string | number | null;
  rentalValue: string;
  depreciation: string;
  alv: string;
  mr: string;
  rv: string;
  // Capital method fields
  sdrr: string;
  baseValue: string;
  floorFactor: string;
  ageFactor: string;
  ntbFactor: string;
  useFactor: string;
  capitalValue: string;
  [key: string]: unknown;
}

export interface DrawerFormData {
  ownerName: string;
  occupierName: string;
  renterName: string;
  propertyDescription: string;
  propertyTypeId: string;
  bhk: string;
  mobileNo: string;
  emailId: string;
  flatOrShopName: string;
  wingName: string;
  flatOrShopNo: string;
  oldPropertyNo: string;
  remark: string;
  oldRV: string;
  newRV: string;
  oldTax: string;
  newTax: string;
  oldArea: string;
  newArea: string;
  oldUseType: string;
  oldConstructionType: string;
  oldCSN: string;
  oldConstructionYear: string;
}

export interface DrawerFormErrors {
  ownerName?: string;
  occupierName?: string;
  renterName?: string;
  mobileNo?: string;
  emailId?: string;
  flatOrShopNo?: string;
  flatOrShopName?: string;
  wingName?: string;
  oldPropertyNo?: string;
  bhk?: string;
}

export interface DrawerDropdownOption {
  value: string;
  label: string;
}

export interface DrawerSubTypeOption extends DrawerDropdownOption {
  typeOfUseId: string;
}

export const INITIAL_DRAWER_FORM_DATA: DrawerFormData = {
  ownerName: "",
  occupierName: "",
  renterName: "",
  propertyDescription: "",
  propertyTypeId: "",
  bhk: "",
  mobileNo: "",
  emailId: "",
  flatOrShopName: "",
  wingName: "",
  flatOrShopNo: "",
  oldPropertyNo: "",
  remark: "",
  oldRV: "",
  newRV: "",
  oldTax: "",
  newTax: "",
  oldArea: "",
  newArea: "",
  oldUseType: "",
  oldConstructionType: "",
  oldCSN: "",
  oldConstructionYear: "",
};
