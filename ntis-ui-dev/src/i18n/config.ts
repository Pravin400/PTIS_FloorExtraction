/**
 * Minimal router interface for locale switching.
 * We define this locally instead of importing from 'next/navigation' to:
 * 1. Keep this config file framework-agnostic and testable
 * 2. Avoid importing Next.js internals in a shared configuration module
 * 3. Only expose the single method we actually need (push)
 *
 * Exported for consumers of switchLocale who need to type their router parameter.
 */
export interface MinimalRouter {
  push: (href: string) => void | Promise<void>;
}

/**
 * i18n Configuration
 * Defines supported locales and default locale for the application
 */

export const locales = ['en', 'hi', 'mr'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  hi: 'हिंदी',
  mr: 'मराठी',
};

/**
 * Extracts the locale from a pathname.
 * This is a shared utility to ensure consistent locale extraction across the app.
 * @param pathname - The URL pathname (e.g., '/en/dashboard', '/hi', '/')
 * @returns The extracted locale or the default locale if not found
 */
export function getLocaleFromPathname(pathname: string): Locale {
  const locale = locales.find(
    (loc) => pathname === `/${loc}` || pathname.startsWith(`/${loc}/`)
  );
  return locale ?? defaultLocale;
}

/**
 * Switches the application locale by updating cookies, localStorage, and redirecting.
 * @param locale - The target locale to switch to
 * @param pathname - The current pathname
 * @param router - Router instance with push method
 */
export function switchLocale(locale: Locale, pathname: string, router: MinimalRouter): void {
  // Save to cookie (expires in 1 year)
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);

  if (typeof document !== 'undefined') {
    document.cookie = `NEXT_LOCALE=${locale}; path=/; expires=${expires.toUTCString()}`;
  }

  // Save to localStorage as backup
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem('NEXT_LOCALE', locale);
    } catch {
      // Ignore write errors (e.g., Safari private mode, quota exceeded)
    }
  }

  // Extract the current path without locale prefix
  const localePattern = new RegExp(`^/(${locales.join('|')})`);
  const pathWithoutLocale = pathname.replace(localePattern, '') || '/';

  // Construct new path with search params preserved
  const search = typeof window !== 'undefined' ? window.location.search : '';
  const newPath = `/${locale}${pathWithoutLocale === '/' ? '' : pathWithoutLocale}${search}`;

  // Use simple push; Next.js middleware and layouts will handle the rest
  router.push(newPath);
}
