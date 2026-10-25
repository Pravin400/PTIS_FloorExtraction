'use client';

/**
 * GrievanceHeader
 * Composes directly on top of common Header with dedicated civic slots.
 * Strictly under 200 lines.
 */

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import {
  Home, Globe, LogIn, User, Activity, LogOut, ChevronDown, LayoutGrid,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { CitizenAuthModal } from '@/components/modules/grievance/citizen/CitizenAuthModal';
import { useAuth } from '@/hooks/grievance/shared';
import { switchLocale, localeNames, type Locale } from '@/i18n/config';

const NEXT_LOCALE_MAP: Record<Locale, Locale> = {
  en: 'mr',
  mr: 'hi',
  hi: 'en',
};

export function GrievanceHeader() {
  const t = useTranslations('grievance');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname() || '';
  const auth = useAuth();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const isCitizenLoggedIn = Boolean(auth.isAuthenticated && auth.user?.role === 'CITIZEN');
  const isAdminLoggedIn = Boolean(
    auth.isAuthenticated &&
    (auth.user?.role === 'ADMIN' || auth.user?.role === 'STAFF' || auth.user?.role === 'ENGINEER')
  );
  const citizenName = auth.user?.name || auth.user?.mobile || t('citizenUser');
  const adminName = auth.user?.name || auth.user?.username || t('adminRoleBadge');

  const homeHref = isAdminLoggedIn
    ? `/${locale}/home`
    : `/${locale}/grievance/dashboard`;

  const isHome =
    pathname === `/${locale}/grievance/dashboard` ||
    pathname === `/${locale}/grievance` ||
    pathname === `/${locale}/grievance/` ||
    pathname === '/grievance' ||
    (isAdminLoggedIn && (pathname === `/${locale}/home` || pathname === `/${locale}/home/`));

  const leftBrandingSlot = (
    <Link
      href={homeHref}
      className="flex min-w-0 items-center gap-2 sm:gap-3 md:gap-3.5 self-center shrink-0 hover:opacity-95 transition-opacity"
      title={t('portalBadge')}
    >
      <div className="relative flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center md:h-12 md:w-12">
        <div className="relative h-full w-full overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center text-white font-black text-xs md:text-sm shadow-xs border border-emerald-500/30">
          AMC
        </div>
      </div>
      <div className="min-w-0 leading-tight">
        <h1 className="truncate text-xs sm:text-sm md:text-base font-black text-slate-900 tracking-tight">
          <span className="md:hidden">{t('headerTitleShort')}</span>
          <span className="hidden md:inline">{t('headerTitleFull')}</span>
        </h1>
        <p className="mt-0.5 truncate text-[9px] sm:text-xs text-emerald-700 font-bold flex items-center gap-1 sm:gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
          <span className="md:hidden">{t('headerGrievanceCell')}</span>
          <span className="hidden md:inline">{tCommon('app.grievanceDepartment')}</span>
        </p>
      </div>
    </Link>
  );

  const actionsSlot = (
    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
      {/* 1. Home Button (Desktop only; on mobile, PWA bottom nav has Home) */}
      <Link
        href={homeHref}
        id="header-grievance-home-btn"
        className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shrink-0 cursor-pointer shadow-2xs ${isHome
          ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
          }`}
        title={t('home')}
      >
        <Home className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>{t('home')}</span>
      </Link>

      {/* 2. Language Switcher — cycles en → mr → hi → en */}
      <button
        type="button"
        onClick={() => {
          const nextLocale: Locale = NEXT_LOCALE_MAP[locale as Locale] || 'en';
          switchLocale(nextLocale, pathname, router);
        }}
        className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors shrink-0 cursor-pointer shadow-2xs"
        title={tCommon('language.select')}
      >
        <Globe className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        <span>{localeNames[locale as Locale] || localeNames.en}</span>
      </button>

      {/* 4. Municipal Officer / Admin Profile Menu */}
      {isAdminLoggedIn ? (
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsProfileMenuOpen((prev) => !prev)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100/70 text-slate-900 transition-colors cursor-pointer"
          >
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              <User className="w-4 h-4" />
            </div>
            <div className="hidden sm:flex flex-col text-left leading-tight">
              <span className="text-xs font-bold truncate max-w-[120px] text-blue-950">{adminName}</span>
              <span className="text-[10px] text-blue-700 font-bold">{t('adminRoleBadge')}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-blue-500" />
          </button>

          {isProfileMenuOpen && (
            <>
              <div className="fixed inset-0 z-50" onClick={() => setIsProfileMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1.5 w-60 rounded-2xl bg-white border border-slate-200 p-1.5 shadow-xl z-50 text-slate-800 animate-in fade-in zoom-in-95">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900 truncate">{adminName}</p>
                  <p className="text-[11px] text-blue-600 font-semibold">{t('adminRoleBadge')}</p>
                </div>
                <Link
                  href={`/${locale}/grievance/workbench`}
                  onClick={() => setIsProfileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors text-slate-700"
                >
                  <LayoutGrid className="w-4 h-4 text-emerald-600" />
                  <span>{t('navWorkbench')}</span>
                </Link>
                <Link
                  href={`/${locale}/grievance/complaints`}
                  onClick={() => setIsProfileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors text-slate-700"
                >
                  <Activity className="w-4 h-4 text-blue-600" />
                  <span>{t('navAllComplaints')}</span>
                </Link>
                <Link
                  href={`/${locale}/grievance/department-master`}
                  onClick={() => setIsProfileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors text-slate-700"
                >
                  <User className="w-4 h-4 text-blue-600" />
                  <span>{t('navDepartmentMaster')}</span>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    void auth.logout().then(() => {
                      router.push(`/${locale}/grievance/dashboard`);
                    });
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t('logout')}</span>
                </button>
              </div>
            </>
          )}
        </div>
      ) : isCitizenLoggedIn ? (
        /* 5. Citizen Profile Menu */
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsProfileMenuOpen((prev) => !prev)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-900 transition-colors cursor-pointer"
          >
            <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
              <User className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="hidden sm:flex flex-col text-left leading-tight">
              <span className="text-xs font-bold truncate max-w-[120px]">{citizenName}</span>
              <span className="text-[10px] text-emerald-600 font-semibold">{t('verifiedCitizen')}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isProfileMenuOpen && (
            <>
              <div className="fixed inset-0 z-50" onClick={() => setIsProfileMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1.5 w-56 rounded-2xl bg-white border border-slate-200 p-1.5 shadow-xl z-50 text-slate-800 animate-in fade-in zoom-in-95">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900 truncate">{citizenName}</p>
                  <p className="text-[11px] text-emerald-600 font-medium">
                    {auth.user?.mobile ? `+91 ${auth.user.mobile}` : ''}
                  </p>
                </div>
                <Link
                  href={`/${locale}/grievance/track`}
                  onClick={() => setIsProfileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors text-slate-700"
                >
                  <Activity className="w-4 h-4 text-emerald-600" />
                  <span>{t('myComplaints')}</span>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    void auth.logout();
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t('logout')}</span>
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        /* 6. Unauthenticated Login Button */
        <button
          type="button"
          id="header-citizen-login-btn"
          onClick={() => setIsAuthModalOpen(true)}
          className="h-8 sm:h-9 px-2.5 sm:px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs sm:text-sm shadow-sm hover:shadow transition-all duration-200 inline-flex items-center gap-1.5 sm:gap-2 border border-emerald-500/40 shrink-0 cursor-pointer whitespace-nowrap"
          title={`${t('citizenLogin')} / ${t('citizenRegistration')}`}
        >
          <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-white" />
          <span className="text-xs font-bold">{t('citizenLogin')}</span>
        </button>
      )}
    </div>
  );

  return (
    <>
      <Header
        variant="civic"
        leftSlot={leftBrandingSlot}
        actionsSlot={actionsSlot}
      />

      <CitizenAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onVerified={() => {
          setIsAuthModalOpen(false);
        }}
        purpose="LOGIN"
        moduleCode="GRV"
      />
    </>
  );
}
