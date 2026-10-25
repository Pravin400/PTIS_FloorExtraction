import type { Option } from "@/components/common";
import { PagedResponse } from "@/types/common.types";

export interface FloorFactorCVMaster {
  id: number;
  floorId: number;
  factorWithLift: number;
  factorWithoutLift: number;
  yearRangeCVId: number;   // used in payloads
  yearRangeCVID?: number;  // returned by API (uppercase D alias)
  floorCode?: string;
  floorDescription?: string;
  fromYear?: number;
  toYear?: number;
  isActive: boolean;
  createdDate?: string;
  updatedDate?: string | null;
  [key: string]: unknown;
}

export interface FloorFactorCVMasterUpdate {
  isActive: boolean;
  updatedBy: number;
  floorId: number;
  factorWithLift: number;
  factorWithoutLift: number;
  yearRangeCVId: number;
}

export type FloorFactorCVMasterUpdateAction = Omit<FloorFactorCVMasterUpdate, 'updatedBy'>;

export interface FloorFactorCVMasterCreate {
  isActive: boolean;
  createdBy: number;
  floorId: number;
  factorWithLift: number;
  factorWithoutLift: number;
  yearRangeCVId: number;
}

export type FloorFactorCVMasterCreateAction = Omit<FloorFactorCVMasterCreate, 'createdBy'>;

export interface FloorFactorCVBulkCreateItem {
  isActive: boolean;
  createdBy: number;
  floorId: number;
  factorWithLift: number;
  factorWithoutLift: number;
  yearRangeCVId: number;
}

export interface FloorFactorCVBulkUpdateItem {
  id: number;
  data: FloorFactorCVMasterUpdate;
}

export interface FloorFactorCVBulkUpdateActionItem {
  id: number;
  data: FloorFactorCVMasterUpdateAction;
}

export type BulkFloorFactorCVMasterCreate = FloorFactorCVBulkCreateItem[];
export type BulkFloorFactorCVMasterCreateAction = FloorFactorCVMasterCreateAction[];

export type BulkFloorFactorCVMasterUpdate = FloorFactorCVBulkUpdateItem[];
export type BulkFloorFactorCVMasterUpdateAction = FloorFactorCVBulkUpdateActionItem[];
//dependency master service types
export interface AssessmentYearCV {
  id: number;
  fromYear: number;
  toYear: number;
  isActive: boolean;
  createdDate: string;
  updatedDate: string | null;
  yearRangeCVId?: number;
  yearId?: number;
  [key: string]: unknown;
}

export interface AssessmentYearPagedResponseCV {
  items: AssessmentYearCV[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPrevious?: boolean;
  hasNext?: boolean;
}

export interface Floor {
  id: number;
  floorCode: string;
  description: string;
  sequenceNo: number;
  createdDate: string;
  updatedDate: string | null;
  isActive: boolean;
  [key: string]: unknown;
}
export interface FloorCvHeaderExtraProps {
    // Translations
    t: ReturnType<typeof import("next-intl").useTranslations>;
    tW: ReturnType<typeof import("next-intl").useTranslations>;
    // Options
    assessmentYearOptions: Option[];
    floorOptions: Option[];
    liftStatusOptions: Option[];
    // Filter state
    selectedYear: string;
    fromFloor: string;
    toFloor: string;
    liftStatus: string;
    factorValue: string;
    // Derived flags
    isApplyDisabled: boolean;
    isBulkUpdateDisabled: boolean;
    isGeneratingAll: boolean;
    isBulkUpdating: boolean;
    isUpdating: boolean;
    hasNewRecords: boolean;
    newRecordsCount: number;
    // Handlers
    handleAssessmentYearChange: (value: string) => void;
    setFromFloor: (value: string) => void;
    setToFloor: (value: string) => void;
    setLiftStatus: (value: string) => void;
    setFactorValue: (value: string) => void;
    handleApplyFilter: () => void;
    handleClearAll: () => void;
    handleBulkUpdate: () => void;
    handleGenerateAll: () => void;
    addToast: (type: "success" | "error" | "info" | "warning", message: string) => void;
}
export interface FloorCvWeightageMasterProps {
    data: FloorFactorCVMaster[];
    pageNumber: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    floorOptions: Option[]; // Already added floorOptions prop
    assessmentYearOptions: Option[]; // Added assessmentYearOptions prop
    sortBy?: string;
    sortOrder?: string;
}
export interface ColumnConfig {
  t: (key: string) => string;
  tW: (key: string) => string;
  tCommon: (key: string) => string;
  editableRows: Record<string, FloorFactorCVMaster>;
  handleCellChange: (rowId: string, columnId: string, value: string | number) => void;
  getRowUid: (row: FloorFactorCVMaster) => string;
  sortBy?: string;
  sortOrder?: string;
  onSort?: (columnKey: string) => void;
}
export interface WeightageMasterHeaderProps {
  locale: string;
  title: string;
  subtitle: string;
  labels: {
    floor: string;
    nature: string;
    subType: string;
    age: string;
  };
}

export type FloorPagedResponse = PagedResponse<Floor>;