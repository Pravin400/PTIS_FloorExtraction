import type {
  GrievanceTrackingDetailsDto,
  TrackingStatus,
  TrackingStep,
} from '@/types/grievance/tracking.types';
import type { GrievanceStatus } from '@/types/grievance/grievance.types';

/**
 * Maps backend CurrentStateName / status flags to UI TrackingStatus enum
 */
export function mapBackendStatusToTrackingStatus(
  stateName?: string | null,
  isResolved = false,
  isClosed = false
): TrackingStatus {
  if (isClosed) return 'CLOSED';
  if (isResolved) return 'RESOLVED';

  const normalized = (stateName || '').toLowerCase().trim();
  if (normalized.includes('resolve')) return 'RESOLVED';
  if (normalized.includes('close')) return 'CLOSED';
  if (normalized.includes('progress') || normalized.includes('action')) return 'IN_PROGRESS';
  if (normalized.includes('assign') || normalized.includes('forward')) return 'PENDING';
  if (normalized.includes('review') || normalized.includes('inspect')) return 'AWAITING_REVIEW';
  if (normalized.includes('reopen')) return 'REOPENED';
  return 'SUBMITTED';
}

/**
 * Maps TrackingStatus to general GrievanceStatus
 */
export function mapTrackingStatusToGrievanceStatus(status: TrackingStatus): GrievanceStatus {
  switch (status) {
    case 'RESOLVED':
    case 'CLOSED':
      return 'RESOLVED';
    case 'IN_PROGRESS':
    case 'AWAITING_REVIEW':
      return 'IN_PROGRESS';
    case 'PENDING':
      return 'ASSIGNED';
    default:
      return 'SUBMITTED';
  }
}

/**
 * Format ISO datetime string to user-friendly date format
 */
export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Builds 3-step timeline steps based on DTO state.
 * Localization is delegated to UI components / i18n dictionaries.
 */
export function buildTrackingSteps(
  dto: GrievanceTrackingDetailsDto,
  status: TrackingStatus
): TrackingStep[] {
  const isDone = status === 'RESOLVED' || status === 'CLOSED';
  const isInProgress = status === 'IN_PROGRESS' || status === 'AWAITING_REVIEW';
  const isAssigned = status === 'PENDING' || isInProgress || isDone;

  const officerName = dto.currentAssignedToUserName || 'Ward Officer';

  return [
    {
      stepNumber: 1,
      titleEn: 'Grievance Registered',
      titleMr: '',
      subtitleEn: `Logged successfully via Citizen Portal (${dto.grievanceNo})`,
      subtitleMr: '',
      badgeTextEn: 'Step Complete',
      badgeTextMr: '',
      state: 'done',
    },
    {
      stepNumber: 2,
      titleEn: isAssigned ? 'Assigned & In Resolution' : 'Pending Assignment',
      titleMr: '',
      subtitleEn: dto.currentAssignedToUserName
        ? `Assigned to ${officerName} (${dto.departmentName || 'Department'})`
        : 'Assigned to Ward In-Charge for field inspection',
      subtitleMr: '',
      badgeTextEn: isDone ? 'Resolved' : isInProgress ? 'In Progress' : 'Queued',
      badgeTextMr: '',
      state: isDone ? 'done' : isAssigned ? 'in_progress' : 'pending',
      officer: {
        id: String(dto.currentStateId),
        name: officerName,
        designation: dto.assignedOfficerDesignation || (dto.departmentName ? `${dto.departmentName} Officer` : 'Municipal Inspector'),
        department: dto.departmentName || 'AMC General Administration',
        wardOrZone: dto.roadLandmark || 'Amravati Municipal Corporation',
        phone: dto.assignedOfficerMobileNo || undefined,
        rating: dto.assignedOfficerRating || undefined,
      },
    },
    {
      stepNumber: 3,
      titleEn: 'Field Verification & Resolution',
      titleMr: '',
      subtitleEn: isDone
        ? `Work completed on ${formatDate(dto.resolvedDate || dto.closedDate)}`
        : 'Quality inspection and civic proof verification',
      subtitleMr: '',
      badgeTextEn: isDone ? 'Resolved' : 'Pending',
      badgeTextMr: '',
      state: isDone ? 'done' : 'pending',
    },
  ];
}
