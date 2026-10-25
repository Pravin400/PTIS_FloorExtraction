import { LucideIcon } from "lucide-react";
import type { AssetDocumentListItem, AssetFloorDetailItem } from "./detail-tabs.types";

export interface AssetFieldValueRequest {
  fieldDefinitionId?: number | null;
  fieldName: string;
  fieldValue?: string | null;
  isActive?: boolean;
  createdBy?: number | null;
  assetId?: number;
}

/** Matches backend CreateAssetMasterDto */
export interface AssetMasterRequest {
  id?: number | null;
  assetId?: number | null;
  organizationId: number;
  assetName: string;
  assetRegionalName?: string | null;
  assetCategoryId: number;
  assetTypeId: number;
  hierarchyLevel: number;
  isActive: boolean;
  assetNo?: string | null;
  departmentId?: number | null;
  parentAssetId?: number | null;
  wardId?: number | null;
  zoneId?: number | null;
  subZoneId?: number | null;
  moujaId?: number | null;
  hierarchyPath?: string | null;
  address?: string | null;
  RegionalAddress?: string | null;
  csn?: string | null;
  constructionYear?: number | null;
  ownershipType?: string | null;
  occupancyStatus?: string | null;
  assetConditionId?: number | null;
  encroachmentStatus?: string | null;
  inChargeName?: string | null;
  inChargeRegionalName?: string | null;
  inChargeDesignationId?: number | null;
  inChargeMobile?: string | null;
  inChargeEmail?: string | null;
  locality?: string | null;
  pinCode?: string | null;
  partitionNo?: string | null;
  upicId?: string | null;
  propertyNo?: string | null;
  plotNo?: string | null;
  assetWardNo?: string | null;
  mpmsNo?: string | null;
  pTaxId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  lengthFt?: number | null;
  lengthMtr?: number | null;
  widthFt?: number | null;
  widthMtr?: number | null;
  landAreaSqFeet?: number | null;
  landAreaSqMeter?: number | null;
  totalLength?: number | null;
  averageWidth?: number | null;
  landRate?: number | null;
  fieldValues?: AssetFieldValueRequest[];
  fieldValuesJson?: string | null;
  photoFiles?: File[] | null;
  photoMetadataJson?: string;
  createdBy?: number;
}

export interface AssetFormDataRequest {
  sectionCode: string;
  sectionName: string;
  formData: string;
  displayOrder: number;
}

export interface AssetMasterResponse extends Partial<AssetMasterRequest> {
  id: number;
  isActive: boolean;
  assetCode?: string;
  name?: string;
  assetName?: string;
  assetNo?: string;
  categoryId?: number;
  assetTypeId?: number;
  upic?: string;
  code?: string;
  items?: AssetMasterResponse | AssetMasterResponse[];
}

export interface AssetFormStepConfig {
  id: number;
  key: "identification" | "basic-info" | "floor-details" | "legal-complience" | "furniture-fixture" | "valuation" | "documents";
  label: string;
  icon: LucideIcon;
  path: string;
}

export interface AssetStepperProps {
  currentStepId: number;
  steps: AssetFormStepConfig[];
}

export interface CategoryFlags {
  isMovable?: boolean;
  hasFloorDetails?: boolean;
  hasInventory?: boolean;
  isInventoryMandatory?: boolean;
  hasLegalCompliance?: boolean;
}

export interface ExtraBasicInfoFileItem {
  file?: File;
  name?: string;
  remarks?: string;
  displayOrder?: number;
  photoTypeId?: number;
}

export interface AssetFormData {
  id?: number;
  assetId?: number;
  category: string;
  categoryId?: number;
  categoryCode?: string;
  valuationType?: string;
  assetType: string;
  typeId?: number;
  assetName: string;
  assetRegionalName?: string;
  assetNameRegional?: string;
  assetCode: string;
  assetNo?: string;
  status?: string;
  department?: string;
  departmentId?: string;
  ownershipType?: string;
  zone?: string;
  zoneId?: string;
  ward?: string;
  wardId?: string;
  mouja?: string;
  moujaId?: string;
  subzone?: string;
  subZoneId?: string;
  propertyNumber?: string;
  surveyNumber?: string;
  partitionNo?: string;
  upicId?: string;
  plotNumber?: string;
  pTaxId?: string;
  condition?: string;
  assetConditionId?: string | number;
  encroachmentStatus?: string;
  length?: string;
  width?: string;
  landArea?: string;
  totalLength?: string | number;
  averageWidth?: string | number;
  landRate?: string | number;
  inChargeName?: string;
  inChargeRegionalName?: string;
  inChargeNameRegional?: string;
  inChargeDesignation?: string;
  inChargeMobile?: string;
  contactNumber?: string;
  inChargeEmail?: string;
  fullAddress?: string;
  fullAddressRegional?: string;
  pinCode?: string;
  locality?: string;
  operationalControl?: string;
  isRented?: string;
  leaseStartDate?: string;
  leaseEndDate?: string;
  leaseAmount?: string;
  securityDeposit?: string;
  paymentFrequency?: string;
  lessorName?: string;
  lessorMobile?: string;
  lessorEmail?: string;
  lessorAddress?: string;
  isMovableCategory?: boolean;
  hasFloorDetails?: boolean;
  hasInventory?: boolean;
  isInventoryMandatory?: boolean;
  hasLegalCompliance?: boolean;
  allowUnitRegistration?: boolean;
  landmark?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  mpmsNo?: string;
  floors?: AssetFloorDetailItem[];
  allowRoomRegistration?: boolean;
  capitalValue?: number | string | null;
  hydrated?: boolean;
  parentBuildingId?: number | null;
  parentAssetId?: number | null;
  attributes: Record<string, string | number | boolean>;
  documents: AssetDocumentListItem[];
}

export interface AssetFormContextType {
  formData: AssetFormData;
  setFormData?: React.Dispatch<React.SetStateAction<AssetFormData>>;
  updateFormData: (data: Partial<AssetFormData>) => void;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handleToggleChange: (name: string, checked: boolean) => void;
  handleAttributeChange: (name: string, value: string | number | boolean) => void;
  errors?: Record<string, string>;
  setErrors?: (errors: Record<string, string>) => void;
  submittedOnce?: boolean;
  setSubmittedOnce?: (submitted: boolean) => void;
  lastSavedFormData?: AssetFormData | null;
  setLastSavedFormData?: (data: AssetFormData) => void;
  onSubmitHook?: (() => Promise<boolean>) | null;
  registerSubmitHook?: (hook: (() => Promise<boolean>) | null) => void;
  stagedFiles?: Record<number, { file: File; definition: AssetDocumentListItem }>;
  setStagedFiles?: React.Dispatch<React.SetStateAction<Record<number, { file: File; definition: AssetDocumentListItem }>>>;
  basicInfoFiles?: { frontPhoto?: File; buildingPlan?: File };
  setBasicInfoFiles?: React.Dispatch<React.SetStateAction<{ frontPhoto?: File; buildingPlan?: File }>>;
  extraBasicInfoFiles?: Record<string, ExtraBasicInfoFileItem[]>;
  setExtraBasicInfoFiles?: React.Dispatch<React.SetStateAction<Record<string, ExtraBasicInfoFileItem[]>>>;
  subunitFiles?: Record<number, { photoFile?: File | null; planFile?: File | null }>;
  setSubunitFiles?: React.Dispatch<React.SetStateAction<Record<number, { photoFile?: File | null; planFile?: File | null }>>>;
  registerStepSave?: (stepKey: string, saveFn: () => Promise<{ success: boolean; error?: string }>) => void;
  unregisterStepSave?: (stepKey: string) => void;
  isDataLoading?: boolean;
  setIsDataLoading?: (loading: boolean) => void;
  fallbackModuleId?: number;
}

export interface AssetWizardStepProps {
  formData: AssetFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onToggleChange?: (name: string, checked: boolean) => void;
}

export type { AssetFloorDetailsRequest } from "./detail-tabs.types";
