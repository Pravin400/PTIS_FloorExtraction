import type { ProcessedField, MergedFieldSection } from "./asset-field-renderer.types";
import type { AssetMasterResponse } from "./asset-wizard.types";
import type { BuildingBasicInfoFormData } from "./buildBasicInfo.types";

export type { ProcessedField, MergedFieldSection };

export interface FetchFieldDefinitionsResult {
  success: true;
  data: ProcessedField[];
  sections: MergedFieldSection[];
}

export interface FetchFieldDefinitionsError {
  success: false;
  data?: ProcessedField[];
  sections?: MergedFieldSection[];
  error: string;
}

export type FetchFieldDefinitionsResponse =
  | FetchFieldDefinitionsResult
  | FetchFieldDefinitionsError;

export interface ParentAssetLookupItem {
  id: number;
  assetName: string;
  assetNo: string;
}

export interface ParentSubunitLookupItem {
  id?: number | string;
  assetId?: number | string;
  assetName?: string;
  name?: string;
  assetNo?: string;
  subunitName?: string;
  code?: string;
}

export interface LookupActionResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export interface SubmitAssetFormResult {
  success: boolean;
  assetId?: number;
  assetCode?: string;
  error?: string;
  message?: string;
  data?: AssetMasterResponse;
}

export interface InitialWizardData {
  categoryId: number;
  typeId: number;
  assetType: string;
  category: string;
  categoryCode?: string;
  valuationType?: string;
  isMovableCategory?: boolean;
  hasFloorDetails?: boolean;
  hasInventory?: boolean;
  isInventoryMandatory?: boolean;
  hasLegalCompliance?: boolean;
  allowUnitRegistration?: boolean;
  allowRoomRegistration?: boolean;
  hydrated: boolean;
  dbAsset?: AssetMasterResponse | null;
}

export interface BasicInfoPageParams {
  categoryId: number;
  typeId: number;
  assetId: number;
  categoryStr: string;
  assetTypeStr: string;
  zoneIdParam: string | null;
  moujaIdParam: string | null;
  departmentIdParam: string | null;
  typeOfUseIdParam: number | null;
  parentAssetIdParam: number | null;
  isLandCategory: boolean;
}

export interface ErrorWithDigest {
  digest?: string;
  message?: string;
}

export interface GenericLookupEnvelope<T> {
  items?: T[];
  Items?: T[];
  data?: T[];
}

export interface ActivatableItem {
  isActive?: boolean | number | null;
  IsActive?: boolean | number | null;
  status?: string | null;
}

export interface RawConditionMasterItem {
  id: number;
  categoryId?: number;
  CategoryId?: number;
  conditionName?: string;
  ConditionName?: string;
  description?: string | null;
  Description?: string | null;
  conditionFactor?: number | string | null;
  ConditionFactor?: number | string | null;
  displayOrder?: number | null;
  DisplayOrder?: number | null;
  isActive?: boolean;
  IsActive?: boolean;
}

export interface FormDataLike {
  append: (name: string, value: string | Blob, fileName?: string) => void;
  entries: () => IterableIterator<[string, FormDataEntryValue]>;
}

export interface ApiErrorResponseShape {
  message?: string;
  detail?: string;
  title?: string;
  error?: string;
  errors?: Record<string, string[] | string>;
}

export interface ValidationRule {
  required?: boolean;
  requiredMessage?: string;
  pattern?: RegExp;
  patternMessage?: string;
  minLength?: number;
  minLengthMessage?: string;
  maxLength?: number;
  maxLengthMessage?: string;
  custom?: (value: string | number | boolean | null | undefined, formData: BuildingBasicInfoFormData) => string | undefined;
}

export type ValidationSchema<T> = {
  [K in keyof T]?: ValidationRule;
};

export interface DropdownOption {
  label: string;
  value: string;
}
