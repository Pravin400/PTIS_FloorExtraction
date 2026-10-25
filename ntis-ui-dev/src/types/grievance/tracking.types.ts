/**
 * Citizen Grievance Tracking Type Contracts
 * Central Symmetrical Layer: src/types/grievance/tracking.types.ts
 */

export type TrackingStatus = 'SUBMITTED' | 'PENDING' | 'IN_PROGRESS' | 'AWAITING_REVIEW' | 'RESOLVED' | 'CLOSED' | 'REOPENED' | 'REJECTED';

export type StepState = 'done' | 'in_progress' | 'pending';

export interface TrackingOfficer {
  id: string;
  name: string;
  designation: string;
  department: string;
  wardOrZone: string;
  phone?: string;
  avatarUrl?: string;
  rating?: string;
  onTimePercent?: string;
  solvedCount?: number;
  remarks?: string;
}

export type TrackingAssignedOfficer = TrackingOfficer;
export type AssignedOfficer = TrackingOfficer;

export interface ResolutionProof {
  beforeImageUrl: string;
  afterImageUrl: string;
  completedAt: string;
  workSummary: string;
  verifiedByOfficer?: string;
}

export interface CitizenFeedback {
  state: 'unsubmitted' | 'satisfied' | 'reopened';
  comment?: string;
  rating?: number;
  submittedAt?: string;
}

export interface ActivityLogItem {
  id: string;
  timestamp: string;
  actionEn: string;
  actionMr: string;
  actor: string;
  desk: string;
  statusBadge?: string;
}

export interface TrackingStep {
  stepNumber: 1 | 2 | 3;
  titleEn: string;
  titleMr: string;
  subtitleEn: string;
  subtitleMr: string;
  badgeTextEn: string;
  badgeTextMr: string;
  state: StepState;
  officer?: TrackingOfficer;
  proof?: ResolutionProof;
}

export interface TrackingTicket {
  id: string;
  token: string; // e.g. "GRV61194619"
  subject: string;
  subjectMr?: string;
  department: string;
  departmentMr?: string;
  ward: string;
  wardMr?: string;
  zone?: string;
  wardName?: string;
  wardNo?: string;
  zoneName?: string;
  zoneNo?: string;
  status: TrackingStatus;
  reportedDate: string;
  slaHoursLeft: number;
  slaTotalHours: number;
  slaDeadline: string;
  activeDeskMr: string;
  activeDeskEn: string;
  activeOfficerName: string;
  activeOfficerTitle: string;
  activeOfficerPhone?: string;
  activeOfficerDesignation?: string;
  activeOfficerRating?: string;
  activeOfficerDepartment?: string;
  steps: TrackingStep[];
  proof?: ResolutionProof;
  images?: string[];
  feedback?: CitizenFeedback;
  activityLogs: ActivityLogItem[];
  description?: string;
  roadLandmark?: string;
  currentStateId?: number;
  currentStateName?: string;
  timeline?: GrievanceTimelineItemDto[];
  departmentId?: number;
  grievanceTypeId?: number;
  citizenName?: string;
  citizenMobile?: string;
  latitude?: string;
  longitude?: string;
  zoneId?: number;
  wardId?: number;
}

/**
 * Backend C# DTO contracts for Grievance Tracking API
 * Route: GET /api/GrievanceApplication/track/{grievanceNo}?mobileNo={mobileNo}
 */
export interface GrievanceTimelineItemDto {
  activityLogId: number;
  fromState?: string | null;
  toState: string;
  actionBy?: string | null;
  assignedTo?: string | null;
  assignedToMobileNo?: string | null;
  assignedToDesignation?: string | null;
  remark?: string | null;
  actionAt: string;
  forwardedToDepartment?: string | null;
  forwardingStatus?: string | null;
  isCurrentStep: boolean;
}

export interface GrievanceTrackingDetailsDto {
  id: number;
  grievanceNo: string;
  citizenId: number;
  citizenName?: string | null;
  maskedMobileNo?: string | null;
  grievanceDepartmentId: number;
  departmentName?: string | null;
  grievanceTypeId: number;
  grievanceType?: string | null;
  roadLandmark?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  description?: string | null;
  currentStateId: number;
  currentStateName?: string | null;
  currentAssignedToUserName?: string | null;
  assignedOfficerMobileNo?: string | null;
  assignedOfficerDesignation?: string | null;
  assignedOfficerRating?: string | null;
  submittedDate: string;
  resolvedDate?: string | null;
  closedDate?: string | null;
  progressPercentage: number;
  daysOpen: number;
  isResolved: boolean;
  isClosed: boolean;
  timeline: GrievanceTimelineItemDto[];
  zoneId?: number | null;
  wardId?: number | null;
  wardNo?: string | null;
  wardName?: string | null;
  zoneNo?: string | null;
  zoneName?: string | null;
}

export interface UpdateGrievancePayload {
  departmentId?: number;
  grievanceTypeId?: number;
  roadLandmark?: string;
  description?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  zoneId?: number | null;
  wardId?: number | null;
  updatedBy?: number | null;
}

export interface GrievanceKpiMetrics {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
}

