import type React from 'react';
import type { MasterDataGroup, MasterDataRecord } from "./master-data.types";

export interface InventoryModelItem {
  id: number;
  inventoryItemNameId: number;
  inventoryItemName?: string;
  modelName: string;
  displayOrder: number;
  description: string | null;
  isActive: boolean;
  createdDate: string;
  updatedDate: string | null;
  markedForDeletion?: boolean | number;
}

export interface InventoryModelListResponse {
  items: InventoryModelItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface InventoryItemNameItem {
  id: number;
  inventoryItemCategoryId: number;
  subTypeCode: string;
  subTypeName: string;
  displayOrder: number;
  description: string | null;
  isActive: boolean;
  createdDate: string;
  updatedDate: string | null;
  markedForDeletion?: boolean | number;
}

export interface InventoryItemNameListResponse {
  items: InventoryItemNameItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface InventoryModelListParams {
  InventoryItemNameId?: number;
  ModelName?: string;
  PageNumber?: number;
  PageSize?: number;
  SearchTerm?: string;
  MarkedForDeletion?: boolean;
  IsActive?: boolean | string;
  SortBy?: string;
  SortOrder?: 'asc' | 'desc';
}

export interface InventoryItemNameListParams {
  InventoryItemCategoryId?: number;
  SubTypeName?: string;
  PageNumber?: number;
  PageSize?: number;
  SearchTerm?: string;
  MarkedForDeletion?: boolean;
  IsActive?: boolean | string;
  SortBy?: string;
  SortOrder?: 'asc' | 'desc';
}

export interface InventoryModelPayload {
  inventoryItemNameId: number;
  modelName: string;
  description?: string;
  displayOrder?: number;
  isActive?: boolean;
  createdBy?: number;
  updatedBy?: number;
}

export interface InventoryItemNamePayload {
  inventoryItemCategoryId: number;
  subTypeCode: string;
  subTypeName: string;
  description?: string;
  displayOrder?: number;
  isActive?: boolean;
  createdBy?: number;
  updatedBy?: number;
}

export interface InventoryConditionItem {
  id: number;
  inventoryItemCategoryId: number;
  conditionName: string;
  conditionFactor: number;
  displayOrder?: number;
  description: string | null;
  isActive: boolean;
  createdDate: string;
  updatedDate: string | null;
  markedForDeletion?: boolean | number;
  conditionType?: string;
}

export interface InventoryConditionListResponse {
  items: InventoryConditionItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface InventoryConditionListParams {
  InventoryItemCategoryId?: number;
  ConditionName?: string;
  PageNumber?: number;
  PageSize?: number;
  SearchTerm?: string;
  MarkedForDeletion?: boolean;
  IsActive?: boolean | string;
  SortBy?: string;
  SortOrder?: 'asc' | 'desc';
}

export interface InventoryConditionPayload {
  inventoryItemCategoryId: number;
  conditionName: string;
  conditionFactor: number;
  description?: string;
  displayOrder?: number;
  isActive?: boolean;
  createdBy?: number;
  updatedBy?: number;
  conditionType?: string;
}

export interface InventoryModelFormModel {
  id?: string;
  name: string;
  group: string;
  description: string;
  displayOrder?: number | string;
  isActive: boolean;
}

export interface FormFieldsSectionProps {
  formData: InventoryModelFormModel;
  errors: Record<string, string>;
  showError: (field: string) => boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSelectChange: (name: string, value: string) => void;
  t: (key: string) => string;
  categoryOptions: { label: string; value: string }[];
}

export interface InventoryModelMasterErrorContextType {
  hasError: boolean;
  setHasError: (value: boolean) => void;
}

export interface InventoryModelFormProps {
  initialData: InventoryModelFormModel | null;
  groups: MasterDataGroup[];
}

export interface InventoryModelMasterProps {
  data: MasterDataRecord[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  search?: string;
}

export interface InventoryModelMasterLayoutContentProps {
  children: React.ReactNode;
}

export interface MandatoryFieldsNoticeProps {
  message: string;
}

export interface StatusToggleCardProps {
  isActive: boolean;
  onToggle: () => void;
  activeLabel: string;
  inactiveLabel: string;
  statusLabel: string;
}
