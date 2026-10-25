import type {
  GrievanceTrackingDetailsDto,
  GrievanceTimelineItemDto,
  TrackingTicket,
  TrackingStatus,
  ActivityLogItem,
} from '@/types/grievance/tracking.types';
import type { Grievance, TimelineEvent } from '@/types/grievance/grievance.types';
import {
  mapBackendStatusToTrackingStatus,
  mapTrackingStatusToGrievanceStatus,
  formatDate,
  buildTrackingSteps,
} from './track-timeline-mapper';

export {
  mapBackendStatusToTrackingStatus,
  mapTrackingStatusToGrievanceStatus,
  formatDate,
  buildTrackingSteps,
};

/**
 * Normalizes backend raw object or ApiResponse item to GrievanceTrackingDetailsDto
 */
export function normalizeTrackingDetailsDto(raw: unknown): GrievanceTrackingDetailsDto | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = (
    'data' in (raw as Record<string, unknown>)
      ? (raw as Record<string, unknown>).data
      : 'items' in (raw as Record<string, unknown>)
      ? (raw as Record<string, unknown>).items
      : raw
  ) as Record<string, unknown>;

  if (!r || (!r.grievanceNo && !r.GrievanceNo && !r.id && !r.Id)) {
    return null;
  }

  const rawTimeline = Array.isArray(r.timeline ?? r.Timeline) ? (r.timeline ?? r.Timeline) : [];
  const timeline: GrievanceTimelineItemDto[] = (rawTimeline as Record<string, unknown>[]).map(
    (t, idx) => ({
      activityLogId: Number(t.activityLogId ?? t.ActivityLogId ?? idx + 1),
      fromState: (t.fromState ?? t.FromState) as string | null,
      toState: String(t.toState ?? t.ToState ?? ''),
      actionBy: (t.actionBy ?? t.ActionBy) as string | null,
      assignedTo: (t.assignedTo ?? t.AssignedTo) as string | null,
      assignedToMobileNo: (t.assignedToMobileNo ?? t.AssignedToMobileNo ?? t.mobileNo ?? t.MobileNo) as string | null,
      assignedToDesignation: (t.assignedToDesignation ?? t.AssignedToDesignation ?? t.designation ?? t.Designation) as string | null,
      remark: (t.remark ?? t.Remark) as string | null,
      actionAt: String(t.actionAt ?? t.ActionAt ?? new Date().toISOString()),
      forwardedToDepartment: (t.forwardedToDepartment ?? t.ForwardedToDepartment) as string | null,
      forwardingStatus: (t.forwardingStatus ?? t.ForwardingStatus) as string | null,
      isCurrentStep: Boolean(t.isCurrentStep ?? t.IsCurrentStep ?? false),
    })
  );

  return {
    id: Number(r.id ?? r.Id ?? 0),
    grievanceNo: String(r.grievanceNo ?? r.GrievanceNo ?? ''),
    citizenId: Number(r.citizenId ?? r.CitizenId ?? 0),
    citizenName: (r.citizenName ?? r.CitizenName) as string | null,
    maskedMobileNo: (r.maskedMobileNo ?? r.MaskedMobileNo) as string | null,
    grievanceDepartmentId: Number(r.grievanceDepartmentId ?? r.GrievanceDepartmentId ?? 0),
    departmentName: (r.departmentName ?? r.DepartmentName) as string | null,
    grievanceTypeId: Number(r.grievanceTypeId ?? r.GrievanceTypeId ?? 0),
    grievanceType: (r.grievanceType ?? r.GrievanceType) as string | null,
    roadLandmark: (r.roadLandmark ?? r.RoadLandmark) as string | null,
    latitude: (r.latitude ?? r.Latitude) as string | null,
    longitude: (r.longitude ?? r.Longitude) as string | null,
    description: (r.description ?? r.Description) as string | null,
    currentStateId: Number(r.currentStateId ?? r.CurrentStateId ?? 1),
    currentStateName: (r.currentStateName ?? r.CurrentStateName) as string | null,
    currentAssignedToUserName: (r.currentAssignedToUserName ?? r.CurrentAssignedToUserName) as string | null,
    assignedOfficerMobileNo: (r.assignedOfficerMobileNo ?? r.AssignedOfficerMobileNo ?? r.officerMobileNo ?? r.OfficerMobileNo ?? r.assignedOfficerPhone ?? r.AssignedOfficerPhone ?? r.officerPhone ?? r.OfficerPhone) as string | null,
    assignedOfficerDesignation: (r.assignedOfficerDesignation ?? r.AssignedOfficerDesignation ?? r.officerDesignation ?? r.OfficerDesignation) as string | null,
    assignedOfficerRating: (r.assignedOfficerRating ?? r.AssignedOfficerRating ?? null) as string | null,
    submittedDate: String(r.submittedDate ?? r.SubmittedDate ?? new Date().toISOString()),
    resolvedDate: (r.resolvedDate ?? r.ResolvedDate) as string | null,
    closedDate: (r.closedDate ?? r.ClosedDate) as string | null,
    progressPercentage: Number(r.progressPercentage ?? r.ProgressPercentage ?? 0),
    daysOpen: Number(r.daysOpen ?? r.DaysOpen ?? 0),
    isResolved: Boolean(r.isResolved ?? r.IsResolved ?? false),
    isClosed: Boolean(r.isClosed ?? r.IsClosed ?? false),
    timeline,
    wardId: r.wardId != null || r.WardId != null ? Number(r.wardId ?? r.WardId) : null,
    wardNo: (r.wardNo ?? r.WardNo) as string | null,
    wardName: (r.wardName ?? r.WardName) as string | null,
    zoneId: r.zoneId != null || r.ZoneId != null ? Number(r.zoneId ?? r.ZoneId) : null,
    zoneNo: (r.zoneNo ?? r.ZoneNo) as string | null,
    zoneName: (r.zoneName ?? r.ZoneName) as string | null,
  };
}

/**
 * Converts GrievanceTrackingDetailsDto into frontend TrackingTicket.
 */
export function toTrackingTicket(dto: GrievanceTrackingDetailsDto): TrackingTicket {
  const status = mapBackendStatusToTrackingStatus(dto.currentStateName, dto.isResolved, dto.isClosed);
  const steps = buildTrackingSteps(dto, status);

  const activityLogs: ActivityLogItem[] = dto.timeline.map((item, idx) => ({
    id: String(item.activityLogId || idx + 1),
    timestamp: formatDate(item.actionAt),
    actionEn: item.toState ? `${item.toState}${item.remark ? `: ${item.remark}` : ''}` : (item.remark || 'Status Update'),
    actionMr: '',
    actor: item.actionBy || item.assignedTo || 'Municipal Desk',
    desk: item.forwardedToDepartment || dto.departmentName || 'AMC Grievance Cell',
    statusBadge: item.toState || undefined,
  }));

  return {
    id: String(dto.id),
    token: dto.grievanceNo,
    subject: dto.grievanceType || dto.description || 'Civic Grievance',
    subjectMr: '',
    department: dto.departmentName || 'Municipal Administration',
    departmentMr: '',
    ward: dto.wardName || (dto.wardNo ? `Ward ${dto.wardNo}` : dto.roadLandmark || ''),
    wardMr: '',
    zone: dto.zoneName || dto.zoneNo || undefined,
    wardName: dto.wardName || undefined,
    wardNo: dto.wardNo || undefined,
    zoneName: dto.zoneName || undefined,
    zoneNo: dto.zoneNo || undefined,
    wardId: dto.wardId || undefined,
    zoneId: dto.zoneId || undefined,
    status,
    reportedDate: formatDate(dto.submittedDate),
    slaHoursLeft: 0,
    slaTotalHours: 0,
    slaDeadline: '',
    activeDeskEn: dto.departmentName || 'General Grievance Cell',
    activeDeskMr: '',
    activeOfficerName: dto.currentAssignedToUserName || '',
    activeOfficerTitle: dto.assignedOfficerDesignation || '',
    activeOfficerPhone: dto.assignedOfficerMobileNo || undefined,
    activeOfficerDesignation: dto.assignedOfficerDesignation || undefined,
    activeOfficerRating: dto.assignedOfficerRating || undefined,
    activeOfficerDepartment: dto.departmentName || undefined,
    steps,
    activityLogs,
    description: dto.description || '',
    roadLandmark: dto.roadLandmark || '',
    currentStateId: dto.currentStateId,
    currentStateName: dto.currentStateName || undefined,
    timeline: dto.timeline,
    departmentId: dto.grievanceDepartmentId || undefined,
    grievanceTypeId: dto.grievanceTypeId || undefined,
    citizenName: dto.citizenName || undefined,
    citizenMobile: dto.maskedMobileNo || undefined,
    latitude: dto.latitude || undefined,
    longitude: dto.longitude || undefined,
  };
}

/**
 * Converts GrievanceTrackingDetailsDto into frontend Grievance entity.
 */
export function toGrievanceDomain(dto: GrievanceTrackingDetailsDto): Grievance {
  const trackingStatus = mapBackendStatusToTrackingStatus(dto.currentStateName, dto.isResolved, dto.isClosed);
  const grievanceStatus = mapTrackingStatusToGrievanceStatus(trackingStatus);

  const timeline: TimelineEvent[] = dto.timeline.map((item) => ({
    status: grievanceStatus,
    timestamp: item.actionAt,
    title: item.toState || 'Status Update',
    titleMr: '',
    note: item.remark || (item.actionBy ? `Action taken by ${item.actionBy}` : ''),
    noteMr: '',
    performedBy: item.actionBy || item.assignedTo || 'Official',
  }));

  return {
    id: String(dto.id),
    trackingId: dto.grievanceNo,
    title: dto.grievanceType || 'Civic Grievance',
    titleMr: '',
    description: dto.description || '',
    descriptionMr: '',
    category: 'other',
    subCategory: dto.grievanceType || undefined,
    status: grievanceStatus,
    priority: 'MEDIUM',
    ward: dto.wardName || (dto.wardNo ? `Ward ${dto.wardNo}` : dto.roadLandmark || ''),
    wardNumber: dto.wardId || 0,
    zone: dto.zoneName || dto.zoneNo || '',
    address: dto.roadLandmark || '',
    landmark: dto.roadLandmark || '',
    lat: dto.latitude != null && !isNaN(Number(dto.latitude)) ? Number(dto.latitude) : 0,
    lng: dto.longitude != null && !isNaN(Number(dto.longitude)) ? Number(dto.longitude) : 0,
    reportedAt: dto.submittedDate,
    updatedAt: dto.resolvedDate || dto.closedDate || dto.submittedDate,
    slaHours: 48,
    slaDeadline: new Date(new Date(dto.submittedDate).getTime() + 48 * 3600 * 1000).toISOString(),
    slaStatus: 'ON_TRACK',
    reporter: {
      name: dto.citizenName?.trim() || '',
      phoneMasked: dto.maskedMobileNo || '******0000',
      citizenId: String(dto.citizenId),
    },
    assignedOfficer: dto.currentAssignedToUserName
      ? {
          name: dto.currentAssignedToUserName,
          nameMr: '',
          department: dto.departmentName || 'AMC',
          departmentMr: '',
          designation: 'Assigned Officer',
          designationMr: '',
        }
      : undefined,
    timeline,
    images: [],
    upvotesCount: 0,
  };
}

/**
 * Transforms a GrievanceApplication list item from the database into a TrackingTicket card.
 */
export function toTrackingTicketFromListItem(item: {
  id: number;
  grievanceNo: string;
  description?: string | null;
  roadLandmark?: string | null;
  departmentName?: string | null;
  grievanceType?: string | null;
  currentStateId: number;
  submittedDate: string;
}): TrackingTicket {
  const isResolved = item.currentStateId === 4;
  const isClosed = item.currentStateId === 5;
  const isRejected = item.currentStateId === 6;
  const isInProgress = item.currentStateId === 3;
  const isPending = item.currentStateId === 1 || item.currentStateId === 2;

  const status: TrackingStatus = isResolved
    ? 'RESOLVED'
    : isClosed
    ? 'CLOSED'
    : isRejected
    ? 'REJECTED'
    : isInProgress
    ? 'IN_PROGRESS'
    : 'PENDING';

  const subject = item.grievanceType || (item.description ? item.description.slice(0, 45) : 'Civic Grievance');
  const department = item.departmentName || 'Municipal Corporation';

  return {
    id: String(item.id),
    token: item.grievanceNo,
    subject,
    subjectMr: '',
    department,
    departmentMr: '',
    ward: item.roadLandmark || 'Central Ward',
    wardMr: '',
    status,
    reportedDate: formatDate(item.submittedDate),
    slaHoursLeft: 48,
    slaTotalHours: 48,
    slaDeadline: 'Within 48 Hours',
    activeDeskEn: `${department} Triage Desk`,
    activeDeskMr: '',
    activeOfficerName: '',
    activeOfficerTitle: '',
    steps: [
      {
        stepNumber: 1,
        titleEn: '1. Grievance Submitted & Registered',
        titleMr: '',
        subtitleEn: `Logged successfully (${item.grievanceNo})`,
        subtitleMr: '',
        badgeTextEn: 'Done',
        badgeTextMr: '',
        state: 'done',
      },
      {
        stepNumber: 2,
        titleEn: '2. Field Officer Assignment & In Progress',
        titleMr: '',
        subtitleEn: isInProgress ? 'Work in progress' : isPending ? 'Awaiting officer assignment' : 'Assigned',
        subtitleMr: '',
        badgeTextEn: isInProgress ? 'In Progress' : 'Pending',
        badgeTextMr: '',
        state: isInProgress || isResolved || isClosed ? 'done' : isPending ? 'in_progress' : 'pending',
      },
      {
        stepNumber: 3,
        titleEn: '3. Work Resolution & Verification',
        titleMr: '',
        subtitleEn: isResolved || isClosed ? 'Resolution completed' : 'Pending resolution',
        subtitleMr: '',
        badgeTextEn: isResolved || isClosed ? 'Resolved' : 'Pending',
        badgeTextMr: '',
        state: isResolved || isClosed ? 'done' : 'pending',
      },
    ],
    activityLogs: [
      {
        id: `log-${item.id}-1`,
        timestamp: formatDate(item.submittedDate),
        actionEn: 'Grievance Submitted',
        actionMr: '',
        actor: 'Citizen',
        desk: `${department} Registration Desk`,
        statusBadge: status,
      },
    ],
    description: item.description || '',
    roadLandmark: item.roadLandmark || '',
    currentStateId: item.currentStateId,
  };
}
