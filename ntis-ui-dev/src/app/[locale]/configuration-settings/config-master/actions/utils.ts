import { cookies, headers } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { UserRole } from '@/types/common.types';
import { locales } from '@/i18n/config';

function normalizeHost(value: string | null): string {
  if (!value) return '';
  return value.trim().toLowerCase();
}

/**
 * Basic same-origin guard for Server Actions.
 * Mitigates cross-site POST attempts when cookies are present.
 */
export async function verifyRequestOrigin(): Promise<void> {
  const headersList = await headers();
  const origin = headersList.get('origin');

  // Non-browser/internal calls may not send origin; allow those.
  if (!origin) return;

  let originHost = '';
  try {
    originHost = new URL(origin).host.toLowerCase();
  } catch {
    throw new Error('Forbidden. Invalid request origin.');
  }

  const host = normalizeHost(headersList.get('x-forwarded-host') || headersList.get('host'));

  if (!host || originHost !== host) {
    throw new Error('Forbidden. Cross-origin request blocked.');
  }
}

/**
 * Get current locale from request headers
 */
export async function getLocaleFromHeaders(): Promise<string> {
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || headersList.get('referer') || '';
  const localePattern = new RegExp(`^/(${locales.join('|')})(/|$)`);
  const localeMatch = pathname.match(localePattern) || pathname.match(new RegExp(`https?://[^/]+/(${locales.join('|')})(/|$)`));
  return localeMatch ? localeMatch[1] : 'en';
}

export async function tConfigMessage(key: string, fallback: string): Promise<string> {
  try {
    const locale = await getLocaleFromHeaders();
    const t = await getTranslations({ locale, namespace: 'configMaster.messages' });
    const translated = t(key as never);
    if (!translated || translated === key || translated === `configMaster.messages.${key}`) {
      return fallback;
    }
    return translated;
  } catch {
    return fallback;
  }
}

/**
 * Localizes backend error messages dynamically.
 */
export async function localizeConfigError(
  err: unknown,
  actionFallbackKey: string = 'unexpectedError',
  actionFallbackDefault: string = 'An unexpected error occurred'
): Promise<string> {
  const errMsg = err instanceof Error ? err.message : String(err);
  return await localizeBackendMessage(errMsg, actionFallbackKey, actionFallbackDefault);
}

/**
 * Intercepts raw backend API messages and error responses, mapping them to localized translation keys
 */
export async function localizeBackendMessage(
  messageOrError: string | null | undefined,
  fallbackKey: string = 'unexpectedError',
  fallbackDefault: string = 'An unexpected error occurred'
): Promise<string> {
  if (!messageOrError) {
    return await tConfigMessage(fallbackKey, fallbackDefault);
  }

  const msg = messageOrError.toLowerCase();

  // 1. Duplicate / Unique Constraints
  if (msg.includes('already exists') || msg.includes('duplicate') || msg.includes('unique constraint')) {
    if (msg.includes('code')) {
      return await tConfigMessage('duplicateCode', 'Code already exists. Please use a unique code.');
    }
    if (msg.includes('name')) {
      return await tConfigMessage('duplicateName', 'Name already exists. Please use a unique name.');
    }
    return await tConfigMessage('duplicateRecord', 'Record already exists.');
  }

  // 2. Not Found
  if (msg.includes('not found') || msg.includes('does not exist')) {
    return await tConfigMessage('recordNotFound', 'Requested record was not found.');
  }

  // 3. Foreign Key / Association Constraints / Dependencies
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
    return await tConfigMessage('dependencyExists', 'Operation failed because this record is associated with other active data.');
  }

  // 4. Unauthorized / Session Expired
  if (msg.includes('unauthorized') || msg.includes('forbidden') || msg.includes('invalid token') || msg.includes('expired')) {
    return await tConfigMessage('unauthorized', 'Unauthorized. Please log in.');
  }

  return await tConfigMessage(fallbackKey, fallbackDefault);
}


/**
 * Bypasses JWT session token validation.
 * @param allowedRoles - Optional array of roles
 * @returns userId
 */
export async function verifySession(_allowedRoles?: UserRole[]): Promise<number> {
  try {
    const cookieStore = await cookies();
    const userIdCookie = cookieStore.get('user_id')?.value;
    if (userIdCookie) {
      const id = parseInt(userIdCookie, 10);
      if (Number.isFinite(id) && id > 0) {
        return id;
      }
    }
  } catch {}
  return 1;
}

/**
 * Helpers to generate consistent audit trail data for requests.
 */
export async function getCreateAuditParams() {
  const userId = await verifySession();
  return { createdBy: userId };
}

export async function getUpdateAuditParams() {
  const userId = await verifySession();
  return { updatedBy: userId };
}

/**
 * Get current session data (role, userId) without validation.
 */
export async function getSessionData() {
  try {
    const cookieStore = await cookies();
    const userIdCookie = cookieStore.get('user_id')?.value;
    const userId = userIdCookie ? parseInt(userIdCookie, 10) : 1;
    return {
      userId: Number.isFinite(userId) && userId > 0 ? userId : 1,
      email: 'admin@tmc.gov.in',
      role: UserRole.ADMIN,
      exp: undefined
    };
  } catch {
    return {
      userId: 1,
      email: 'admin@tmc.gov.in',
      role: UserRole.ADMIN,
      exp: undefined
    };
  }
}

/**
 * Get current user role.
 */
export async function getSessionRole(): Promise<UserRole | null> {
  const data = await getSessionData();
  return data?.role || null;
}

/**
 * Process an array in chunks with a concurrency limit.
 * Useful for bulk operations to avoid overwhelming the backend.
 */
export const MAX_CONCURRENT_UPDATES = 10;
export async function processBatch<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  concurrency: number
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
  }
  return results;
}
