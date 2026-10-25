import { PagedResponse } from './common.types';

export interface FinancialYear {
  id: number;
  year: number;
  yearCode: string | null;
  isActive: boolean;
  status: string | null;
  startDate: string | null;
  endDate: string | null;
  description: string | null;
  createdBy?: number | null;
  createdDate?: string | null;
  updatedBy?: number | null;
  updatedDate?: string | null;
}

export interface FinancialYearPayload {
  isActive: boolean;
  year: number;
  yearCode: string | null;
  status: string | null;
  startDate: string;
  endDate: string;
  description: string | null;
  createdBy?: number | null;
  createdDate?: string | null;
  updatedBy?: number | null;
  updatedDate?: string | null;
}

export type FinancialYearPagedResponse = PagedResponse<FinancialYear>;

export interface FinancialYearStats {
  total: number;
  active: number;
  closed: number;
}

export interface FinancialYearFormValues {
  yearCode: string;
  year: number;
  startDate: string;
  endDate: string;
  description: string;
  isActive: boolean;
  isCurrent: boolean;
}
