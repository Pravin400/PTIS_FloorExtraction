/**
 * Public Dashboard Types & Contracts
 * Path: src/types/grievance/public-dashboard.types.ts
 *
 * Domain contracts for the citizen / public grievance dashboard metrics,
 * department breakdown, and live civic resolution rates.
 * Endpoint: GET /api/grievance/public-dashboard
 */

export interface PublicDashboardSummary {
  totalReceived: number;
  totalResolved: number;
  inProgress: number;
  pendingWithinTime: number;
  pendingOverdue: number;
  resolutionRate: number;
  avgResolutionDays: number;
}

export interface PublicDashboardDepartment {
  departmentId: number;
  departmentName: string;
  totalReceived: number;
  totalResolved: number;
  inProgress: number;
  pending: number;
  resolutionRate: number;
}

export interface PublicDashboardResponse {
  summary: PublicDashboardSummary;
  departments?: PublicDashboardDepartment[];
}

export interface PublicGrievancePhoto {
  id: number;
  grievanceApplicationId: number;
  photoTypeId: number;
  photoTypeName: string;
  photoTypeCode: 'Before' | 'After' | 'RESOLUTION_PROOF' | 'CLOSE_UP' | 'INSPECTION_DOC' | string;
  documentBindingId?: number;
  isLatest?: boolean;
  remarks?: string;
  fileName: string;
  originalFileName?: string;
  fileExtension?: string;
  mimeType?: string;
  viewPhotoUrl: string;
}

export interface PublicGrievanceTimelineStep {
  activityLogId: number;
  fromState?: string | null;
  toState?: string | null;
  actionByUserId?: number | null;
  actionBy?: string;
  assignedToUserId?: number | null;
  assignedTo?: string | null;
  remark?: string;
  actionAt: string;
  forwardedToDeptId?: number | null;
  forwardedToDepartment?: string | null;
  forwardingStatus?: string | null;
  isCurrentStep?: boolean;
}

export interface PublicGrievanceApplication {
  id: number;
  grievanceNo: string;
  citizenId?: number;
  citizenName: string;
  maskedMobileNo?: string;
  grievanceDepartmentId: number;
  departmentName: string;
  departmentNameLocal?: string;
  grievanceTypeId: number;
  grievanceType: string;
  roadLandmark?: string;
  latitude?: number | null;
  longitude?: number | null;
  description: string;
  workflowId?: number;
  workflowName?: string;
  currentStateId: number;
  currentStateName: string;
  currentAssignedToUserName?: string | null;
  wardId?: number;
  wardNo?: string;
  wardName?: string;
  zoneId?: number;
  zoneNo?: string;
  zoneName?: string;
  submittedDate: string;
  resolvedDate?: string | null;
  closedDate?: string | null;
  progressPercentage?: number;
  daysOpen?: number;
  isResolved?: boolean;
  isClosed?: boolean;
  isEscalated?: boolean;
  photos: PublicGrievancePhoto[];
  timeline: PublicGrievanceTimelineStep[];
}

