'use client';

import { createElement, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft, ChevronDown, ChevronRight } from 'lucide-react';
import { resolveIcon } from '@/lib/utils/icon-mapping';
import { locales } from '@/i18n/config';
import type { MenuItem } from '@/types/menu.types';
import { resolveDepartmentContext, isConfigurationSettingsItem } from '@/lib/utils/department-context';
import { SidebarFrame } from './SidebarFrame';

export interface SidebarProps {
  menuItems: MenuItem[];
  locale: string;
}

function withLocale(locale: string, href: string): string {
  if (!href || href === '#' || href.startsWith('http')) return href;
  const path = href.startsWith('/') ? href : `/${href}`;
  return `/${locale}${path}`;
}

/**
 * App sidebar: interactive and updates highlighting instantly on client-side routing.
 */
export function Sidebar({ menuItems, locale }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const localePattern = new RegExp(`^/(${locales.join('|')})`);
  const pathWithoutLocale = pathname.replace(localePattern, '') || '/';

  const t = useTranslations('common');

  const deptContext = useMemo(() => {
    return resolveDepartmentContext({
      pathname,
      searchParams,
      menuItems,
    });
  }, [pathname, searchParams, menuItems]);

  const isAssetRoute = pathname.includes('/assets');
  const isDarkTheme = isAssetRoute || pathname.includes('/property-tax/ptis');

  const filteredMenuItems = useMemo(() => {
    // 1. If viewing Configuration Settings, isolate configuration-settings screens
    if (deptContext.isConfigurationSettings) {
      return menuItems
        .map((item) => {
          if (item.subItems && item.subItems.length > 0) {
            const filteredSub = item.subItems.filter((sub) => isConfigurationSettingsItem(sub));
            if (filteredSub.length > 0) {
              return { ...item, subItems: filteredSub };
            }
            return null;
          }
          if (isConfigurationSettingsItem(item)) {
            return item;
          }
          return null;
        })
        .filter((item): item is MenuItem => item !== null);
    }

    // 2. Identity-driven filtering: match by active departmentId
    if (deptContext.departmentId != null) {
      const activeDeptId = deptContext.departmentId;
      return menuItems
        .map((item) => {
          // Categorically exclude configuration settings items/groups from business departments
          if (isConfigurationSettingsItem(item)) {
            return null;
          }

          if (item.subItems && item.subItems.length > 0) {
            const filteredSub = item.subItems.filter((sub) => {
              // Exclude configuration settings screens even if assigned this departmentId in DB
              if (isConfigurationSettingsItem(sub)) {
                return false;
              }
              if (sub.departmentId != null) {
                return sub.departmentId === activeDeptId;
              }
              if (item.departmentId != null) {
                return item.departmentId === activeDeptId;
              }
              return false;
            });

            if (filteredSub.length > 0) {
              return {
                ...item,
                subItems: filteredSub,
              };
            }
            return null;
          }

          // Standalone item: match departmentId and ensure it is not configuration settings
          if (item.departmentId != null && item.departmentId === activeDeptId) {
            return item;
          }

          return null;
        })
        .filter((item): item is MenuItem => item !== null);
    }

    // 3. Fallback: exclude configuration-settings from general department views
    return menuItems
      .filter((item) => !isConfigurationSettingsItem(item))
      .map((item) => {
        if (item.subItems && item.subItems.length > 0) {
          const filteredSub = item.subItems.filter((sub) => !isConfigurationSettingsItem(sub));
          return filteredSub.length > 0 ? { ...item, subItems: filteredSub } : null;
        }
        return item;
      })
      .filter((item): item is MenuItem => item !== null);
  }, [menuItems, deptContext]);

  const brandTitle = deptContext.departmentName || t('sidebar.brandTitle');
  const brandSubtitle = deptContext.isConfigurationSettings
    ? 'System Administration'
    : deptContext.departmentName
      ? deptContext.departmentName.toLowerCase().includes('department')
        ? deptContext.departmentName
        : `${deptContext.departmentName} Department`
      : t('sidebar.brandSubtitle');

  const allPaths: string[] = [];
  filteredMenuItems.forEach((item) => {
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

  return (
    <SidebarFrame openMenuLabel={t('sidebar.openMenu')} closeMenuLabel={t('sidebar.closeMenu')}>
      <div
        className={`px-3.5 py-4 flex items-center gap-2.5 border-b transition-all duration-300 ease-in-out sidebar-brand-row ${
          isDarkTheme ? 'border-slate-800 bg-[#0B132B]' : 'border-gray-100 bg-white/50'
        }`}
      >
        <div
          className={`p-2 rounded-xl shadow-md shrink-0 ${isDarkTheme ? 'bg-blue-600' : 'bg-[#4b70a6]'}`}
        >
          {createElement(resolveIcon(deptContext.departmentIcon, deptContext.departmentName), {
            className: 'h-6 w-6 text-white',
          })}
        </div>
        <div className="sidebar-expandable-label flex-1 flex flex-col transition-all duration-300 ease-in-out overflow-hidden min-w-0">
          <span
            className={`text-[16px] font-bold leading-tight truncate ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}
            title={brandTitle}
          >
            {brandTitle}
          </span>
          <span
            className={`text-[12px] font-medium leading-normal truncate ${isDarkTheme ? 'text-slate-400' : 'text-gray-500'}`}
            title={brandSubtitle}
          >
            {brandSubtitle}
          </span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-2 px-2 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full">
        <div className="space-y-2">
          {filteredMenuItems.map((item, idx) => {
            const itemPath = item.href.startsWith('/') ? item.href : `/${item.href}`;
            const active = isPathActive(itemPath);
            const hasSubItems = item.subItems && item.subItems.length > 0;

            const IconComponent = resolveIcon(item.iconName, item.name);

            const hasActiveChild =
              hasSubItems &&
              item.subItems!.some((sub) => {
                const sp = sub.href.startsWith('/') ? sub.href : `/${sub.href}`;
                return isPathActive(sp);
              });

            if (hasSubItems) {
              return (
                <details
                  key={`${item.name}-${item.href}-${idx}`}
                  className="group/sub"
                  open={hasActiveChild}
                >
                  <summary
                    className={`
                      list-none flex items-center gap-3 px-3 py-3 rounded-xl text-[16px] font-semibold transition-all duration-300 cursor-pointer
                      [&::-webkit-details-marker]:hidden
                      ${
                        hasActiveChild
                          ? isDarkTheme
                            ? 'bg-[#1D4ED8] text-white shadow-md font-bold'
                            : 'bg-gray-100 text-[#4b70a6]'
                          : isDarkTheme
                            ? 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                      }
                    `}
                  >
                    <IconComponent
                      className={`h-6 w-6 shrink-0 ${
                        hasActiveChild
                          ? isDarkTheme
                            ? 'text-white'
                            : 'text-[#4b70a6]'
                          : isDarkTheme
                            ? 'text-slate-400'
                            : 'text-gray-500'
                      }`}
                    />
                    <div className="sidebar-expandable-label flex-1 min-w-0 transition-all duration-300 ease-in-out overflow-hidden">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <span
                            className="block whitespace-nowrap text-[15px] font-medium leading-tight truncate"
                            title={item.name}
                          >
                            {item.name}
                          </span>
                          {item.nameHi && item.nameHi !== item.name && (
                            <span
                              className={`block whitespace-nowrap text-[11px] ${
                                hasActiveChild
                                  ? isDarkTheme
                                    ? 'text-white/80'
                                    : 'text-[#4b70a6]/80'
                                  : isDarkTheme
                                    ? 'text-slate-400'
                                    : 'text-gray-400'
                              }`}
                            >
                              {item.nameHi}
                            </span>
                          )}
                        </div>
                        <span
                          className={`${
                            hasActiveChild
                              ? isDarkTheme
                                ? 'text-white/80'
                                : 'text-[#4b70a6]'
                              : isDarkTheme
                                ? 'text-slate-400'
                                : 'text-gray-400'
                          } shrink-0 group-open/sub:hidden`}
                        >
                          <ChevronRight size={14} />
                        </span>
                        <span
                          className={`${
                            hasActiveChild
                              ? isDarkTheme
                                ? 'text-white/80'
                                : 'text-[#4b70a6]'
                              : isDarkTheme
                                ? 'text-slate-400'
                                : 'text-gray-400'
                          } shrink-0 hidden group-open/sub:inline`}
                        >
                          <ChevronDown size={14} />
                        </span>
                      </div>
                    </div>
                  </summary>
                  <div
                    className={`sidebar-expandable-label ml-5 border-l-2 pl-2 space-y-1 my-1 max-h-60 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full ${
                      isDarkTheme ? 'border-slate-700/80' : 'border-gray-200'
                    }`}
                  >
                    {item.subItems!.map((sub, sIdx) => {
                      const subPath = sub.href.startsWith('/') ? sub.href : `/${sub.href}`;
                      const subActive = isPathActive(subPath);
                      return (
                        <Link
                          key={`${sub.name}-${sub.href}-${sIdx}`}
                          href={withLocale(locale, sub.href)}
                          className={`block px-3 py-1.5 rounded-lg text-[14px] font-medium transition-colors duration-200 ${
                            subActive
                              ? isDarkTheme
                                ? 'bg-blue-600/30 text-white font-semibold border-l-2 border-blue-400'
                                : 'bg-[#4b70a6]/10 text-[#4b70a6] font-semibold'
                              : isDarkTheme
                                ? `hover:bg-slate-800/60 ${sub.className || 'text-slate-300 hover:text-white'}`
                                : `hover:bg-gray-50 ${sub.className || 'text-gray-600'}`
                          }`}
                        >
                          {sub.name}
                        </Link>
                      );
                    })}
                  </div>
                </details>
              );
            }

            return (
              <div key={`${item.name}-${item.href}-${idx}`}>
                <Link
                  href={withLocale(locale, item.href)}
                  className={`
                    flex items-center gap-3 px-3 py-3 rounded-xl text-[16px] font-semibold transition-all duration-300
                    ${
                      active
                        ? isDarkTheme
                          ? 'bg-[#1D4ED8] text-white shadow-md font-bold'
                          : 'bg-gradient-to-r from-[#4b70a6] to-[#5a82b8] text-white shadow-md font-bold'
                        : isDarkTheme
                          ? 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  <IconComponent
                    className={`h-6 w-6 shrink-0 ${active ? 'text-white' : isDarkTheme ? 'text-slate-400' : 'text-gray-500'}`}
                  />
                  <div className="sidebar-expandable-label flex-1 min-w-0 transition-all duration-300 ease-in-out overflow-hidden">
                    <span
                      className="block whitespace-nowrap text-[15px] font-medium leading-tight truncate"
                      title={item.name}
                    >
                      {item.name}
                    </span>
                    {item.nameHi && item.nameHi !== item.name && (
                      <span
                        className={`block whitespace-nowrap text-[11px] ${active ? 'text-white/70' : isDarkTheme ? 'text-slate-400' : 'text-gray-400'}`}
                      >
                        {item.nameHi}
                      </span>
                    )}
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </nav>

      <div className="px-2 mt-auto mb-2">
        <Link
          href={withLocale(locale, '/home')}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-[15px] font-semibold transition-all duration-300 border shadow-md hover:shadow-lg hover:-translate-y-0.5 ${
            isDarkTheme
              ? 'bg-slate-800/80 hover:bg-slate-700 text-white border-slate-700/80'
              : 'bg-gradient-to-r from-[#4b70a6] to-[#3d5a8a] hover:from-[#3d5a8a] hover:to-[#2e466e] text-white border-white/20'
          }`}
        >
          <ArrowLeft className="h-5 w-5 shrink-0 sidebar-back-icon" />
          <div className="sidebar-expandable-label flex flex-col items-start transition-all duration-300 ease-in-out overflow-hidden min-w-0">
            <span className="block whitespace-nowrap leading-tight">
              {t('sidebar.backToDashboard')}
            </span>
            <span className="block whitespace-nowrap text-[11px] text-blue-100 font-normal">
              {t('sidebar.backToDashboardSecondary')}
            </span>
          </div>
        </Link>
      </div>
    </SidebarFrame>
  );
}
