
import type { MatrixColumn, MatrixRow } from "@/components/common/MatrixGrid";

export interface DepreciationConstructionType {
  constructionId: number;
  constructionCode: string;
}

export interface DepreciationRow {
  id: number;
  constructionTypeId: number;
  minYear: number;
  maxYear: number;
  rate: number;
  yearRangeRVId: number;
  isActive: boolean;
  createdDate: string;
  updatedDate: string | null;
}

// Paginated response for depreciation records
export interface DepreciationPagedResponse {
  items: DepreciationRow[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// UI types for depreciation master components
export type RangeRow = {
  id: string;
  min: number;
  max: number;
  label: string;
};

// Component props types for depreciation master
export type DepreciationMasterProps = {
  data: DepreciationRow[];
  constructionTypes: DepreciationConstructionType[];
  allRanges?: RangeRow[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  locale?: string;
};

export type LeftPanelProps = {
  minValue: string;
  maxValue: string;
  minError: string | null;
  maxError: string | null;
  ranges: RangeRow[];
  selectedRangeId: string | null;
  saving: boolean;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
  onAddRange: () => void;
  onSelectRange: (id: string) => void;
  onDeleteRange: () => void;
  t: (key: string, values?: Record<string, string | number | Date>) => string;
  values?: Record<string, string | number | Date>;
};

export type RightPanelProps = {
  matrixColumns: MatrixColumn[];
  matrixRows: MatrixRow[];
  saving: boolean;
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  editableColumnIds: string[];
  onCellChange: (rowId: string, columnId: string, value: string | number) => void;
  onUpdateRates: () => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  t: (key: string, values?: Record<string, string | number | Date>) => string;
  values?: Record<string, string | number | Date>;
};