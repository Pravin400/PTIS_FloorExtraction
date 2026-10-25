import { ApiResponse, PagedResponse } from './common.types';

export interface SocialAttributeFormModel {
  id?: number;
  socialAttributeCode: string;
  socialAttributeName: string;
  dataType: string;
  unit: string;
  displayOrder: number | null;
  parentAttributeId: number | null;
  isRequiredWhenParentTrue: boolean;
  isDiscountApplicable: boolean;
  isPhotoRequired: boolean;
  isDocumentRequired: boolean;
  isActive: boolean;
  isCommonAreaAttribute?: boolean;
  createdBy?: number;
  updatedBy?: number;
}

export interface SocialAttribute {
  [key: string]: unknown;
  id: number;
  socialAttributeCode: string;
  socialAttributeName: string;
  dataType: string;
  unit: string | null;
  displayOrder: number | null;
  parentAttributeId: number | null;
  isRequiredWhenParentTrue: boolean;
  isDiscountApplicable: boolean;
  isPhotoRequired: boolean;
  isDocumentRequired: boolean;
  isActive: boolean;
  isCommonAreaAttribute?: boolean;
  createdDate: string;
  updatedDate: string | null;
}

export interface SocialAttributeCreatePayload {
  socialAttributeCode: string;
  socialAttributeName: string;
  dataType: string;
  unit: string | null;
  displayOrder: number | null;
  parentAttributeId: number | null;
  isRequiredWhenParentTrue: boolean;
  isDiscountApplicable: boolean;
  isPhotoRequired: boolean;
  isDocumentRequired: boolean;
  isActive: boolean;
  isCommonAreaAttribute?: boolean;
  createdBy?: number;
  createdDate?: string;
}

export interface SocialAttributeProps extends Omit<
  PagedResponse<SocialAttribute>,
  'items' | 'hasPrevious' | 'hasNext'
> {
  data: SocialAttribute[];
  sortBy?: string;
  sortOrder?: string;
}

export type PaginatedApiResponse<T> = ApiResponse<PagedResponse<T>>;
