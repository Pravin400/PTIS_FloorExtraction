'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState, useMemo, useEffect, useCallback, useRef, useTransition } from 'react';
import Image from 'next/image';
import { User, Settings, Lock, Globe, ChevronDown, LogOut, Router, Loader2, AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { UlbMaster } from '@/types/master.types';
import type { MenuItem } from '@/types/menu.types';
import { Badge, Button, Card, Tooltip } from '@/components/common';
import { sanitizeInput } from '@/lib/utils/security';
import { locales, switchLocale, getLocaleFromPathname, type Locale } from '@/i18n/config';
import { logoutAction } from '@/app/[locale]/login/actions';
import { ChangePasswordModal } from './ChangePasswordModal';

const HEADER_COLORS = {
  background: '#4b70a6',
  userCardFrom: '#243B7C',
  userCardTo: '#0C1B48',
} as const;

const menuNavBtnClass =
  'h-auto w-full rounded-none justify-start px-4 py-2.5 text-left text-sm font-normal text-blue-50/95 hover:bg-white/10 !text-blue-50/95';

const avatarBadgeClass =
  '!flex !h-9 !w-9 !shrink-0 !min-h-9 !min-w-9 !items-center !justify-center !rounded-full !border-2 !border-white/25 !bg-gradient-to-br !from-orange-400 !to-pink-500 !p-0 !text-sm !font-bold !text-white !shadow-inner';

const avatarBadgeMenuClass =
  '!flex !h-11 !w-11 !shrink-0 !min-h-11 !min-w-11 !items-center !justify-center !rounded-full !border-2 !border-white/25 !bg-gradient-to-br !from-orange-400 !to-pink-500 !p-0 !text-sm !font-bold !text-white !shadow-inner';

/** Isolated logo + error state so `logoSrc` changes remount and clear errors without an effect. */
function HeaderCouncilLogo({
  logoSrc,
  title,
  logoFallbackText,
}: {
  logoSrc?: string;
  title: string;
  logoFallbackText: string;
}) {
  const [logoHasError, setLogoHasError] = useState(false);

  if (logoHasError || !logoSrc) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600 text-center text-white font-bold text-xs leading-tight px-1">
        {logoFallbackText}
      </div>
    );
  }

  return (
    <Image
      src={logoSrc}
      alt={title ? `${title} Logo` : 'Logo'}
      width={56}
      height={56}
      className="h-full w-full object-contain"
      onError={() => setLogoHasError(true)}
      unoptimized
    />
  );
}

interface HeaderProps {
  ulbData?: UlbMaster;
  /** Display name from `user_name` cookie ΓÇö set in MainLayout via server `cookies()` for SSR. */
  userDisplayName?: string;
  /** Best-effort client IP from request headers (server layout). */
  clientIp?: string;
  menuItems?: MenuItem[];
  /**
   * Slot system for civic/grievance composition.
   * When provided, replaces default ULB branding on the left.
   */
  leftSlot?: React.ReactNode;
  /**
   * When provided, replaces default user-menu section on the right.
   * Useful for completely custom action areas (e.g. GrievanceHeader).
   */
  actionsSlot?: React.ReactNode;
  /** 'civic' renders a white header without animated blobs. Default: 'default'. */
  variant?: 'default' | 'civic';
}

export function Header({ ulbData, userDisplayName, clientIp, menuItems, leftSlot, actionsSlot, variant = 'default' }: HeaderProps) {
  const t = useTranslations('common');
  const tLogin = useTranslations('login');
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [isLogoutPending, startLogoutTransition] = useTransition();
  const menuRef = useRef<HTMLDivElement>(null);

  const [warningActive, setWarningActive] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [warningType, setWarningType] = useState<'session' | 'inactivity'>('session');
  const isCritical = secondsLeft <= 20;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleTick = (e: Event) => {
      const customEvent = e as CustomEvent<{ secondsLeft: number; active: boolean; type?: 'session' | 'inactivity' }>;
      setWarningActive(customEvent.detail.active);
      setSecondsLeft(customEvent.detail.secondsLeft);
      if (customEvent.detail.type) {
        setWarningType(customEvent.detail.type);
      }
    };

    window.addEventListener('ntis:session-warning-tick', handleTick);
    return () => {
      window.removeEventListener('ntis:session-warning-tick', handleTick);
    };
  }, []);

  const branding = ulbData as (UlbMaster & { logoUrl?: string }) | undefined;
  const logoSrc = useMemo(() => {
    const rawLogoSrc = branding?.ulbLogo || branding?.logoUrl;
    if (typeof rawLogoSrc !== 'string') return undefined;

    const normalizedLogoSrc = rawLogoSrc.trim();
    return normalizedLogoSrc || undefined;
  }, [branding?.ulbLogo, branding?.logoUrl]);

  const title = useMemo(() => sanitizeInput(ulbData?.ulbName ?? '') || '', [ulbData?.ulbName]);

  const localName = useMemo(
    () => sanitizeInput(ulbData?.ulbNameLocal ?? '') || '',
    [ulbData?.ulbNameLocal]
  );

  const locale = getLocaleFromPathname(pathname);
  const showLocalCouncilName = locale !== 'en' && Boolean(localName);

  const headerDetails = t('app.assessmentSystem');

  const activeMenuName = useMemo(() => {
    if (!menuItems || menuItems.length === 0) return null;

    const localePattern = new RegExp(`^/(${locales.join('|')})`);
    const pathWithoutLocale = pathname.replace(localePattern, '') || '/';

    const allPaths: string[] = [];
    menuItems.forEach((item) => {
      if (item.href && item.href !== '#') {
        allPaths.push(item.href.startsWith('/') ? item.href : `/${item.href}`);
      }
      if (item.subItems) {
        item.subItems.forEach((sub) => {
          if (sub.href && sub.href !== '#') {
            allPaths.push(sub.href.startsWith('/') ? sub.href : `/${sub.href}`);
          }
        });
      }
    });

    const isPathActive = (itemPath: string): boolean => {
      if (pathWithoutLocale === itemPath) return true;
      if (!pathWithoutLocale.startsWith(`${itemPath}/`)) return false;

      const hasMoreSpecificMatch = allPaths.some((otherPath) => {
        if (otherPath === itemPath) return false;
        return (
          otherPath.length > itemPath.length &&
          (pathWithoutLocale === otherPath || pathWithoutLocale.startsWith(`${otherPath}/`))
        );
      });

      return !hasMoreSpecificMatch;
    };

    for (const item of menuItems) {
      if (item.subItems) {
        for (const sub of item.subItems) {
          const subPath = sub.href.startsWith('/') ? sub.href : `/${sub.href}`;
          if (isPathActive(subPath)) {
            return sub.name;
          }
        }
      }
      const itemPath = item.href.startsWith('/') ? item.href : `/${item.href}`;
      if (isPathActive(itemPath)) {
        return item.name;
      }
    }

    return null;
  }, [menuItems, pathname]);

  const localeLabel = useMemo(() => {
    if (locale === 'en') return t('language.english');
    if (locale === 'mr') return t('language.marathi');
    return t('language.hindi');
  }, [locale, t]);

  useEffect(() => {
    if (!menuOpen) return;
    const onDocMouseDown = (e: MouseEvent) => {
      if (menuRef.current?.contains(e.target as Node)) return;
      setMenuOpen(false);
      setLangOpen(false);
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        setLangOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const pickLocale = useCallback(
    (code: Locale) => {
      if (!locales.includes(code)) return;
      try {
        switchLocale(code, pathname, router);
        setLangOpen(false);
        setMenuOpen(false);
      } catch (_error) {
        if (typeof window !== 'undefined') {
          window.alert(t('language.switchFailed'));
        }
      }
    },
    [pathname, router, t]
  );

  const handleLogout = useCallback(() => {
    setMenuOpen(false);
    setLangOpen(false);
    const currentLocale = getLocaleFromPathname(pathname);
    startLogoutTransition(async () => {
      await logoutAction(currentLocale);
    });
  }, [pathname, startLogoutTransition]);

  const logoFallbackText = useMemo(() => {
    const code = sanitizeInput(ulbData?.ulbCode ?? '') || '';
    if (code) return code.slice(0, 4);
    if (title) return title.slice(0, 2).toUpperCase();
    return '';
  }, [ulbData?.ulbCode, title]);

  const trimmedUserDisplayName = userDisplayName?.trim() || '';
  const displayName = trimmedUserDisplayName || t('app.defaultUser');
  const userInitial = displayName.charAt(0).toUpperCase();
  const ipDisplay = clientIp?.trim() || t('userMenu.ipUnavailable');

  const isDarkTheme = pathname.includes('/assets') || pathname.includes('/property-tax/ptis');
  const isCivic = variant === 'civic';

  return (
    <header className="fixed inset-x-0 top-0 z-[100] overflow-visible">
      <div
        className={`relative h-20 w-full overflow-visible border-b ${
          isCivic
            ? 'bg-white/95 backdrop-blur-md border-slate-200/90 shadow-xs'
            : isDarkTheme
            ? 'bg-[#0B132B] border-slate-800 shadow-2xl'
            : 'border-white/10 shadow-2xl'
        }`}
        style={isCivic || isDarkTheme ? undefined : { backgroundColor: HEADER_COLORS.background }}
      >
        {!isCivic && (
          <div
            className="pointer-events-none absolute inset-0 hidden sm:block opacity-30"
            style={{ contain: 'layout style paint' }}
          >
            <div className="absolute left-[15%] top-4 h-16 w-16 rounded-full bg-orange-400 blur-xl motion-safe:animate-pulse motion-reduce:animate-none" />
            <div className="absolute left-[50%] top-2 h-20 w-20 rounded-full bg-blue-400 blur-xl motion-safe:animate-pulse motion-reduce:animate-none" />
            <div className="absolute right-[15%] top-6 h-20 w-20 rounded-full bg-purple-400 blur-xl motion-safe:animate-pulse motion-reduce:animate-none" />
          </div>
        )}

        <div className="relative flex h-full w-full items-center justify-between gap-3 overflow-visible px-4 md:px-6">
          {leftSlot ? (
            leftSlot
          ) : (
          <div className="flex min-w-0 flex-1 items-center gap-3 md:gap-4 self-center">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center md:h-14 md:w-14">
              <div className="absolute inset-0 rounded-full bg-white/30 blur-xl opacity-70" />
              <div className="relative h-full w-full overflow-hidden rounded-full bg-white ring-2 ring-white/40 shadow-xl">
                <HeaderCouncilLogo
                  key={logoSrc ?? '__no_logo__'}
                  logoSrc={logoSrc}
                  title={title}
                  logoFallbackText={logoFallbackText}
                />
              </div>
            </div>

            <div className="min-w-0 leading-tight">
              {title ? (
                <h1
                  className="truncate text-sm sm:text-base md:text-2xl font-extrabold text-white"
                  style={{
                    fontFamily: 'Georgia, "Times New Roman", serif',
                    letterSpacing: '0.5px',
                  }}
                >
                  {title}
                </h1>
              ) : null}
              {showLocalCouncilName ? (
                <p className="mt-0.5 truncate text-[10px] sm:text-xs text-blue-100/90 font-medium">
                  {localName}
                </p>
              ) : null}

              <p className="mt-1 flex flex-wrap gap-1 text-[10px] sm:text-xs md:text-sm text-gray-200">
                <span>{t('app.departmentName')}</span>
                <span className="hidden sm:inline-block text-yellow-400">|</span>
                <span className="font-semibold text-yellow-300">{activeMenuName || headerDetails}</span>
              </p>
            </div>
          </div>
          )}

          {actionsSlot ? (
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {actionsSlot}
            </div>
          ) : (
          <>
          {/* Session Expiration Warning */}
          {warningActive && secondsLeft > 0 && (
            <div
              className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 text-sm font-bold shadow-lg backdrop-blur-md self-center shrink-0 transition-all duration-300 ${
                isCritical
                  ? 'border-red-500 bg-red-950/80 text-white shadow-red-500/30 critical-flash-active'
                  : 'border-amber-500/70 bg-amber-950/60 text-amber-100 shadow-amber-500/20 warning-flash-active'
              } session-warn-active`}
              role="status"
              aria-live="polite"
            >
              <span className="relative flex h-3 w-3 shrink-0">
                <span
                  className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isCritical ? 'animate-ping bg-red-400' : 'bg-amber-400 animate-pulse'
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-3 w-3 ${
                    isCritical ? 'bg-red-500' : 'bg-amber-500'
                  }`}
                />
              </span>
              <AlertCircle
                className={`h-5 w-5 shrink-0 transition-transform ${
                  isCritical ? 'text-red-400 animate-bounce timer-blink-sharp' : 'text-amber-400 timer-blink-smooth'
                }`}
                aria-hidden
              />
              <span
                className={`font-mono text-base font-extrabold tracking-wide ${
                  isCritical ? 'text-red-200 timer-blink-sharp' : 'text-amber-300 timer-blink-smooth'
                }`}
              >
                {tLogin('sessionTimeout.countdown', { seconds: secondsLeft })}
              </span>
              <span
                className={`hidden lg:inline font-semibold ${
                  isCritical ? 'text-red-100' : 'text-amber-200/90'
                }`}
              >
                {warningType === 'inactivity'
                  ? tLogin('sessionTimeout.inactivitySaveWorkHint')
                  : tLogin('sessionTimeout.saveWorkHint')}
              </span>
            </div>
          )}

          <div
            ref={menuRef}
            className="relative z-[60] flex shrink-0 items-center self-center overflow-visible pl-2"
          >
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-expanded={menuOpen}
              aria-haspopup="dialog"
              aria-controls="header-user-menu"
              onClick={() => {
                setLangOpen(false);
                setMenuOpen((open) => !open);
              }}
              className={`!h-auto min-h-0 max-w-[min(100vw-5.5rem,17.5rem)] rounded-xl border px-4 py-2.5 text-white shadow-md !justify-start ring-offset-2 md:min-w-[13.5rem] md:max-w-xs [&>span]:flex [&>span]:w-full [&>span]:min-w-0 [&>span]:items-center ${
                isDarkTheme
                  ? 'border-slate-700/80 bg-[#152243] hover:!bg-[#1c2e5a] hover:!text-white ring-offset-[#0B132B]'
                  : 'border-white/25 hover:!bg-[#243B7C] hover:!text-white ring-offset-[#4b70a6]'
              }`}
              style={
                isDarkTheme
                  ? undefined
                  : {
                      background: `linear-gradient(to right, ${HEADER_COLORS.userCardFrom}f0, ${HEADER_COLORS.userCardTo}f0)`,
                    }
              }
            >
              <span className="flex w-full min-w-0 flex-row items-center justify-between gap-3">
                <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5 self-center leading-tight">
                  <span className="w-full truncate text-left text-xs font-semibold md:text-sm text-white">
                    {displayName}
                  </span>
                </span>
                <Badge
                  variant="outline"
                  size="lg"
                  className={`${avatarBadgeClass} self-center`}
                  aria-hidden={!userInitial}
                >
                  {userInitial || <User className="h-4 w-4" strokeWidth={2} aria-hidden />}
                </Badge>
              </span>
            </Button>

            {menuOpen ? (
              <>
                <div
                  className="fixed inset-0 z-[55] bg-black/20"
                  aria-hidden
                  onClick={() => setMenuOpen(false)}
                />
                <Card
                  id="header-user-menu"
                  role="dialog"
                  aria-label={t('userMenu.openUserMenu')}
                  padding="none"
                  variant="bordered"
                  className="absolute right-0 top-full z-[70] mt-1.5 w-[min(calc(100vw-2rem),20rem)] max-h-[min(70vh,calc(100dvh-5.5rem))] overflow-y-auto overflow-x-hidden rounded-2xl border-white/15 bg-[#0a1628]/98 py-1 text-white shadow-2xl backdrop-blur-xl !shadow-2xl"
                >
                  <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5 self-center">
                      <span className="truncate text-sm font-semibold">{displayName}</span>
                    </div>
                    <Badge
                      variant="outline"
                      size="lg"
                      className={`${avatarBadgeMenuClass} self-center`}
                      aria-hidden={!userInitial}
                    >
                      {userInitial || <User className="h-5 w-5" strokeWidth={2} aria-hidden />}
                    </Badge>
                  </div>

                  <nav className="py-1" aria-label={t('userMenu.openUserMenu')}>
                    <Tooltip content={t('userMenu.comingSoon')} placement="top">
                      <span className="block w-full">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled
                          aria-disabled
                          aria-label={`${t('userMenu.myProfile')}: ${t('userMenu.comingSoon')}`}
                          className={`${menuNavBtnClass} cursor-not-allowed`}
                        >
                          <span className="flex w-full items-center gap-3">
                            <User className="h-4 w-4 shrink-0 text-blue-200" aria-hidden />
                            {t('userMenu.myProfile')}
                          </span>
                        </Button>
                      </span>
                    </Tooltip>
                    <Tooltip content={t('userMenu.comingSoon')} placement="top">
                      <span className="block w-full">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled
                          aria-disabled
                          aria-label={`${t('userMenu.settings')}: ${t('userMenu.comingSoon')}`}
                          className={`${menuNavBtnClass} cursor-not-allowed`}
                        >
                          <span className="flex w-full items-center gap-3">
                            <Settings className="h-4 w-4 shrink-0 text-blue-200" aria-hidden />
                            {t('userMenu.settings')}
                          </span>
                        </Button>
                      </span>
                    </Tooltip>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setMenuOpen(false);
                        setChangePasswordOpen(true);
                      }}
                      className={menuNavBtnClass}
                    >
                      <span className="flex w-full items-center gap-3">
                        <Lock className="h-4 w-4 shrink-0 text-blue-200" aria-hidden />
                        {t('userMenu.changePassword')}
                      </span>
                    </Button>
                  </nav>

                  <div className="border-t border-white/10 py-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className={`${menuNavBtnClass} !justify-between font-medium`}
                      onClick={() => setLangOpen((v) => !v)}
                      aria-expanded={langOpen}
                    >
                      <span className="flex w-full items-center justify-between gap-2">
                        <span className="flex items-center gap-3">
                          <Globe className="h-4 w-4 shrink-0 text-blue-200" aria-hidden />
                          {t('userMenu.language')}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-blue-200/90">
                          <span className="max-w-[5.5rem] truncate">{localeLabel}</span>
                          <ChevronDown
                            className={`h-4 w-4 shrink-0 transition-transform ${langOpen ? 'rotate-180' : ''}`}
                            aria-hidden
                          />
                        </span>
                      </span>
                    </Button>
                    {langOpen ? (
                      <div className="border-t border-white/5 bg-black/20 px-2 py-1" role="listbox">
                        {locales.map((code) => {
                          const label =
                            code === 'en'
                              ? t('language.english')
                              : code === 'mr'
                                ? t('language.marathi')
                                : t('language.hindi');
                          return (
                            <Button
                              key={code}
                              type="button"
                              variant="ghost"
                              size="sm"
                              role="option"
                              aria-selected={locale === code}
                              className={`h-auto w-full rounded-lg px-3 py-2 text-left text-xs !justify-start hover:bg-white/10 sm:text-sm ${
                                locale === code
                                  ? 'bg-white/10 font-medium !text-white'
                                  : '!text-blue-50/95'
                              }`}
                              onClick={() => pickLocale(code)}
                            >
                              <span className="block w-full truncate">{label}</span>
                            </Button>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex gap-3 border-t border-white/10 px-4 py-3">
                    <Router className="mt-0.5 h-4 w-4 shrink-0 text-blue-200" aria-hidden />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-blue-200/90">{t('userMenu.yourIp')}</p>
                      <p className="mt-0.5 break-all font-mono text-xs text-blue-50/90">
                        {ipDisplay}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-white/10 p-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto w-full rounded-xl px-3 py-2.5 !justify-start text-sm font-medium !text-orange-400 hover:!bg-orange-500/10 disabled:opacity-50"
                      disabled={isLogoutPending}
                      onClick={handleLogout}
                    >
                      <span className="flex w-full items-center gap-3">
                        {isLogoutPending ? (
                          <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                        ) : (
                          <LogOut className="h-4 w-4 shrink-0" aria-hidden />
                        )}
                        {t('userMenu.logout')}
                      </span>
                    </Button>
                  </div>
                </Card>
              </>
            ) : null}
          </div>
          </>
          )}
        </div>
      </div>

      <ChangePasswordModal
        isOpen={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
      />
    </header>
  );
}
