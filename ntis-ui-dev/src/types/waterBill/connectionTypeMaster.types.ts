import type { PagedResponse } from "../common.types";
export type { PagedResponse };

export interface ConnectionType {
  [key: string]: unknown;
  id: number;
  connectionTypeCode: string;
  connectionType: string;
  description?: string | null;
  isActive: boolean;
  createdBy?: number | null;
  createdDate?: string | null;
  updatedBy?: number | null;
  updatedDate?: string | null;
}

export interface ConnectionTypeFormModel {
  id?: number;
  connectionTypeCode?: string;
  connectionType: string;
  description: string;
  isActive: boolean;
}

export interface ConnectionTypeMasterProps {
  data: PagedResponse<ConnectionType>;
}
