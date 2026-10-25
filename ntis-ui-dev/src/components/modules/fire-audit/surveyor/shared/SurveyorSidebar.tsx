'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Home, ClipboardCheck, History, ArrowLeft } from 'lucide-react';
import { Card } from '@/components/common/Card';

export interface SurveyorSidebarProps {
  officerName?: string;
  badgeId?: string;
  role?: string;
}

export function SurveyorSidebar({
  officerName = '',
  badgeId = '',
  role = '',
}: SurveyorSidebarProps = {}) {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations('fireAuditSurveyor.sidebar');

  const initials = (officerName || 'FA')
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const menuItems = [
    {
      key: 'home',
      label: t('home'),
      href: `/${locale}/fire-audit/surveyor`,
      icon: Home,
      isActive:
        pathname === `/${locale}/fire-audit/surveyor` ||
        pathname === `/fire-audit/surveyor`,
    },
    {
      key: 'inspections',
      label: t('inspections'),
      href: `/${locale}/fire-audit/surveyor/inspections`,
      icon: ClipboardCheck,
      isActive:
        pathname.startsWith(`/${locale}/fire-audit/surveyor/inspections`) ||
        pathname.startsWith('/fire-audit/surveyor/inspections'),
    },
    {
      key: 'history',
      label: t('history'),
      href: `/${locale}/fire-audit/surveyor/history`,
      icon: History,
      isActive:
        pathname.startsWith(`/${locale}/fire-audit/surveyor/history`) ||
        pathname.startsWith('/fire-audit/surveyor/history'),
    },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 lg:w-72 h-full bg-[#E8EEF5] text-slate-800 border-r border-slate-300 shadow-[4px_0_16px_rgba(15,23,42,0.06)] shrink-0 select-none p-5 justify-between overflow-y-auto">
      <div className="space-y-4">
        <Card
          variant="default"
          padding="none"
          className="p-2.5 border border-slate-200/90 text-slate-900 rounded-2xl bg-white shadow-[3px_3px_10px_rgba(15,23,42,0.06),-2px_-2px_8px_rgba(255,255,255,0.90)] hover:border-slate-400/80 hover:shadow-[4px_4px_14px_rgba(15,23,42,0.10),-3px_-3px_10px_rgba(255,255,255,0.98)] hover:-translate-y-0.5 active:scale-[0.99] active:translate-y-0 transition-all duration-200 cursor-pointer group select-none"
        >
          <div className="flex items-center gap-3">
            <div className="w-8.5 h-8.5 rounded-xl flex items-center justify-center font-bold text-xs bg-slate-200/65 border border-slate-300/80 shadow-[inset_2px_2px_4px_rgba(15,23,42,0.07),inset_-1.5px_-1.5px_3px_rgba(255,255,255,0.90)] text-slate-900 group-hover:scale-105 group-hover:bg-slate-200 group-hover:border-slate-400/80 transition-all duration-200 shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-black text-slate-900 group-hover:text-orange-600 truncate block leading-tight transition-colors duration-200">
                {officerName || t('profile')}
              </span>
              <p className="text-[11px] font-mono font-bold text-slate-700 group-hover:text-slate-900 truncate mt-0.5 tracking-tight transition-colors duration-200">
                {badgeId && role ? `${badgeId} • ${role}` : badgeId || role || t('profile')}
              </p>
            </div>
          </div>
        </Card>

        <div>
          <div className="px-3 pb-2 text-slate-700 font-bold tracking-normal text-xs">
            {t('menuTitle')}
          </div>
          <nav className="space-y-1.5" aria-label="Survey navigation">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`relative flex items-center justify-between px-3 py-2.5 rounded-2xl group select-none transition-all duration-200 focus:outline-none hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] ${item.isActive ? 'z-10' : 'z-0 cursor-pointer'}`}
                >
                  {item.isActive ? (
                    <>
                      <div
                        aria-hidden="true"
                        className="absolute inset-0 rounded-2xl pointer-events-none bg-linear-to-br from-white to-orange-50/70 border-[1.5px] border-orange-200/90 shadow-[4px_4px_12px_rgba(15,23,42,0.08),-2px_-2px_8px_rgba(255,255,255,0.98),inset_0_1.5px_2px_#FFFFFF]"
                      />
                      <div
                        aria-hidden="true"
                        className="absolute left-1.5 top-2.5 bottom-2.5 w-1 rounded-full bg-linear-to-b from-orange-500 to-orange-600 shadow-[0_0_8px_rgba(234,88,12,0.7)] z-20 pointer-events-none"
                      />
                    </>
                  ) : (
                    <>
                      <div
                        aria-hidden="true"
                        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none bg-white/95 border border-slate-300/80 shadow-[2px_2px_8px_rgba(152,168,191,0.35),-1.5px_-1.5px_5px_#FFFFFF]"
                      />
                      <div
                        aria-hidden="true"
                        className="absolute left-1.5 top-3 bottom-3 w-1 rounded-full bg-linear-to-b from-orange-400 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                      />
                    </>
                  )}

                  <div className="relative z-10 flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 shrink-0 ${item.isActive
                          ? 'bg-linear-to-tr from-orange-600 to-amber-500 text-white shadow-[0_3px_8px_rgba(234,88,12,0.38),inset_0_1.5px_2px_rgba(255,255,255,0.6)]'
                          : 'text-slate-600 group-hover:text-orange-600 group-hover:scale-110 group-hover:bg-white group-hover:shadow-[1.5px_1.5px_4px_rgba(152,168,191,0.30),-1px_-1px_3px_#FFFFFF]'
                        }`}
                    >
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <span
                      className={`text-sm truncate transition-all duration-200 font-devanagari leading-normal ${item.isActive
                          ? 'text-slate-900 font-bold'
                          : 'text-slate-800 group-hover:text-slate-900 group-hover:translate-x-0.5 font-medium'
                        }`}
                    >
                      {item.label}
                    </span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-300/80">
        <Link
          href={`/${locale}/home`}
          className="w-full py-2.5 px-3 rounded-xl bg-white border border-slate-300 shadow-[2px_2px_5px_rgba(15,23,42,0.06),-1.5px_-1.5px_4px_rgba(255,255,255,0.90)] hover:border-slate-400 hover:shadow-[3px_3px_8px_rgba(15,23,42,0.08)] active:translate-y-px active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.12)] flex items-center justify-center gap-2 text-sm font-bold text-slate-800 transition-all cursor-pointer group font-devanagari leading-normal"
        >
          <ArrowLeft className="w-4.5 h-4.5 text-slate-700 group-hover:-translate-x-0.5 transition-transform shrink-0" />
          <span>{t('backToDashboard')}</span>
        </Link>
      </div>
    </aside>
  );
}
