export interface GrievanceWorkflowStageMaster {
  id: number;
  ulbTypeId: number;
  ulbTypeName?: string | null;
  stageCode: string;
  stageName: string;
  stageNameLocal?: string | null;
  stageOrder: number;
  status: string;
  description?: string | null;
  isActive: boolean;
  createdDate?: string | null;
  updatedDate?: string | null;
  createdBy?: number | string | null;
  updatedBy?: number | string | null;
  [key: string]: unknown;
}

export interface RawGrievanceWorkflowStageMaster {
  id?: number | null;
  ulbTypeId?: number | null;
  ulbTypeName?: string | null;
  stageCode?: string | null;
  stageName?: string | null;
  stageNameLocal?: string | null;
  stageOrder?: number | null;
  status?: string | null;
  description?: string | null;
  isActive?: boolean | null;
  createdDate?: string | null;
  updatedDate?: string | null;
  createdBy?: number | string | null;
  updatedBy?: number | string | null;
}

export interface GrievanceWorkflowStageMasterFormModel {
  id?: number | null;
  ulbTypeId: number | string;
  stageCode: string;
  stageName: string;
  stageNameLocal?: string;
  stageOrder: number | string;
  status: string;
  description?: string;
  isActive: boolean;
  createdBy?: number | string | null;
  updatedBy?: number | string | null;
}

export interface GrievanceWorkflowStageMasterProps {
  data: GrievanceWorkflowStageMaster[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  sortBy?: string;
  sortOrder?: string;
  searchTerm?: string;
}

export interface GrievanceWorkflowStageMasterFormProps {
  initialData: GrievanceWorkflowStageMaster | null;
}

export const GRIEVANCE_WORKFLOW_STAGE_PAGE_SIZES = [10, 20, 30, 40, 50] as const;
export type GrievanceWorkflowStagePageSize = (typeof GRIEVANCE_WORKFLOW_STAGE_PAGE_SIZES)[number];
