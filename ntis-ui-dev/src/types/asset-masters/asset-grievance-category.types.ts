import { PagedResponse } from "../common.types";

export const ALLOWED_SORT_COLUMNS = [
  "grievanceTypeCode",
  "grievanceTypeName",
  "grievanceTypeNameLocal",
  "targetTableName",
  "slaDays",
  "displaySequence",
  "isActive",
] as const;

export type AllowedSortColumn = (typeof ALLOWED_SORT_COLUMNS)[number];

export interface AssetGrievanceCategoryFormModel {
  id?: number;
  grievanceTypeCode: string;
  grievanceTypeName: string;
  grievanceTypeNameLocal: string;
  description: string;
  targetTableName: string;
  slaDays: number | null;
  codeFormat: string;
  displaySequence: number;
  isActive: boolean;
}

export interface AssetGrievanceCategory {
  [key: string]: unknown;
  id: number;
  grievanceTypeCode: string;
  grievanceTypeName: string;
  grievanceTypeNameLocal?: string | null;
  description: string | null;
  targetTableName?: string | null;
  slaDays: number | null;
  codeFormat: string;
  displaySequence: number;
  isActive: boolean;
  markedForDeletion: boolean;
  markedForDeletionDate?: string | null;
  createdDate: string;
  updatedDate: string | null;
}

export interface AssetGrievanceCategoryProps extends Omit<PagedResponse<AssetGrievanceCategory>, "items" | "hasPrevious" | "hasNext"> {
  data: AssetGrievanceCategory[];
  sortBy?: string;
  sortOrder?: string;
}
