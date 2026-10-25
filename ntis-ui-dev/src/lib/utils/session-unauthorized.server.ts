import 'server-only';

import { redirect } from 'next/navigation';

import { defaultLocale } from '@/i18n/config';
import { clearAuthSessionCookies } from '@/lib/utils/auth-session';
import {
  buildSessionExpiredLoginPath,
  resolveLocaleFromPathname,
} from '@/lib/utils/session-unauthorized';

/** Server: clear session cookies and redirect to login (throws NEXT_REDIRECT). */
export async function redirectSessionExpiredOnServer(locale?: string): Promise<never> {
  let resolvedLocale = locale ?? defaultLocale;

  if (!locale) {
    try {
      const { headers } = await import('next/headers');
      const headerStore = await headers();
      const pathname = headerStore.get('x-pathname') ?? '';
      if (pathname) {
        resolvedLocale = resolveLocaleFromPathname(pathname);
      }
    } catch {
      // Not in a request context
    }
  }

  try {
    await clearAuthSessionCookies();
  } catch {
    // Cookie store may be unavailable outside a request context
  }

  redirect(buildSessionExpiredLoginPath(resolvedLocale));
}

/** Server: redirect when an HTTP response is 401 for an authenticated call. */
export async function handleHttpUnauthorized(status: number, hadAuth: boolean): Promise<void> {
  if (status !== 401 || !hadAuth) return;
  await redirectSessionExpiredOnServer();
}
