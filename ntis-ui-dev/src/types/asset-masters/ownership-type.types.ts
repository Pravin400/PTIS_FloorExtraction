import type React from 'react';
export type OwnershipType = {
  [key: string]: unknown;
  id: number;
  ownershipTypeName: string;
  description: string;
  isActive: boolean;
};

export type OwnershipTypeFormModel = {
  id?: number | null;
  ownershipTypeName: string;
  description: string;
  isActive: boolean;
  updatedBy?: number;
}

export interface OwnershipTypeProps {
  data: OwnershipType[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface OwnershipTypeMasterErrorContextType {
  hasError: boolean;
  setHasError: (value: boolean) => void;
}

export interface OwnershipTypeFormFieldsSectionProps {
  nameRef?: React.RefObject<HTMLInputElement | null>;
  formData: OwnershipTypeFormModel;
  errors: Record<string, string>;
  showError: (field: string) => boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  t: (key: string) => string;
}

export interface MandatoryFieldsNoticeProps {
  message: string;
}

export interface StatusToggleCardProps {
  isActive: boolean;
  onToggle: (checked: boolean) => void;
  activeLabel: string;
  inactiveLabel: string;
  statusLabel: string;
}

