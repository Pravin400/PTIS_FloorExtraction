/**
 * Action Utilities for Grievance Category
 *
 * SECURITY NOTE (B-3):
 * Session validation is bypassed for simplicity and sync with only API configuration master.
 * `getCurrentUserId` reads the user ID from direct cookies, falling back to 1.
 *
 * AUDIT NOTE (I-6):
 * `resolveAuditUserId` now requires a `number` (not `number | undefined`).
 * There is no fallback ID inside resolveAuditUserId, but getCurrentUserId returns a fallback.
 */
import { cookies } from 'next/headers';
import { getTranslations } from 'next-intl/server';

const DIRECT_USER_ID_COOKIE_KEYS = [
  'user_id',
  'userId',
  'login_id',
  'loginId',
  'employee_id',
  'employeeId',
] as const;

export function parsePositiveInteger(value: string | number | null | undefined): number | undefined {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return undefined;
}

export async function getCurrentUserId(): Promise<number | undefined> {
  try {
    const cookieStore = await cookies();

    // 1. Try direct userId cookies first
    for (const key of DIRECT_USER_ID_COOKIE_KEYS) {
      const cookieValue = cookieStore.get(key)?.value;
      const parsedValue = parsePositiveInteger(cookieValue);
      if (parsedValue) {
        return parsedValue;
      }
    }

    // 2. Try to extract userId from auth_token without verifying JWT signature
    const token = cookieStore.get('auth_token')?.value || cookieStore.get('access_token')?.value || cookieStore.get('token')?.value;
    if (token) {
      const parts = token.split('.');
      if (parts.length === 3) {
        const decoded = Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
        const payload = JSON.parse(decoded);
        const userId = payload.userId || payload.sub || payload.id || payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || payload.nameidentifier;
        if (userId) {
          const id = parseInt(userId, 10);
          if (Number.isFinite(id) && id > 0) {
            return id;
          }
        }
      }
    }

    // No cookies or token present at all - return undefined (which triggers unauthorized)
    return undefined;
  } catch {
    return undefined;
  }
}

export function getGrievanceCategoryMasterPath(locale: string): string {
  return `/${locale}/configuration-settings/grievance-category-master`;
}

export function getAuditTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Returns the audit user ID.
 * Requires a verified `number` — callers must guard against undefined before calling.
 * There is NO fallback default; a missing userId must halt the action.
 */
export function resolveAuditUserId(currentUserId: number): number {
  return currentUserId;
}

export async function tGrievanceMessage(
  locale: string,
  key: string,
  fallback: string
): Promise<string> {
  try {
    const isToast = key.startsWith('master.toast.');
    const namespace = isToast ? 'grievanceCategory' : 'grievanceCategory.form.errors';

    const t = await getTranslations({ locale, namespace });
    const translated = t(key as never);
    if (!translated || translated === key || translated === `${namespace}.${key}`) {
      return fallback;
    }
    return translated;
  } catch {
    return fallback;
  }
}

export async function localizeBackendMessage(
  messageOrError: string | null | undefined,
  locale: string,
  fallbackKey: string,
  fallbackDefault: string
): Promise<string> {
  if (!messageOrError) {
    return await tGrievanceMessage(locale, fallbackKey, fallbackDefault);
  }

  const msg = messageOrError.toLowerCase();

  // 1. Duplicate
  if (msg.includes('already exists') || msg.includes('duplicate') || msg.includes('unique constraint')) {
    if (msg.includes('code')) {
      return await tGrievanceMessage(locale, 'duplicateCode', 'Category code already exists. Please use a unique code.');
    }
    if (msg.includes('name')) {
      return await tGrievanceMessage(locale, 'duplicateName', 'Category name already exists. Please use a unique name.');
    }
    return await tGrievanceMessage(locale, 'duplicateRecord', 'Grievance category already exists.');
  }

  // 2. Not Found
  if (msg.includes('not found') || msg.includes('does not exist')) {
    return await tGrievanceMessage(locale, 'recordNotFound', 'Grievance category not found.');
  }

  // 3. Dependency Conflict
  if (
    msg.includes('conflict') || 
    msg.includes('association') || 
    msg.includes('associated') || 
    msg.includes('dependency') || 
    msg.includes('dependent') ||
    msg.includes('foreign key') ||
    msg.includes('cannot delete') ||
    msg.includes('referenced')
  ) {
    return await tGrievanceMessage(locale, 'dependencyExists', 'Cannot delete/modify because associated grievances or records exist.');
  }

  // 4. Unauthorized
  if (msg.includes('unauthorized') || msg.includes('forbidden') || msg.includes('invalid token') || msg.includes('expired')) {
    return await tGrievanceMessage(locale, 'unauthorized', 'Unauthorized. Please log in.');
  }

  return await tGrievanceMessage(locale, fallbackKey, fallbackDefault);
}

