export interface MeterType extends Record<string, unknown> {
  id: number;
  meterTypeCode: string;
  code?: string;
  meterType: string;
  description?: string | null;
  isActive: boolean;
  createdDate?: string | null;
  updatedDate?: string | null;
}

export interface MeterTypeFormModel {
  id?: number;
  meterTypeCode?: string;
  code: string;
  meterType: string;
  description?: string;
  isActive: boolean;
  createdBy?: number;
  updatedBy?: number;
}

export interface MeterTypeProps {
  data: MeterType[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  sortBy?: string;
  sortOrder?: string;
}
