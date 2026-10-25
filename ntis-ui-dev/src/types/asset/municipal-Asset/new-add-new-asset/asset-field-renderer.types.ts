import type React from "react";
import type { BuildingBasicInfoFormData } from "./buildBasicInfo.types";

export interface ProcessedField {
  id: number;
  fieldName: string;
  fieldCode?: string;
  fieldLabel: string;
  fieldType: string;
  fieldGroup: string;
  isRequired: boolean;
  options?: string[];
}

export interface AssetFieldDefinition {
  id: number;
  fieldName: string;
  fieldCode?: string;
  name?: string;
  fieldType: string;
  type?: string;
  isRequired: boolean;
  required?: boolean;
  options?: string[];
  optionsJson?: string;
  fieldLabel?: string;
  label?: string;
  displayName?: string;
  fieldGroup?: string;
  assetCategoryId?: number;
  assetTypeId?: number;
  fieldDefinitionId?: number;
  Id?: number;
  FieldName?: string;
  FieldCode?: string;
  Name?: string;
  FieldType?: string;
  Type?: string;
  IsRequired?: boolean;
  Required?: boolean;
  Options?: string[];
  OptionsJson?: string;
  FieldLabel?: string;
  Label?: string;
  DisplayName?: string;
  FieldGroup?: string;
  AssetCategoryId?: number;
  AssetTypeId?: number;
  FieldDefinitionId?: number;
}

export interface PagedAssetFieldDefinitionResponse {
  items?: AssetFieldDefinition[];
  Items?: AssetFieldDefinition[];
  data?: AssetFieldDefinition[];
  Data?: AssetFieldDefinition[];
  totalCount?: number;
  pageNumber?: number;
  pageSize?: number;
}

export interface MergedFieldSection {
  title: string;
  fields: ProcessedField[];
}

export interface NADynamicFieldsProps {
  fields?: ProcessedField[];
  loading?: boolean;
  formData?: BuildingBasicInfoFormData | Record<string, unknown>;
  onAttributeChange?: (name: string, value: string | number | boolean) => void;
}

export type FieldOptionSource =
  | string
  | number
  | boolean
  | { label?: string | number; value?: string | number; name?: string; text?: string; Name?: string; Value?: string };

export interface NAFieldProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  error?: string;
  fullWidth?: boolean;
  className?: string;
}
