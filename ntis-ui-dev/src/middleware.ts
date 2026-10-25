/**
 * Next.js Middleware: i18n routing + auth gate
 * Protected routes require a non-expired access + refresh token pair.
 */

import createMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { defaultLocale, locales } from './i18n/config';
import {
  AUTH_COOKIES,
  SESSION_TOKEN_COOKIES,
  SESSION_EXPIRED_LOGIN_ERROR,
} from './components/modules/login/constants';
import { getSessionValidityFromTokens } from './lib/utils/session-validity';
import { isFireAuditPath, isFireCitizenPublicPath } from './lib/api/fire-audit/guards/fire-audit-paths';

const intlMiddleware = createMiddleware({
  locales: [...locales],
  defaultLocale,
  localePrefix: 'always',
  localeDetection: false,
});

function localeAndPathWithoutLocale(pathname: string): { locale: string; pathWithoutLocale: string } {
  const segments = pathname.split('/').filter(Boolean);
  const first = segments[0];
  const hasLocalePrefix = (locales as readonly string[]).includes(first);
  const locale = hasLocalePrefix ? first : defaultLocale;
  const rest = hasLocalePrefix ? segments.slice(1) : segments;
  const pathWithoutLocale = rest.length === 0 ? '/' : `/${rest.join('/')}`;
  return { locale, pathWithoutLocale };
}

function clearAuthCookiesOnResponse(response: NextResponse): void {
  for (const name of SESSION_TOKEN_COOKIES) {
    response.cookies.delete(name);
  }
}

function applyAntiCacheHeaders(headers: Headers): void {
  headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  headers.set('Pragma', 'no-cache');
  headers.set('Expires', '0');
}

function redirectToLogin(
  request: NextRequest,
  locale: string,
  sessionExpired: boolean
): NextResponse {
  const url = new URL(`/${locale}/login`, request.url);
  if (sessionExpired) {
    url.searchParams.set('error', SESSION_EXPIRED_LOGIN_ERROR);
  }
  const response = NextResponse.redirect(url);
  applyAntiCacheHeaders(response.headers);
  clearAuthCookiesOnResponse(response);
  return response;
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Fast bypass for service worker and public metadata files
  if (
    pathname === '/sw.js' ||
    pathname === '/manifest.json' ||
    pathname === '/manifest.webmanifest' ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/icons/')
  ) {
    return NextResponse.next();
  }

  const { locale, pathWithoutLocale } = localeAndPathWithoutLocale(pathname);

  const accessToken = request.cookies.get(AUTH_COOKIES.AUTH_TOKEN)?.value;
  const refreshToken = request.cookies.get(AUTH_COOKIES.REFRESH_TOKEN)?.value;
  const sessionExpiresAt = request.cookies.get(AUTH_COOKIES.SESSION_EXPIRES_AT)?.value;
  const sessionState = getSessionValidityFromTokens(
    accessToken,
    refreshToken,
    sessionExpiresAt
  );
  const isLoggedIn = sessionState === 'active';

  const isLoginRoute = pathWithoutLocale === '/login' || pathWithoutLocale.startsWith('/login/');
  const isAccountSecurityRoute = pathWithoutLocale === '/account/security';
  // [GRIEVANCE BYPASS] Allow public citizen access to grievance module without requiring staff login
  const isGrievanceRoute =
    pathWithoutLocale === '/grievance' ||
    pathWithoutLocale.startsWith('/grievance/') ||
    pathWithoutLocale === '/departments' ||
    pathWithoutLocale.startsWith('/departments/');
  // Citizen Fire Audit and certificate verification stay outside the staff login,
  // the same way the grievance portal does. Staff /fire-audit routes stay protected.
  const isFireCitizenRoute = isFireCitizenPublicPath(pathWithoutLocale);

  // An admin-required 2FA setup that the user hasn't completed yet takes priority over
  // everywhere else in the app — including the "already logged in, bounce off /login" case
  // right below, which would otherwise send them to /home instead.
  const requiresTwoFactorSetup =
    request.cookies.get(AUTH_COOKIES.REQUIRES_TWO_FACTOR_SETUP)?.value === 'true';
  if (isLoggedIn && requiresTwoFactorSetup && !isAccountSecurityRoute) {
    const res = NextResponse.redirect(
      new URL(`/${locale}/account/security?required=1`, request.url)
    );
    applyAntiCacheHeaders(res.headers);
    return res;
  }

  if (pathWithoutLocale === '/') {
    if (!isLoggedIn) {
      return redirectToLogin(request, locale, false);
    }
    const res = NextResponse.redirect(new URL(`/${locale}/home`, request.url));
    applyAntiCacheHeaders(res.headers);
    return res;
  }

  // [GRIEVANCE BYPASS] Citizen grievance paths bypass staff login requirement
  if (!isLoginRoute && !isGrievanceRoute && !isFireCitizenRoute && !isLoggedIn) {
    return redirectToLogin(request, locale, sessionState === 'expired');
  }

  // [GRIEVANCE BYPASS] Exclude standalone citizen grievance portal from internal admin shell header/sidebar
  const isAuthOrHome =
    pathWithoutLocale === '/' ||
    pathWithoutLocale === '/home' ||
    pathWithoutLocale.startsWith('/home/') ||
    pathWithoutLocale === '/login' ||
    pathWithoutLocale.startsWith('/login/') ||
    isGrievanceRoute ||
    isFireAuditPath(pathWithoutLocale);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);
  requestHeaders.set('x-is-auth-or-home', isAuthOrHome ? 'true' : 'false');

  const intlResponse = intlMiddleware(request);

  if (intlResponse.headers.has('location')) {
    applyAntiCacheHeaders(intlResponse.headers);
    return intlResponse;
  }

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  intlResponse.headers.forEach((value, key) => {
    response.headers.set(key, value);
  });
  intlResponse.cookies.getAll().forEach((cookie) => {
    response.cookies.set(cookie);
  });
  response.headers.set('x-pathname', pathname);
  response.headers.set('x-is-auth-or-home', isAuthOrHome ? 'true' : 'false');

  applyAntiCacheHeaders(response.headers);
  return response;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
