import type { UlbMaster } from '@/types/master.types';

/** Cookie fallbacks; keep in sync with `common.app.defaultUlbCode` / `defaultUlbName` in locale JSON. */
const DEFAULT_ULB_CODE = 'TMC';
const DEFAULT_ULB_NAME = 'Sthapatya Consultant (I) Pvt.Ltd';
import { sanitizeInput } from '@/lib/utils/security';

/** Decode a raw cookie value (shared by client readers and Server Component cookie store). */
export function decodeCookieValue(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  try {
    return decodeURIComponent(raw.replace(/\+/g, ' '));
  } catch {
    return raw;
  }
}

/** Client-side cookie read */
export function getCookieValue(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;

  const cookieEntry = document.cookie
    .split(';')
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .find((part) => {
      const separatorIndex = part.indexOf('=');
      const cookieName = separatorIndex === -1 ? part : part.slice(0, separatorIndex);
      return cookieName === name;
    });

  if (!cookieEntry) return undefined;

  const separatorIndex = cookieEntry.indexOf('=');
  const rawValue = separatorIndex === -1 ? '' : cookieEntry.slice(separatorIndex + 1);

  try {
    return decodeURIComponent(rawValue.replace(/\+/g, ' '));
  } catch {
    return rawValue;
  }
}

/** Council / ULB fields stored at login for Header & Footer */
export function getUlbDataFromCookies(): Partial<UlbMaster> {
  return {
    ulbName: getCookieValue('ulb_name'),
    ulbNameLocal: getCookieValue('ulb_name_local'),
    ulbLogo: getCookieValue('ulb_logo'),
    ulbCode: getCookieValue('ulb_code'),
  };
}

export function getUsernameFromCookie(): string | undefined {
  const rawUserName = getCookieValue('user_name');
  if (!rawUserName) return undefined;

  const safeUserName = sanitizeInput(rawUserName);
  if (safeUserName && safeUserName.length > 0 && safeUserName.length <= 50) {
    return safeUserName;
  }
  return undefined;
}

/** Minimal cookie store shape from `next/headers` `cookies()` (Server Components / actions). */
export type CookieStoreLike = {
  get(name: string): { value: string } | undefined;
};

const DEFAULT_LAYOUT_ULB: UlbMaster = {
  id: 1,
  ulbCode: DEFAULT_ULB_CODE,
  ulbName: DEFAULT_ULB_NAME,
  ulbTypeId: 1,
  isActive: true,
};

/** Council fields from the login response, stored in non-httpOnly cookies — read on the server for SSR shell. */
export function getUlbDataFromCookieStore(store: CookieStoreLike): Partial<UlbMaster> {
  return {
    ulbName: decodeCookieValue(store.get('ulb_name')?.value),
    ulbNameLocal: decodeCookieValue(store.get('ulb_name_local')?.value),
    ulbLogo: decodeCookieValue(store.get('ulb_logo')?.value),
    ulbCode: decodeCookieValue(store.get('ulb_code')?.value),
  };
}

export function getUsernameFromCookieStore(store: CookieStoreLike): string | undefined {
  const rawUserName = decodeCookieValue(store.get('user_name')?.value);
  if (!rawUserName) return undefined;
  const safeUserName = sanitizeInput(rawUserName);
  if (safeUserName && safeUserName.length > 0 && safeUserName.length <= 50) {
    return safeUserName;
  }
  return undefined;
}

/**
 * Header/footer shell: ULB + display name from cookies on the server (no client fetch / useEffect).
 */
export function getLayoutShellContextFromCookies(store: CookieStoreLike): {
  ulbData: UlbMaster;
  userDisplayName?: string;
} {
  const partial = getUlbDataFromCookieStore(store);
  const ulbName = (partial.ulbName ?? '').trim() || DEFAULT_LAYOUT_ULB.ulbName;
  const ulbCode = (partial.ulbCode ?? '').trim() || DEFAULT_LAYOUT_ULB.ulbCode;
  const ulbNameLocal = (partial.ulbNameLocal ?? '').trim() || undefined;
  const ulbLogo = (partial.ulbLogo ?? '').trim() || undefined;

  const ulbData: UlbMaster = {
    ...DEFAULT_LAYOUT_ULB,
    ulbName,
    ulbCode,
    ulbNameLocal,
    ulbLogo,
  };

  return {
    ulbData,
    userDisplayName: getUsernameFromCookieStore(store),
  };
}

/** Reads authenticated user id from httpOnly `user_id` cookie set at login. */
export function getUserIdFromCookies(cookieStore: CookieStoreLike): number | null {
  const raw = cookieStore.get('user_id')?.value;
  if (!raw) return null;
  const id = parseInt(raw, 10);
  if (!Number.isFinite(id) || id <= 0) return null;
  return id;
}
/** Client-side: Reads authenticated user id from `user_id` cookie. */
export function getUserIdFromCookie(): number | null {
  const raw = getCookieValue('user_id');
  if (!raw) return null;
  const id = parseInt(raw, 10);
  if (!Number.isFinite(id) || id <= 0) return null;
  return id;
}


// ---------------------------------------------------------------------------
// Department / Module Context Cookies
// ---------------------------------------------------------------------------

/** Shape returned by department context cookie readers. */
export interface DepartmentContext {
  departmentId: number | null;
  departmentName: string | undefined;
  moduleId: number | null;
  moduleName: string | undefined;
}

/** Helper: parse a cookie value as a positive integer or null. */
function parsePositiveInt(raw: string | undefined): number | null {
  if (!raw) return null;
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

/** Client-side: reads the active department/module context set when navigating from home. */
export function getDepartmentContextFromCookies(): DepartmentContext {
  return {
    departmentId: parsePositiveInt(getCookieValue('department_id')),
    departmentName: getCookieValue('department_name'),
    moduleId: parsePositiveInt(getCookieValue('module_id')),
    moduleName: getCookieValue('module_name'),
  };
}

/** Server-side: reads the active department/module context from the cookie store. */
export function getDepartmentContextFromCookieStore(store: CookieStoreLike): DepartmentContext {
  return {
    departmentId: parsePositiveInt(decodeCookieValue(store.get('department_id')?.value)),
    departmentName: decodeCookieValue(store.get('department_name')?.value),
    moduleId: parsePositiveInt(decodeCookieValue(store.get('module_id')?.value)),
    moduleName: decodeCookieValue(store.get('module_name')?.value),
  };
}

// ---------------------------------------------------------------------------
// PTIS Media Panel Visibility Cookie
// ---------------------------------------------------------------------------

export const COOKIE_PTIS_MEDIA_PANEL_VISIBLE = 'ptis_media_panel_visible';

/** Reads client-side cookie for PTIS media panel visibility (`true` or `false`). */
export function getMediaPanelVisibleFromCookie(): boolean | undefined {
  const val = getCookieValue(COOKIE_PTIS_MEDIA_PANEL_VISIBLE);
  if (val === 'true') return true;
  if (val === 'false') return false;
  return undefined;
}

/** Reads server-side cookie store for PTIS media panel visibility (`true` or `false`). */
export function getMediaPanelVisibleFromCookieStore(store: CookieStoreLike): boolean {
  const val = decodeCookieValue(store.get(COOKIE_PTIS_MEDIA_PANEL_VISIBLE)?.value);
  return val === 'true';
}

/** Sets client-side cookie for PTIS media panel visibility. */
export function setMediaPanelVisibleInCookie(visible: boolean): void {
  if (typeof document === 'undefined') return;
  const maxAge = 365 * 24 * 60 * 60; // 1 year
  document.cookie = `${COOKIE_PTIS_MEDIA_PANEL_VISIBLE}=${visible ? 'true' : 'false'}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

