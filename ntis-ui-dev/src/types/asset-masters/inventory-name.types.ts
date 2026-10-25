import type React from 'react';
export type InventoryName = {
  [key: string]: unknown;
  id: number;
  inventoryItemCategoryId: number;
  subTypeCode: string;
  subTypeName: string;
  displayOrder?: number;
  description: string | null;
  isActive: boolean;
  createdDate?: string;
  updatedDate?: string | null;
  markedForDeletion?: boolean | number;
};

export type InventoryNameFormModel = {
  id?: number | null;
  inventoryItemCategoryId: number;
  subTypeCode: string;
  subTypeName: string;
  description: string;
  displayOrder?: number | string;
  isActive: boolean;
  updatedBy?: number;
}

export interface InventoryNameCategory {
  id: number;
  categoryName: string;
}

export interface InventoryNameProps {
  data: InventoryName[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  categories: InventoryNameCategory[];
}

export interface InventoryNameMasterErrorContextType {
  hasError: boolean;
  setHasError: (value: boolean) => void;
}

export interface InventoryNameFormFieldsSectionProps {
  formData: InventoryNameFormModel;
  errors: Record<string, string>;
  showError: (field: string) => boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSelectChange: (name: string, value: string) => void;
  t: (key: string) => string;
  categoryOptions: { label: string; value: string }[];
}

export interface InventoryNameFormProps {
  id?: number;
  initialData?: InventoryNameFormModel | null;
  categories?: InventoryNameCategory[];
}
