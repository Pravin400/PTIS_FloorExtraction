import type { PagedResponse } from "@/types/common.types";

export interface AssetDocumentDefinition {
  [key: string]: unknown;
  id: number;
  assetCategoryId?: number | null;
  assetTypeId?: number | null;
  assetCategoryName?: string | null;
  assetTypeName?: string | null;
  documentCode: string;
  documentName: string;
  description?: string | null;
  isRequired: boolean;
  displayOrder?: number | null;
  isActive: boolean;
  createdDate?: string | null;
  updatedDate?: string | null;
}

export interface AssetDocumentDefinitionCreateInput {
  assetCategoryId?: number | null;
  assetTypeId?: number | null;
  documentCode: string;
  documentName: string;
  description?: string | null;
  isRequired: boolean;
  displayOrder?: number | null;
  isActive: boolean;
  createdBy?: number;
}

export interface AssetDocumentDefinitionUpdateInput extends AssetDocumentDefinitionCreateInput {
  id: number;
  updatedBy?: number;
}

export interface AssetDocumentDefinitionFormModel {
  id?: number;
  assetCategoryId?: number | null;
  assetTypeId?: number | null;
  documentCode: string;
  documentName: string;
  description: string;
  isRequired: boolean;
  displayOrder: number | string;
  isActive: boolean;
  createdBy?: number;
  updatedBy?: number;
}

export interface AssetDocumentDefinitionProps
  extends Omit<PagedResponse<AssetDocumentDefinition>, "items" | "hasPrevious" | "hasNext"> {
  data: AssetDocumentDefinition[];
  sortBy?: string;
  sortOrder?: string;
}
