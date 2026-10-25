import { LucideIcon } from "lucide-react";

export * from "./asset-master-request.types";

export interface AssetFormStepConfig {
  id: number;
  key: "identification" | "basic-info" | "floor-details" | "legal-compliance" | "furniture-fixture" | "valuation" | "documents";
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

export interface AssetFormData {
  category: string;
  categoryCode?: string;
  // DB-driven valuation type: BUILDING | LAND | INFRASTRUCTURE | MOVABLE | GENERIC
  // Set from AssetCategoryMaster.ValuationType — never derive from string matching
  valuationType?: string;
  assetType: string;
  assetName: string;
  assetCode: string;
  isMovableCategory?: boolean;
  hasFloorDetails?: boolean;
  hasInventory?: boolean;
  isInventoryMandatory?: boolean;
  hasLegalCompliance?: boolean;
  allowUnitRegistration?: boolean;
  allowRoomRegistration?: boolean;
  attributes: Record<string, unknown>;
  documents: Record<string, unknown>[];
  [key: string]: unknown;
}

export interface AssetFormContextType {
  formData: AssetFormData;
  setFormData?: React.Dispatch<React.SetStateAction<AssetFormData>>;
  updateFormData: (data: Partial<AssetFormData>) => void;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handleToggleChange: (name: string, checked: boolean) => void;
  handleAttributeChange: (name: string, value: unknown) => void;
  errors?: Record<string, string>;
  setErrors?: (errors: Record<string, string>) => void;
  submittedOnce?: boolean;
  setSubmittedOnce?: (submitted: boolean) => void;
  lastSavedFormData?: AssetFormData | null;
  setLastSavedFormData?: (data: AssetFormData) => void;
  onSubmitHook?: (() => Promise<boolean>) | null;
  registerSubmitHook?: (hook: (() => Promise<boolean>) | null) => void;
  stagedFiles?: Record<number, { file: File; definition: Record<string, unknown> }>;
  setStagedFiles?: React.Dispatch<React.SetStateAction<Record<number, { file: File; definition: Record<string, unknown> }>>>;
  basicInfoFiles?: { frontPhoto?: File; buildingPlan?: File };
  setBasicInfoFiles?: React.Dispatch<React.SetStateAction<{ frontPhoto?: File; buildingPlan?: File }>>;
  extraBasicInfoFiles?: Record<string, unknown[]>;
  setExtraBasicInfoFiles?: React.Dispatch<React.SetStateAction<Record<string, unknown[]>>>;
  subunitFiles?: Record<number, { photoFile?: File | null; planFile?: File | null }>;
  setSubunitFiles?: React.Dispatch<React.SetStateAction<Record<number, { photoFile?: File | null; planFile?: File | null }>>>;
  registerStepSave?: (stepKey: string, saveFn: () => Promise<{ success: boolean; error?: string }>) => void;
  unregisterStepSave?: (stepKey: string) => void;
  isDataLoading?: boolean;
  setIsDataLoading?: (loading: boolean) => void;
  /** Server-fetched fallback module ID (Asset Management), seeded once at the
   * wizard layout so useAssetModuleId/useFurnitureFixtureModuleId don't need
   * their own client-side fetch for the common case. */
  fallbackModuleId?: number;
}

export interface AssetWizardStepProps {
  formData: AssetFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onToggleChange?: (name: string, checked: boolean) => void;
}

export interface AssetFieldValueRequest {
  fieldDefinitionId?: number | null;
  fieldName: string;
  fieldValue?: string | null;
  isActive?: boolean;
  createdBy?: number | null;
  assetId?: number;
}

export interface AssetFloorDetailsRequest {
  floorId: number;
  subFloorId?: number | null;
  constructionYear?: string;
  assessmentYear?: string;
  constructionTypeId: number;
  typeOfUseId: number;
  subTypeOfUseId?: number | null;
  carpetAreaSqMeter?: number;
  carpetAreaSqFeet?: number;
  builtUpAreaSqMeter?: number;
  builtUpAreaSqFeet?: number;
  noOfRooms?: number;
  isRented?: boolean | null;
  rentMonthly?: number | null;
  rentYearly?: number | null;
  nonCalculateRentMonthly?: number | null;
  renterNameEnglish?: string | null;
  renterNameLocal?: string | null;
  agreementFromDate?: string | null;
  agreementDate?: string | null;
  agreementToDate?: string | null;
  taxLiability?: string | null;
  isTaxable?: boolean | null;
  occupancyDate?: string | null;
  occupancyApplied?: boolean | null;
  occupancyNumber?: string | null;
  capitalValue?: number | null;
  marketValue?: number | null;
  lastCvCalculationDate?: string | null;
  cvBaseRate?: number | null;
  cvAgeFactor?: number | null;
  cvFloorFactor?: number | null;
  cvNatureFactor?: number | null;
  cvUseFactor?: number | null;
  cvCalculationFormula?: string | null;
  isActive: boolean;
}
