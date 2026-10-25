import { PagedResponse } from "../common.types";

export interface AssetGrievanceRemarkCategoryOption {
  id: number;
  grievanceTypeName: string;
}

export interface AssetGrievanceRemarkFormModel {
  id?: number;
  grievanceCategoryId: number;
  remark: string;
  description: string;
  isActive: boolean;
}

export interface AssetGrievanceRemark {
  [key: string]: unknown;
  id: number;
  grievanceCategoryId: number;
  grievanceCategoryName: string | null;
  remark: string;
  description: string | null;
  isActive: boolean;
  markedForDeletion: boolean;
  createdDate: string;
  updatedDate: string | null;
}

export interface AssetGrievanceRemarkProps extends Omit<PagedResponse<AssetGrievanceRemark>, "items" | "hasPrevious" | "hasNext"> {
  data: AssetGrievanceRemark[];
  sortBy?: string;
  sortOrder?: string;
}
