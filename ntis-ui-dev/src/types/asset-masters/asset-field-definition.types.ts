import type { PagedResponse } from "@/types/common.types";

export interface AssetFieldDefinition {
  [key: string]: unknown;
  id: number;
  assetCategoryId: number;
  assetTypeId: number;
  assetCategoryName?: string | null;
  assetTypeName?: string | null;
  fieldCode: string;
  fieldName: string;
  fieldLabel: string;
  fieldType: string;
  fieldGroup?: string | null;
  optionsJson?: string | null;
  isRequired: boolean;
  displayOrder: number;
  isActive: boolean;
  createdDate?: string | null;
  updatedDate?: string | null;
}

export interface AssetFieldDefinitionCreateInput {
  assetCategoryId: number;
  assetTypeId: number;
  fieldCode: string;
  fieldName: string;
  fieldLabel: string;
  fieldType: string;
  fieldGroup?: string | null;
  optionsJson?: string | null;
  isRequired: boolean;
  displayOrder: number;
  isActive: boolean;
  createdBy?: number;
}

export interface AssetFieldDefinitionUpdateInput extends AssetFieldDefinitionCreateInput {
  id: number;
  updatedBy?: number;
}

export interface AssetFieldDefinitionFormModel {
  id?: number;
  assetCategoryId: number;
  assetTypeId: number;
  fieldCode: string;
  fieldName: string;
  fieldLabel: string;
  fieldType: string;
  fieldGroup: string;
  optionsJson?: string;
  isRequired: boolean;
  displayOrder: number | string;
  isActive: boolean;
  createdBy?: number;
  updatedBy?: number;
}

export interface AssetFieldDefinitionProps
  extends Omit<PagedResponse<AssetFieldDefinition>, "items" | "hasPrevious" | "hasNext"> {
  data: AssetFieldDefinition[];
  sortBy?: string;
  sortOrder?: string;
}
