export interface PropertyWorkflowStage {
  id: number;
  stageName: string;
  description: string;
  displayOrder: number;
  isActive: boolean;
  createdDate: string;
  updatedDate: string | null;
}

export interface PropertyWorkflowDetail {
  id?: number;
  propertyId?: number;
  workflowStageId?: number;
  moduleId?: number;
  isActive?: boolean;
  createdBy?: number;
  createdByName?: string;
  currentStatus?: boolean;
  createdDate?: string;
  updatedDate?: string | null;
}


