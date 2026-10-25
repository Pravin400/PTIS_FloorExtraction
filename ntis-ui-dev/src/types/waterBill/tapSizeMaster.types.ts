import type { PagedResponse } from "../common.types";
export type { PagedResponse };

export interface TapSize {
  [key: string]: unknown;
  id: number;
  tapSizeCode: string;
  tapSize: string;
  nominalSizeValue?: number | null;
  sizeUnit?: string | null;
  isActive: boolean;
  createdBy?: number | null;
  createdDate?: string | null;
  updatedBy?: number | null;
  updatedDate?: string | null;
}

export interface TapSizeFormModel {
  id?: number;
  tapSizeCode?: string;
  tapSize: string;
  nominalSizeValue?: number | string | null;
  sizeUnit?: string | null;
  isActive: boolean;
}

export interface TapSizeMasterProps {
  data: PagedResponse<TapSize>;
}
