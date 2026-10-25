import { SESSION_EXPIRED_LOGIN_ERROR } from '@/components/modules/login/constants';
import { defaultLocale, locales } from '@/i18n/config';

export function isNextRedirectError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'digest' in error &&
    typeof (error as { digest?: unknown }).digest === 'string' &&
    String((error as { digest: string }).digest).startsWith('NEXT_REDIRECT')
  );
}

export function resolveLocaleFromPathname(pathname: string): string {
  const first = pathname.split('/').filter(Boolean)[0];
  return (locales as readonly string[]).includes(first) ? first : defaultLocale;
}

export function buildSessionExpiredLoginPath(locale: string): string {
  return `/${locale}/login?error=${SESSION_EXPIRED_LOGIN_ERROR}`;
}

/** Client: navigate to login when the API rejects the token before cookie expiry. */
export function redirectSessionExpiredOnClient(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('ntis:session-unauthorized'));
  const locale = resolveLocaleFromPathname(window.location.pathname);
  window.location.assign(buildSessionExpiredLoginPath(locale));
}
