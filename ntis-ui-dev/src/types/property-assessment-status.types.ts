import type { PagedResponse } from "./common.types";

/** Record from GET /api/PropertyAssessmentStatus */
export interface PropertyAssessmentStatus {
  id: number;
  statusName: string;
  isActive: boolean;
  createdDate: string;
  updatedDate: string | null;
}

export type PropertyAssessmentStatusResponse = PagedResponse<PropertyAssessmentStatus>;

/** Dropdown option for Property Type filter on Search Property. */
export interface PropertyAssessmentStatusOption {
  id: number;
  label: string;
}
