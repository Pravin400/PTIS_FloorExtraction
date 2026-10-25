import type { Option } from "@/components/common";

export interface NatureFactorCVMaster {
  id: number;
  constructionTypeId: number;
  factor: number;
  yearRangeCVId: number;
  constructionCode?: string;
  constructionDescription?: string;
  fromYear?: number;
  toYear?: number;
  isActive: boolean;
  createdDate?: string;
  updatedDate?: string | null;
  [key: string]: unknown;
}

export interface NatureFactorCVMasterUpdate {
  isActive: boolean;
  updatedBy: number;
  constructionTypeId: number;
  factor: number;
  yearRangeCVId: number;
}

export interface NatureFactorCVMasterCreate {
  isActive: boolean;
  createdBy: number;
  constructionTypeId: number;
  factor: number;
  yearRangeCVId: number;
}

export interface NatureFactorCVMasterQueryParams {
  id?: number;
  constructionTypeId?: number;
  yearRangeCVId?: number;
  isActive?: boolean;
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: string;
  filterLogic?: number;
}

export interface NatureFactorCVBulkCreateItem {
  isActive: boolean;
  createdBy: number;
  constructionTypeId: number;
  factor: number;
  yearRangeCVId: number;
}

// Bulk Create payload is a root-level array
export type BulkNatureFactorCVMasterCreate = NatureFactorCVBulkCreateItem[];

export interface NatureFactorCVBulkUpdateItem {
  id: number;
  data: NatureFactorCVMasterUpdate;
}

// Bulk Update payload is a root-level array
export type BulkNatureFactorCVMasterUpdate = NatureFactorCVBulkUpdateItem[];

// ---------------------------------------------
// Common / Shared Types (Used by Nature Module)
// ---------------------------------------------

// (AssessmentYearCV is shared; use the one from floor-cv-weightageMaster.types.ts)

export interface NatureFactorCVMasterSearchParams {
  page?: string;
  pageSize?: string;
  q?: string;
  selectedYearRange?: string;
  constructionType?: string;
  sortBy?: string;
  sortOrder?: string;
}

export interface NatureFactorCvPageProps {
  searchParams: Promise<NatureFactorCVMasterSearchParams>;
}

export interface NatureFactorCvHeaderExtraProps {
  t: ReturnType<typeof import("next-intl").useTranslations>;
  tW: ReturnType<typeof import("next-intl").useTranslations>;
  assessmentYearOptions: Option[];
  constructionTypeOptions: Option[];
  selectedYear: string;
  constructionType: string;
  factorValue: string;
  setFactorValue: (value: string) => void;
  handleAssessmentYearChange: (value: string) => void;
  handleConstructionTypeChange: (value: string) => void;
  handleGenerateAll: () => void;
  handleApplyFilter: () => void;
  handleClearAll: () => void;
  handleBulkUpdate: () => void;
  hasNewRecords: boolean;
  newRecordsCount: number;
  isGeneratingAll: boolean;
  isBulkUpdating: boolean;
  isUpdating: boolean;
  isApplyDisabled: boolean;
  isBulkUpdateDisabled: boolean;
}

export interface NatureFactorCVMasterProps {
  data: NatureFactorCVMaster[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  assessmentYearOptions: Option[];
  constructionTypeOptions: Option[];
  sortBy?: string;
  sortOrder?: string;
}