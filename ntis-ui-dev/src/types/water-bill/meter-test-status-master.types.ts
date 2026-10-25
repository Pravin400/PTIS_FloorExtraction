export interface MeterTestStatus extends Record<string, unknown> {
  id: number;
  meterTestStatusCode: string;
  code?: string;
  meterTestStatus: string;
  isActive: boolean;
  createdDate?: string | null;
  updatedDate?: string | null;
}

export interface MeterTestStatusFormModel {
  id?: number;
  meterTestStatusCode?: string;
  code: string;
  meterTestStatus: string;
  isActive: boolean;
  createdBy?: number;
  updatedBy?: number;
}

export interface MeterTestStatusProps {
  data: MeterTestStatus[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  sortBy?: string;
  sortOrder?: string;
}
