/**
 * Type definitions for Property Details Edit Form
 * Used in Apartment QC module
 */

import type { ApartmentQCDetail } from './apartmentQC.types';
import type { Floor } from './floor.types';
import type { ConstructionType } from './construction.types';
import type { UseType, UseSubType } from './typeOfUse.types';
import type { RoomAPIResponse, RoomData } from './room-details.types';

/* -------------------------------------------------------------------------- */
/*                              FORM DATA TYPES                                */
/* -------------------------------------------------------------------------- */

/**
 * Basic information form data
 */
export interface PropertyBasicInfoFormData {
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

/**
 * Floor QC row data
 */
export interface FloorDataRow {
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
  rentMY: string;
  rateMY: string;
  rentalValue: string;
  depreciation: string;
  alv: string;
  mr: string;
  rv: string;
  sdrr: string;
  baseValue: string;
  floorFactor: string;
  ageFactor: string;
  ntbFactor: string;
  useFactor: string;
  capitalValue: string;
  [key: string]: unknown;
}

/* -------------------------------------------------------------------------- */
/*                             VALIDATION TYPES                                */
/* -------------------------------------------------------------------------- */

/**
 * Basic info form field errors
 */
export interface PropertyBasicInfoErrors {
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

/**
 * Floor QC validation errors
 */
export interface FloorQCValidationError {
  rowIndex: number;
  field: string;
  message: string;
}

/* -------------------------------------------------------------------------- */
/*                              DROPDOWN OPTIONS                               */
/* -------------------------------------------------------------------------- */

/**
 * Generic dropdown option type
 */
export interface DropdownOption {
  value: string;
  label: string;
}

/**
 * Property type option with additional fields
 */
export interface PropertyTypeOption {
  id: number;
  code: string;
  propertyDescription: string;
}

/**
 * Room type option with additional fields
 */
export interface RoomTypeOption {
  id: number;
  code: string;
  name?: string;
  description?: string;
}

/* -------------------------------------------------------------------------- */
/*                              PROPS INTERFACES                               */
/* -------------------------------------------------------------------------- */

/**
 * Props for PropertyDetailsEditForm component
 */
export interface PropertyDetailsEditFormProps {
  propertyData: ApartmentQCDetail;
  floorQCData: ApartmentQCDetail[];
  floors: Floor[];
  constructionTypes: ConstructionType[];
  useTypes: UseType[];
  allSubTypes: UseSubType[];
  propertyTypes: PropertyTypeOption[];
  roomTypes: RoomTypeOption[];
  subTab?: string;
  copy: PropertyEditFormCopy;
}

/**
 * Props for BasicInfoSection component
 */
export interface BasicInfoSectionProps {
  formData: PropertyBasicInfoFormData;
  errors: PropertyBasicInfoErrors;
  propertyTypeOptions: DropdownOption[];
  onFieldChange: (field: keyof PropertyBasicInfoFormData, value: string) => void;
  onFieldBlur: (field: keyof PropertyBasicInfoFormData) => void;
  isOpen: boolean;
  onToggle: () => void;
  copy: BasicInfoSectionCopy;
}

/**
 * Props for FloorQCSection component
 */
export interface FloorQCSectionProps {
  floorData: FloorDataRow[];
  floorOptions: DropdownOption[];
  conTypeOptions: DropdownOption[];
  useTypeOptions: DropdownOption[];
  getSubTypeOptions: (typeOfUseId: string) => DropdownOption[];
  onRowUpdate: (id: string, field: keyof FloorDataRow, value: string) => void;
  onOpenRoomSubmission: (row: FloorDataRow) => void;
  isOpen: boolean;
  onToggle: () => void;
  subTab: string;
  dualMethodTab: 'rateable' | 'capital';
  onDualMethodTabChange: (tab: 'rateable' | 'capital') => void;
  copy: FloorQCSectionCopy;
}

/* -------------------------------------------------------------------------- */
/*                              COPY/I18N TYPES                                */
/* -------------------------------------------------------------------------- */

/**
 * Translation copy for BasicInfoSection
 */
export interface BasicInfoSectionCopy {
  title: string;
  fields: {
    ownerName: { label: string; placeholder: string };
    occupierName: { label: string; placeholder: string };
    renterName: { label: string; placeholder: string };
    propertyDescription: { label: string; placeholder: string };
    bhk: { label: string; placeholder: string };
    mobileNo: { label: string; placeholder: string };
    emailId: { label: string; placeholder: string };
    flatOrShopName: { label: string; placeholder: string };
    wingName: { label: string; placeholder: string };
    flatOrShopNo: { label: string; placeholder: string };
    oldPropertyNo: { label: string; placeholder: string };
    remark: { label: string };
    oldRV: { label: string };
    newRV: { label: string };
    oldTax: { label: string };
    newTax: { label: string };
    oldArea: { label: string };
    newArea: { label: string };
    oldUseType: { label: string };
    oldConstructionType: { label: string };
    oldCSN: { label: string };
    oldConstructionYear: { label: string };
  };
  validation: {
    ownerNameRequired: string;
    occupierNameRequired: string;
    invalidNameFormat: string;
    invalidMobile: string;
    invalidEmail: string;
    flatOrShopNoRequired: string;
    invalidWingFormat: string;
    invalidPropertyNoFormat: string;
  };
}

/**
 * Translation copy for FloorQCSection
 */
export interface FloorQCSectionCopy {
  title: string;
  columns: {
    floor: string;
    conYear: string;
    asstYear: string;
    conType: string;
    use: string;
    subTypeOfUse: string;
    noOfRooms: string;
    area: string;
    rentMY: string;
    rateMY: string;
    rentalValue: string;
    depreciation: string;
    alv: string;
    mr: string;
    rv: string;
    sdrr: string;
    baseValue: string;
    floorFactor: string;
    ageFactor: string;
    ntbFactor: string;
    useFactor: string;
    capitalValue: string;
  };
  tabs: {
    rateable: string;
    capital: string;
  };
  validation: {
    invalidYear: string;
    yearOutOfRange: string;
  };
  tooltips: {
    viewRoomDetails: string;
    noDetailId: string;
  };
}

/**
 * Translation copy for PropertyDetailsEditForm page
 */
export interface PropertyEditFormCopy {
  pageTitle: string;
  badges: {
    ward: string;
    zone: string;
    prop: string;
    type: string;
  };
  buttons: {
    back: string;
    save: string;
    saving: string;
  };
  messages: {
    propertyIdMissing: string;
    validationErrors: string;
    floorQCValidationError: string;
    basicDetailsUpdateFailed: string;
    floorQCUpdateFailed: string;
    allChangesSaved: string;
    basicDetailsUpdated: string;
    roomDataUpdated: string;
    failedToLoadRooms: string;
    cannotOpenRoomSubmission: string;
  };
  basicInfo: BasicInfoSectionCopy;
  floorQC: FloorQCSectionCopy;
}

/* -------------------------------------------------------------------------- */
/*                           ROOM SUBMISSION TYPES                             */
/* -------------------------------------------------------------------------- */

/**
 * Room submission update data
 */
export interface RoomSubmissionUpdateData {
  floorNumber: string;
  rooms: RoomData[];
  totalAreaSqM: number;
  builtUpAreaSqM: number;
  roomCount: number;
}

/**
 * Room submission sidebar state
 */
export interface RoomSubmissionSidebarState {
  isOpen: boolean;
  selectedFloorRow: FloorDataRow | null;
  areaUnit: 'sq.m' | 'sq.ft';
  isLoading: boolean;
  existingRooms: RoomAPIResponse[];
}

/* -------------------------------------------------------------------------- */
/*                              HOOK RETURN TYPES                              */
/* -------------------------------------------------------------------------- */

/**
 * Return type for usePropertyEditFormState hook
 */
export interface PropertyEditFormStateReturn {
  formData: PropertyBasicInfoFormData;
  setFormData: React.Dispatch<React.SetStateAction<PropertyBasicInfoFormData>>;
  floorData: FloorDataRow[];
  setFloorData: React.Dispatch<React.SetStateAction<FloorDataRow[]>>;
  isBasicInfoOpen: boolean;
  setIsBasicInfoOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isFloorQCOpen: boolean;
  setIsFloorQCOpen: React.Dispatch<React.SetStateAction<boolean>>;
  dualMethodTab: 'rateable' | 'capital';
  setDualMethodTab: React.Dispatch<React.SetStateAction<'rateable' | 'capital'>>;
  updateFormField: (field: keyof PropertyBasicInfoFormData, value: string) => void;
  updateFloorRow: (id: string, field: keyof FloorDataRow, value: string) => void;
}

/**
 * Return type for usePropertyEditFormValidation hook
 */
export interface PropertyEditFormValidationReturn {
  errors: PropertyBasicInfoErrors;
  setErrors: React.Dispatch<React.SetStateAction<PropertyBasicInfoErrors>>;
  validateField: (field: string, value: string) => string;
  validateForm: () => boolean;
  validateYear: (year: string) => string;
  validateFloorData: () => FloorQCValidationError[];
  showError: (field: keyof PropertyBasicInfoErrors) => boolean;
  submittedOnce: boolean;
  touched: Partial<Record<keyof PropertyBasicInfoErrors, boolean>>;
  setTouched: React.Dispatch<React.SetStateAction<Partial<Record<keyof PropertyBasicInfoErrors, boolean>>>>;
}

/**
 * Return type for usePropertyEditFormSubmission hook
 */
export interface PropertyEditFormSubmissionReturn {
  handleSave: () => Promise<void>;
  isSaving: boolean;
  isUpdating: boolean;
}

/**
 * Return type for useRoomSubmissionSidebar hook
 */
export interface RoomSubmissionSidebarReturn {
  state: RoomSubmissionSidebarState;
  handleOpen: (row: FloorDataRow) => Promise<void>;
  handleClose: () => void;
  handleUpdate: (data: RoomSubmissionUpdateData) => void;
  handleToggleUnit: () => void;
}
