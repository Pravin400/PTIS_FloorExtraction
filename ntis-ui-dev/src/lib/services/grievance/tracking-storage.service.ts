import type { TrackingTicket, ResolutionProof, ActivityLogItem } from '@/types/grievance';

export const TRACKING_STORAGE_KEY = 'amravati_citizen_tracking_tickets';
export const TRACKING_UPDATE_EVENT = 'amravati_tickets_updated';

export interface SubmissionToTicketParams {
  trackingId: string;
  department: string;
  departmentMarathi?: string;
  description: string;
  images?: string[];
  citizen?: {
    name?: string;
    mobile?: string;
    email?: string;
  };
  jurisdiction?: {
    zone?: string;
    ward?: string;
    landmark?: string;
  };
  specifics?: {
    defectType?: string;
    roadLandmark?: string;
  };
  hod?: string;
}

/**
 * Builds a full-fidelity TrackingTicket from form submission data.
 */
export function createTrackingTicketFromSubmission(
  data: SubmissionToTicketParams
): TrackingTicket {
  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }) + ', ' + now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const subject =
    data.specifics?.defectType ||
    (data.description && data.description.length > 50
      ? `${data.description.substring(0, 48)}...`
      : data.description) ||
    '';

  const ward =
    data.jurisdiction?.ward ||
    (data.jurisdiction?.zone ? data.jurisdiction.zone : '');

  const officerName = data.hod || '';

  const proof: ResolutionProof | undefined =
    data.images && data.images.length > 0
      ? {
        beforeImageUrl: data.images[0],
        afterImageUrl: '',
        completedAt: formattedDate,
        workSummary: data.description || '',
        verifiedByOfficer: officerName || '',
      }
      : undefined;

  const activityLogs: ActivityLogItem[] = [
    {
      id: `log-${Date.now()}-1`,
      timestamp: formattedDate,
      actionEn: 'Grievance Submitted',
      actionMr: '',
      actor: data.citizen?.name || '',
      desk: data.department,
      statusBadge: 'SUBMITTED',
    },
  ];

  const numMatch = data.trackingId?.match(/(\d+)$/);
  const resolvedId = numMatch && Number(numMatch[1]) > 0 ? String(Number(numMatch[1])) : `grv_${Date.now()}`;

  return {
    id: resolvedId,
    token: data.trackingId,
    subject,
    subjectMr: data.specifics?.defectType || subject,
    department: data.department,
    departmentMr: data.departmentMarathi || data.department,
    ward,
    wardMr: ward,
    status: 'SUBMITTED',
    reportedDate: formattedDate,
    slaHoursLeft: 0,
    slaTotalHours: 0,
    slaDeadline: '',
    activeDeskEn: data.department,
    activeDeskMr: data.departmentMarathi || data.department,
    activeOfficerName: officerName,
    activeOfficerTitle: '',
    steps: [],
    proof,
    images: data.images || [],
    activityLogs,
  };
}

/**
 * Saves a new tracking ticket to browser localStorage and notifies listeners.
 * Strictly ignores non-database / seed / AMC- tickets.
 */
export function saveTrackingTicket(ticket: TrackingTicket): void {
  if (typeof window === 'undefined') return;
  if (!ticket || !ticket.token || ticket.token.startsWith('AMC-') || !ticket.token.startsWith('GRV-')) {
    return;
  }

  try {
    const raw = localStorage.getItem(TRACKING_STORAGE_KEY);
    const existing: TrackingTicket[] = raw ? JSON.parse(raw) : [];

    // Filter out duplicates and any non-GRV tickets
    const filtered = existing.filter(
      (t) => t.token !== ticket.token && t.id !== ticket.id && t.token.startsWith('GRV-')
    );

    // Prepend new ticket so it appears first (offline outbox fallback)
    const updated = [ticket, ...filtered];
    localStorage.setItem(TRACKING_STORAGE_KEY, JSON.stringify(updated));

    // Also bookmark token in lightweight recent tokens list
    addRecentTrackedToken(ticket.token);

    // Dispatch custom event for reactive UI updates across components/tabs
    window.dispatchEvent(
      new CustomEvent(TRACKING_UPDATE_EVENT, { detail: ticket })
    );
  } catch (err) {
    console.error('Failed to save tracking ticket to localStorage:', err);
  }
}

/**
 * Retrieves cached tracking tickets from browser localStorage.
 */
export function getTrackingTicketsFromStorage(): TrackingTicket[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(TRACKING_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Pattern 1: Lightweight Recent Token Bookmarks (Strings Only, No Stale Data)
// ---------------------------------------------------------------------------

export const RECENT_TOKENS_STORAGE_KEY = 'amravati_recent_tracked_tokens';

/**
 * Retrieves the list of recently submitted or tracked grievance tokens on this device.
 * Stored as pure string tokens (e.g. ['GRV-2026-000004']) — actual data is always fetched live from the DB.
 */
export function getRecentTrackedTokens(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(RECENT_TOKENS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((t) => typeof t === 'string' && t.startsWith('GRV-'));
    }
  } catch {
    // ignore
  }
  return [];
}

/**
 * Bookmarks a grievance token in local storage so the citizen can track it without re-typing.
 * Keeps up to 10 unique recent tokens in newest-first order.
 */
export function addRecentTrackedToken(token: string): void {
  if (typeof window === 'undefined' || !token || !token.startsWith('GRV-')) return;
  try {
    const current = getRecentTrackedTokens();
    const cleanToken = token.trim();
    const filtered = current.filter((t) => t.toLowerCase() !== cleanToken.toLowerCase());
    const updated = [cleanToken, ...filtered].slice(0, 10);
    localStorage.setItem(RECENT_TOKENS_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

/**
 * Removes a token from the device's recent list.
 */
export function removeRecentTrackedToken(token: string): void {
  if (typeof window === 'undefined' || !token) return;
  try {
    const current = getRecentTrackedTokens();
    const filtered = current.filter((t) => t.toLowerCase() !== token.trim().toLowerCase());
    localStorage.setItem(RECENT_TOKENS_STORAGE_KEY, JSON.stringify(filtered));
  } catch {
    // ignore
  }
}

/**
 * Removes a ticket from localStorage and recent tokens list, and emits sync event.
 */
export function removeTrackingTicket(tokenOrId: string): void {
  if (typeof window === 'undefined' || !tokenOrId) return;
  try {
    const raw = localStorage.getItem(TRACKING_STORAGE_KEY);
    if (raw) {
      const tickets: TrackingTicket[] = JSON.parse(raw);
      if (Array.isArray(tickets)) {
        const cleanTarget = tokenOrId.trim().toLowerCase();
        const filtered = tickets.filter(
          (t) => String(t.id).toLowerCase() !== cleanTarget && t.token.toLowerCase() !== cleanTarget
        );
        localStorage.setItem(TRACKING_STORAGE_KEY, JSON.stringify(filtered));
      }
    }
    removeRecentTrackedToken(tokenOrId);
    window.dispatchEvent(
      new CustomEvent(TRACKING_UPDATE_EVENT, { detail: { removedTokenOrId: tokenOrId } })
    );
  } catch (err) {
    console.error('Failed to remove tracking ticket from localStorage:', err);
  }
}

/**
 * Enterprise Logout Eviction:
 * Purges all cached tracking tickets and recent tokens from browser localStorage.
 */
export function clearTrackingStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(TRACKING_STORAGE_KEY);
    localStorage.removeItem(RECENT_TOKENS_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Generates the canonical tracking page URL for a grievance token.
 * Single source of truth across the application (DRY).
 */
export function getTrackingUrl(token: string, mobile?: string): string {
  const clean = encodeURIComponent(token.trim());
  const base = `/grievance/track?token=${clean}&view=timeline`;
  return mobile ? `${base}&mobile=${encodeURIComponent(mobile.trim())}` : base;
}
