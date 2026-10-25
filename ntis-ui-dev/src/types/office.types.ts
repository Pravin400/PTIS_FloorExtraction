import { PagedResponse } from './common.types';

/**
 * Form model for creating and editing offices
 * Used in UI forms to capture user input
 */
export interface OfficeFormModel {
  [key: string]: unknown;
  officeId?: number;
  officeCode: string;
  officeName: string;
  type: string;
  address: string;
  city: string;
  pincode: string;
  phone: string;
  emailId: string;
  establishedDate?: string | null;
  isActive: boolean;
  updatedBy?: number;
}

/**
 * Server response model for office data
 */
export interface Office {
  [key: string]: unknown;
  officeId: number;
  officeCode: string;
  officeName: string;
  type: string;
  address: string;
  city: string;
  pincode: string;
  phone: string;
  emailId: string;
  establishedDate: string | null;
  isActive: boolean;
  createdDate: string;
  updatedDate: string | null;
}

/**
 * Props for Office list component
 */
export interface OfficeProps extends Omit<
  PagedResponse<Office>,
  'items' | 'hasPrevious' | 'hasNext'
> {
  data: Office[];
  sortBy?: string;
  sortOrder?: string;
  type?: string;
  status?: string;
  headOfficesCount: number;
  activeOfficesCount: number;
  inactiveOfficesCount: number;
  showStatsError?: boolean;
  fetchError?: string;
  statusCode?: number;
}
