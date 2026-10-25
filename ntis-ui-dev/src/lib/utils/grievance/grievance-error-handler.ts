/**
 * Centralized Grievance Error Handler & Resilience Layer
 * Path: src/lib/utils/grievance/grievance-error-handler.ts
 *
 * Normalizes raw SQL, ASP.NET Core exceptions, and HTTP errors into
 * courteous, actionable, tri-locale citizen and officer notices.
 * Line ceiling: <= 300 lines.
 */

import { toast } from 'sonner';

export interface GrievanceErrorHandlerOptions {
  locale?: string;
  citizenMobile?: string;
  onRetry?: () => void;
  onAuthRequired?: () => void;
  onNavigateTrack?: () => void;
}

export interface NormalizedGrievanceError {
  type: 'DUPLICATE' | 'AUTH' | 'CATEGORY_UNCONFIGURED' | 'CATEGORY_MISMATCH' | 'SERVICE_UNAVAILABLE' | 'OFFLINE' | 'GENERIC';
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * Strips HTML tags, exception names, and stack traces from raw backend error strings.
 */
export function sanitizeRawBackendError(raw?: string | null): string {
  if (!raw || typeof raw !== 'string') return '';
  const trimmed = raw.trim();

  // Handle ASP.NET IIS crash page HTML
  if (/<(?:!doctype|html|head|body|h\d|p)/i.test(trimmed)) {
    if (/500\.30|failed to start|startup/i.test(trimmed)) {
      return 'Server is momentarily restarting. Please retry in a moment.';
    }
    if (/502|bad gateway/i.test(trimmed)) return 'Gateway connection issue. Please retry.';
    if (/503|service unavailable/i.test(trimmed)) return 'Service temporarily unavailable.';
    return 'Server encountered a temporary issue.';
  }

  return trimmed
    .replace(/^[A-Za-z0-9_.]+(Exception|Error):\s*'?/i, '')
    .replace(/^Validation failed for [A-Za-z0-9_]+:\s*/i, '')
    .replace(/at\s+[\w.<>]+\s*\([^)]*\)/g, '')
    .replace(/^'|'$/g, '')
    .trim();
}

/**
 * Normalizes and displays a unified actionable toast for grievance errors.
 */
export function displayGrievanceError(
  rawError: unknown,
  statusCode: number | undefined,
  t: (key: string, params?: Record<string, string | number>) => string,
  options: GrievanceErrorHandlerOptions = {}
): NormalizedGrievanceError {
  const rawString = typeof rawError === 'string' ? rawError : (rawError as Error)?.message || '';
  const cleanMsg = sanitizeRawBackendError(rawString);
  const lower = cleanMsg.toLowerCase();

  const isCitizenCollision = (lower.includes('mobile') || lower.includes('citizen')) && lower.includes('already exists');

  // 1. DUPLICATE ACTIVE GRIEVANCE DETECTION
  if (
    !isCitizenCollision &&
    (lower.includes('active grievance') ||
      lower.includes('same details') ||
      lower.includes('duplicate grievance') ||
      lower.includes('duplicate complaint') ||
      (lower.includes('already exists') && (lower.includes('grievance') || lower.includes('complaint') || lower.includes('issue') || lower.includes('record'))) ||
      statusCode === 409)
  ) {
    const message = t('errorDuplicateGrievance');
    const actionLabel = t('errorDuplicateGrievanceAction');
    const onAction = () => {
      if (options.onNavigateTrack) {
        options.onNavigateTrack();
      } else if (typeof window !== 'undefined') {
        const localePrefix = options.locale ? `/${options.locale}` : '';
        const mobileParam = options.citizenMobile ? `?mobile=${encodeURIComponent(options.citizenMobile)}` : '';
        window.location.href = `${localePrefix}/grievance/track${mobileParam}`;
      }
    };

    toast.error(message, {
      duration: 7000,
      action: {
        label: actionLabel,
        onClick: onAction,
      },
    });

    return { type: 'DUPLICATE', message, actionLabel, onAction };
  }

  // 2. AUTHENTICATION / SESSION EXPIRED
  if (
    statusCode === 401 ||
    lower.includes('authentication required') ||
    lower.includes('session has expired') ||
    lower.includes('verify your mobile')
  ) {
    if (options.onAuthRequired) {
      options.onAuthRequired();
    } else if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('grievance_require_auth'));
    }

    const message = t('errorSessionExpired');
    const actionLabel = t('errorSessionExpiredAction');
    const onAction = () => {
      if (options.onAuthRequired) {
        options.onAuthRequired();
      } else if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('grievance_require_auth'));
      }
    };

    toast.error(message, {
      duration: 6000,
      action: {
        label: actionLabel,
        onClick: onAction,
      },
    });

    return { type: 'AUTH', message, actionLabel, onAction };
  }

  // 3. UNCONFIGURED DEPARTMENT CATEGORY (Foreign key missing)
  if (
    lower.includes('system.int32') ||
    lower.includes('grievancetypeid') ||
    lower.includes('createdto') ||
    lower.includes('foreign key')
  ) {
    const message = t('noCategoriesConfiguredError');
    toast.error(message, { duration: 6000 });
    return { type: 'CATEGORY_UNCONFIGURED', message };
  }

  // 4. CATEGORY MISMATCH
  if (lower.includes('does not belong to the selected department')) {
    const message = t('categoryMismatchError');
    toast.error(message, { duration: 6000 });
    return { type: 'CATEGORY_MISMATCH', message };
  }

  // 5. BACKEND OUTAGE OR 500 CRASH / RESTART
  if (
    statusCode === 500 ||
    statusCode === 502 ||
    statusCode === 503 ||
    lower.includes('failed to start') ||
    lower.includes('server is momentarily')
  ) {
    const message = t('errorServiceUnavailable');
    const actionLabel = options.onRetry ? t('errorServiceUnavailableAction') : undefined;

    toast.error(message, {
      duration: 7000,
      action: options.onRetry && actionLabel
        ? {
            label: actionLabel,
            onClick: options.onRetry,
          }
        : undefined,
    });

    return { type: 'SERVICE_UNAVAILABLE', message, actionLabel, onAction: options.onRetry };
  }

  // 6. CLIENT OFFLINE / NETWORK ERROR
  if (
    (typeof navigator !== 'undefined' && !navigator.onLine) ||
    lower.includes('failed to fetch') ||
    lower.includes('networkerror')
  ) {
    const message = t('errorNetworkOffline');
    toast.error(message, { duration: 7000 });
    return { type: 'OFFLINE', message };
  }

  // 7. GENERIC FALLBACK
  const message = cleanMsg || t('grievanceSubmitFailure');
  toast.error(message, { duration: 6000 });
  return { type: 'GENERIC', message };
}
