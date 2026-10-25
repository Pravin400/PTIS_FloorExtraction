import type React from 'react';

export type ConditionCategoryType = 'Asset' | 'Inventory';
export type ConditionType = ConditionCategoryType;

/** Backend Entity returned by GET list & GET by ID */
export interface InventoryCondition {
  [key: string]: unknown;
  id: number;
  conditionCategory: ConditionCategoryType;
  categoryId: number;
  categoryName?: string;
  conditionName: string;
  description?: string | null;
  conditionFactor: number;
  displayOrder: number;
  isActive: boolean;
  createdDate?: string;
  updatedDate?: string | null;
  markedForDeletion?: boolean | number;
  // Deprecated UI alias for backwards compatibility
  inventoryItemCategoryId?: number;
  conditionType?: ConditionCategoryType;
}

/** Standardized Category Lookup Entity */
export interface InventoryConditionCategory {
  id: number;
  categoryName: string;
}

/** Explicit Alias for Asset Category Lookup to maintain readability */
export type AssetConditionCategory = InventoryConditionCategory;

/** UI Form State Model */
export interface InventoryConditionFormModel {
  id?: number | null;
  conditionCategory: ConditionCategoryType | '';
  categoryId: number;
  conditionName: string;
  description?: string;
  conditionFactor: number | string;
  displayOrder: number | string;
  isActive: boolean;
  updatedBy?: number;
  // Deprecated aliases for backwards compatibility
  inventoryItemCategoryId?: number;
  conditionType?: ConditionCategoryType | '';
}

/** Clean Request Payload for POST */
export interface CreateInventoryConditionDto {
  conditionCategory: ConditionCategoryType;
  categoryId: number;
  conditionName: string;
  description: string | null;
  conditionFactor: number;
  displayOrder: number;
  isActive: boolean;
  createdBy: number;
}

/** Clean Request Payload for PUT */
export interface UpdateInventoryConditionDto {
  conditionCategory: ConditionCategoryType;
  categoryId: number;
  conditionName: string;
  description: string | null;
  conditionFactor: number;
  displayOrder: number;
  isActive: boolean;
  updatedBy: number;
}

/** Query Parameters for List Endpoint */
export interface InventoryConditionListParams {
  PageNumber?: number;
  PageSize?: number;
  SearchTerm?: string;
  SortBy?: string;
  SortOrder?: 'asc' | 'desc';
  MarkedForDeletion?: boolean;
  IsActive?: boolean | string;
  // Legacy aliases
  ConditionName?: string;
  InventoryItemCategoryId?: number;
}

/** Server Action Paginated Result */
export interface InventoryConditionPagedResult {
  items: InventoryCondition[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

/** Backend Generic Mutation Response */
export interface BackendMutationResponse<T> {
  success: boolean;
  message: string;
  items?: T;
  totalCount?: number | null;
  errors?: unknown;
  correlationId?: string | null;
}

/** Master Table Props */
export interface InventoryConditionMasterProps {
  data: InventoryCondition[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  assetCategories?: AssetConditionCategory[];
  inventoryCategories?: InventoryConditionCategory[];
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/** Legacy alias for backwards compatibility */
export type InventoryConditionProps = InventoryConditionMasterProps & {
  categories?: InventoryConditionCategory[];
};

export interface InventoryConditionMasterErrorContextType {
  hasError: boolean;
  setHasError: (value: boolean) => void;
}

export interface InventoryConditionFormFieldsSectionProps {
  formData: InventoryConditionFormModel;
  errors: Record<string, string>;
  showError: (field: string) => boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSelectChange: (name: string, value: string) => void;
  t: (key: string) => string;
  categoryOptions: { label: string; value: string }[];
  conditionTypeOptions?: { label: string; value: string }[];
  isLoadingCategories?: boolean;
  nameRef?: React.RefObject<HTMLInputElement | null>;
}

export interface InventoryConditionFormProps {
  id?: number | string;
  initialData?: InventoryConditionFormModel | null;
  assetCategories?: AssetConditionCategory[];
  inventoryCategories?: InventoryConditionCategory[];
}
