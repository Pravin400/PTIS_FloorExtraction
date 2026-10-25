import type { PagedResponse } from "./common.types";

/** Record from GET /api/PropertyWorkflowStageMaster */
export interface PropertyWorkflowStageMaster {
  id: number;
  stageName: string;
  description: string;
  displayOrder: number;
  isActive: boolean;
  createdDate: string;
  updatedDate: string | null;
}

export type PropertyWorkflowStageMasterResponse = PagedResponse<PropertyWorkflowStageMaster>;

/** Dropdown option for Workflow Stage (Type Filter) on Search Property. */
export interface PropertyWorkflowStageOption {
  id: number;
  stageName: string;
  description: string;
}
