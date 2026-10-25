'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import {
  Camera,
  LayoutDashboard,
  Activity,
  Briefcase,
  ChevronRight,
  ClipboardList,
  LayoutGrid,
  MapPin,
  Zap,
} from 'lucide-react';
import { useTicketCount, useAuth } from '@/hooks/grievance/shared';
import { formatLocalizedNumber } from '@/lib/utils/grievance';

export interface GrievanceSidebarProps {
  onSnapReportClick?: () => void;
  onNavigateTab?: (tab: string) => void;
  activeTab?: string;
  className?: string;
}

export function GrievanceSidebar({
  onSnapReportClick,
  onNavigateTab,
  activeTab,
  className = '',
}: GrievanceSidebarProps) {
  const t = useTranslations('grievance');
  const locale = useLocale();
  const pathname = usePathname() || '';
  const ticketCount = useTicketCount();
  const localizedTicketCount = formatLocalizedNumber(ticketCount, locale);
  const { user } = useAuth();
  const isAdmin =
    user?.role?.toLowerCase() === 'admin' ||
    user?.role?.toLowerCase() === 'staff' ||
    pathname.includes('/grievance/department-master') ||
    pathname.includes('/grievance/complaints') ||
    pathname.includes('/grievance/workbench') ||
    pathname.includes('/grievance/on-the-go');

  const citizenNavItems = [
    {
      id: 'dashboard',
      label: t('navHome'),
      icon: LayoutDashboard,
      badge: null,
      href: `/${locale}/grievance/dashboard`,
    },
    {
      id: 'gis-map',
      label: 'GIS Map',
      icon: MapPin,
      badge: { text: 'Live', color: 'bg-emerald-100 text-emerald-800' },
      href: `/${locale}/grievance/gis`,
    },
    {
      id: 'tracker',
      label: t('navTracker'),
      icon: Activity,
      badge: ticketCount > 0 ? { text: localizedTicketCount, color: 'bg-slate-100 text-slate-700 font-bold' } : null,
      href: `/${locale}/grievance/track`,
    },
  ];

  const adminNavItems = [
    {
      id: 'dashboard',
      label: t('navDashboard'),
      icon: LayoutDashboard,
      badge: null,
      href: `/${locale}/grievance/dashboard`,
    },
    {
      id: 'gis-map',
      label: 'GIS Map',
      icon: MapPin,
      badge: { text: 'Live', color: 'bg-blue-100 text-blue-800' },
      href: `/${locale}/grievance/gis`,
    },
    {
      id: 'department-master',
      label: t('navDepartments'),
      icon: Briefcase,
      badge: null,
      href: `/${locale}/grievance/department-master`,
    },
    {
      id: 'complaints',
      label: t('navAllComplaints'),
      icon: ClipboardList,
      badge: null,
      href: `/${locale}/grievance/complaints`,
    },
    {
      id: 'workbench',
      label: t('navWorkbench'),
      icon: LayoutGrid,
      badge: null,
      href: `/${locale}/grievance/workbench`,
    },
    {
      id: 'on-the-go',
      label: t('navOnTheGo'),
      icon: Zap,
      badge: null,
      href: `/${locale}/grievance/on-the-go`,
    },
  ];

  const navItems = isAdmin ? adminNavItems : citizenNavItems;

  return (
    <aside
      className={`w-64 shrink-0 bg-white border-r border-slate-200 flex flex-col justify-between p-4 h-full select-none ${className}`}
    >
      {/* Top Section: CTA + Navigation */}
      <div className="space-y-4">
        {/* Primary Action Button: Tactile Circular Camera Shutter Button (Citizen Only) */}
        {!isAdmin && (
          <Link
            href={`/${locale}/grievance/raise`}
            onClick={(e) => {
              if (onSnapReportClick) {
                e.preventDefault();
                onSnapReportClick();
              }
            }}
            className="group relative flex flex-col items-center justify-center gap-1.5 py-1 text-center cursor-pointer no-underline select-none"
          >
            {/* Concentric Outer Ring + Shutter Button */}
            <div className="relative flex items-center justify-center">
              {/* Outer Glowing / Pulse Ring on Hover */}
              <div className="absolute -inset-1.5 rounded-full bg-emerald-400/20 opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300 blur-xs" />

              {/* Brushed Metal / Clean Border Ring */}
              <div className="relative flex items-center justify-center w-14 h-14 rounded-full p-[3px] bg-gradient-to-b from-slate-200 via-slate-100 to-slate-300 shadow-md group-hover:shadow-lg group-hover:shadow-emerald-900/10 group-active:scale-95 transition-all duration-200">
                {/* Main Shutter Disc */}
                <div className="w-full h-full rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-inner group-hover:from-emerald-500 group-hover:to-teal-400 transition-colors">
                  <Camera className="w-6 h-6 text-white drop-shadow-xs transition-transform duration-200 group-hover:scale-110" />
                </div>
              </div>
            </div>

            {/* Micro Typography Header + Subheader */}
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold text-slate-800 tracking-tight group-hover:text-emerald-700 transition-colors">
                {t('snapAndReport')}
              </span>
              <span className="text-[10px] text-slate-600 font-medium tracking-tight">
                {t('reportGrievance')}
              </span>
            </div>
          </Link>
        )}

        {/* Navigation List */}
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2">
            {isAdmin ? t('adminNavHeader') : t('navHeader')}
          </span>
          <nav className="space-y-1 mt-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                (activeTab ? activeTab === item.id : false) ||
                (item.id === 'dashboard' && pathname.includes('/grievance/dashboard')) ||
                (item.id === 'gis-map' && pathname.includes('/grievance/gis')) ||
                (item.id === 'tracker' && pathname.includes('/grievance/track')) ||
                (item.id === 'department-master' && pathname.includes('/grievance/department-master')) ||
                (item.id === 'complaints' && pathname.includes('/grievance/complaints')) ||
                (item.id === 'workbench' && pathname.includes('/grievance/workbench')) ||
                (item.id === 'on-the-go' && pathname.includes('/grievance/on-the-go'));
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => onNavigateTab?.(item.id)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 shadow-sm border border-emerald-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-700' : 'text-slate-400'}`} />
                    <span className="truncate" suppressHydrationWarning>{item.label}</span>
                  </div>

                  {item.badge ? (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${item.badge.color}`} suppressHydrationWarning>
                      {item.badge.text}
                    </span>
                  ) : isActive ? (
                    <ChevronRight className="w-3.5 h-3.5 text-emerald-700" />
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </aside>
  );
}
