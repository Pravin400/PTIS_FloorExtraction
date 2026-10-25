import type React from "react";
import type {
  BuildingBasicInfoFormData,
  BuildingBasicInfoFormErrors,
  FormFieldChangeEvent,
} from "./buildBasicInfo.types";
import type { Ward, SubZone, Designation } from "./master-data.types";
import type { AssetFloorDetailItem } from "./detail-tabs.types";
import type { AssetFormData, ExtraBasicInfoFileItem } from "./asset-wizard.types";
import type { ParentSubunitLookupItem } from "./basic-info-actions.types";
import type { ProcessedField } from "./asset-field-renderer.types";
import type { RawDbAsset } from "./asset-mapping.types";
import type { FloorCvRollup } from "./new-add-new-asset-page.types";

export type { ParentSubunitLookupItem };

export interface UseCascadingUrlParamOptions {
  /** Preserve scroll position on navigation. Default false. */
  scroll?: boolean;
  /** Use router.replace (default) instead of router.push. */
  replaceHistory?: boolean;
  /** Called whenever the in-flight state changes — wire to a footer/nav lock if desired. */
  onPendingChange?: (isPending: boolean) => void;
}

export interface FloorSummary {
  totalFloors: number;
  totalUnits: number;
  totalCarpetSqm: number;
  totalBuiltupSqm: number;
  capitalValue: number;
}

export interface CascadeState {
  wards: Ward[];
  subzones: SubZone[];
  designations: Designation[];
  isLoadingWards: boolean;
  isLoadingSubzones: boolean;
  isLoadingDesignations: boolean;
}

export interface UseNABuildingBasicInfoFormReturn {
  formData: BuildingBasicInfoFormData;
  errors: BuildingBasicInfoFormErrors;
  touched: Partial<Record<keyof BuildingBasicInfoFormData, boolean>>;
  isValid: boolean;
  handleChange: (e: FormFieldChangeEvent) => void;
  handleBlur: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleAttributeChange: (name: string, value: string | number | boolean) => void;
  handleSubmitStep: () => boolean;
  showError: (field: keyof BuildingBasicInfoFormData) => boolean;
  updateFormData: (patch: Partial<BuildingBasicInfoFormData>) => void;
}

export interface UseNADynamicFieldsReturn {
  fields: ProcessedField[];
  loading: boolean;
  error: string | null;
}

export interface UseNACascadeDropdownsProps {
  initialLookups?: {
    wards?: Ward[];
    subzones?: SubZone[];
    designations?: Designation[];
  };
  baseHandleChange: (e: FormFieldChangeEvent) => void;
  updateFormData: (patch: Partial<BuildingBasicInfoFormData>) => void;
}

export interface RawExistingAssetItem {
  id: number;
  assetNo?: string;
  assetCode?: string;
  assetName?: string;
  assetCategoryName?: string;
  assetTypeName?: string;
  address?: string;
  zoneName?: string | null;
  wardName?: string | null;
  assetCategoryId?: number | null;
  assetTypeId?: number | null;
}

export interface UseAssetFormHandlersProps {
  setFormData: React.Dispatch<React.SetStateAction<AssetFormData>>;
}

export interface UseNAInitialDataLoadersParams {
  orchestrator: UseNAFormOrchestratorReturn;
  currentStep: number;
  setCvRollup?: (cv: FloorCvRollup | number | null) => void;
}

export interface UseNASaveActionsParams {
  formData: BuildingBasicInfoFormData;
  basicInfoFiles: { frontPhoto?: File; buildingPlan?: File } | null | undefined;
  extraBasicInfoFiles: Record<string, (File | ExtraBasicInfoFileItem)[]> | null | undefined;
  setContextSubmittedOnce?: (val: boolean) => void;
  setContextErrors?: (errors: Record<string, string>) => void;
  contextUpdateFormData: (updates: Partial<AssetFormData>) => void;
  setLastSavedFormData?: (data: AssetFormData) => void;
}

export interface HydratorInitialData extends Partial<AssetFormData> {
  dbAsset?: RawDbAsset | null;
  hydrated?: boolean;
}

export interface UseNAFormOrchestratorReturn {
  formData: BuildingBasicInfoFormData;
  errors: BuildingBasicInfoFormErrors;
  showError: (field: keyof BuildingBasicInfoFormData) => boolean;
  handleChange: (e: FormFieldChangeEvent) => void;
  handleBlur: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleAttributeChange: (name: string, value: string | number | boolean) => void;
  updateFormData: (patch: Partial<BuildingBasicInfoFormData>) => void;

  dynamicFields: ProcessedField[];
  isDynamicLoading: boolean;

  cascade: CascadeState;

  floors: AssetFloorDetailItem[];
  summary: FloorSummary;

  assetId: number;
  categoryId: number;
  typeId: number;
  categoryStr: string;
  assetTypeStr: string;

  isSubmitting: boolean;
  handleSaveAndNext: (onSuccess: () => void) => Promise<void>;
  handleSaveAsDraft: () => Promise<void>;
  updateContextFormData: (data: Partial<AssetFormData>) => void;
}

export interface ParentAssetRecord {
  id: number;
  assetName?: string;
  assetNo?: string;
  assetCode?: string;
  assetCategoryName?: string;
  categoryName?: string;
  assetRegionalName?: string;
  ownershipType?: string;
  zoneId?: number | string;
  wardId?: number | string;
  subZoneId?: number | string;
  moujaId?: number | string;
  address?: string;
  locality?: string;
  pinCode?: string;
  latitude?: number | string;
  longitude?: number | string;
  departmentId?: number | string;
  csn?: string;
  propertyNo?: string;
  propertyNumber?: string;
  partitionNo?: string;
  upicId?: string;
  plotNo?: string;
  assetConditionId?: number | string;
  inChargeName?: string;
  inChargeRegionalName?: string;
  inChargeDesignationId?: number | string;
  inChargeMobile?: string;
  inChargeEmail?: string;
  isRented?: boolean;
  details?: {
    zoneId?: number | string;
    wardId?: number | string;
    subZoneId?: number | string;
    moujaId?: number | string;
    address?: string;
    locality?: string;
    nearestLandmark?: string;
    pinCode?: string;
    latitude?: number | string;
    longitude?: number | string;
    csn?: string;
    CSN?: string;
    propertyNo?: string;
    partitionNo?: string;
    upicId?: string;
    plotNo?: string;
    inChargeName?: string;
    inChargeRegionalName?: string;
    inChargeDesignationId?: number | string;
    inChargeMobile?: string;
    inChargeEmail?: string;
    isRented?: boolean;
  };
}
