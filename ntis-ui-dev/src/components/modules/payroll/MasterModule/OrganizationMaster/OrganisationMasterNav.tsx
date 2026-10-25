'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Badge, Card, TruncatedText } from '@/components/common';
import {
  Building2,
  Award,
  Layers,
  UserCheck,
  Briefcase,
  Landmark,
  Calendar,
  Building,
  FileText,
  GraduationCap,
  ChevronRight,
} from 'lucide-react';

export interface NavCardItem {
  id: string;
  slug: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  isAvailable?: boolean;
}

export const MASTER_NAV_ITEMS: NavCardItem[] = [
  { id: 'Departments', slug: 'department-master', icon: Building2, iconBg: 'bg-blue-50', iconColor: 'text-blue-600', isAvailable: true },
  { id: 'Designations', slug: 'designation-master', icon: Award, iconBg: 'bg-purple-50', iconColor: 'text-purple-600', isAvailable: true },
  { id: 'EmpClasses', slug: 'emp-class-master', icon: Layers, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', isAvailable: true },
  { id: 'EmpStatuses', slug: 'emp-status-master', icon: UserCheck, iconBg: 'bg-amber-50', iconColor: 'text-amber-600', isAvailable: true },
  { id: 'EmpTypes', slug: 'emp-type-master', icon: Briefcase, iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600', isAvailable: true },
  { id: 'Qualifications', slug: 'qualification-master', icon: GraduationCap, iconBg: 'bg-violet-50', iconColor: 'text-violet-600', isAvailable: true },
  { id: 'ZoneDivisions', slug: 'zone-division-master', icon: Landmark, iconBg: 'bg-rose-50', iconColor: 'text-rose-600', isAvailable: true },
  { id: 'Years', slug: 'year-master', icon: Calendar, iconBg: 'bg-teal-50', iconColor: 'text-teal-600', isAvailable: false },
  { id: 'Banks', slug: 'bank-master', icon: Building, iconBg: 'bg-cyan-50', iconColor: 'text-cyan-600', isAvailable: false },
  { id: 'GRs', slug: 'gr-master', icon: FileText, iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600', isAvailable: false },
];

export function OrganisationMasterNav({ locale }: { locale: string }): React.ReactElement {
  const pathname = usePathname();
  const tNav = useTranslations('payrollOrganisationMastersNav');

  return (
    <aside className="w-full lg:w-64 xl:w-72 shrink-0 bg-white border border-slate-200 rounded-2xl p-2.5 shadow-2xs flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between px-2 py-1.5 mb-1 shrink-0">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          {tNav('header')}
        </span>
        <Badge variant="secondary" size="sm" className="font-semibold text-slate-500 bg-slate-100 h-5 px-1.5 text-[10px]">
          {MASTER_NAV_ITEMS.length}
        </Badge>
      </div>
      <div className="flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-x-visible pb-1 lg:pb-0 scrollbar-none flex-1 lg:justify-between">
        {MASTER_NAV_ITEMS.map(({ id, slug, icon: Icon, iconBg, iconColor, isAvailable }) => {
          const title = tNav(`${id}.title`);
          const subtitle = tNav(`${id}.subtitle`);

          if (!isAvailable) {
            return (
              <div
                key={id}
                aria-disabled="true"
                className="block w-[180px] sm:w-[220px] lg:w-full shrink-0 select-none flex-1 lg:flex-initial"
              >
                <Card
                  padding="none"
                  className="rounded-xl border border-slate-200/60 bg-slate-50/50 px-3 py-2 flex items-center justify-between gap-2.5 min-h-[46px] w-full opacity-60 cursor-not-allowed"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconBg} ${iconColor} opacity-75`}>
                      <Icon size={15} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-slate-600 leading-snug">
                        <TruncatedText text={title} maxLength={20} placement="right" />
                      </div>
                      <div className="text-[11px] font-normal text-slate-400 leading-snug">
                        <TruncatedText text={subtitle} maxLength={22} placement="right" />
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    size="sm"
                    className="text-[10px] font-medium text-slate-500 bg-slate-200/70 border-0 shrink-0 h-5 px-1.5"
                  >
                    {tNav('comingSoon')}
                  </Badge>
                </Card>
              </div>
            );
          }

          const href = `/${locale}/payroll/organisation-masters/${slug}`;
          const isActive = pathname.includes(slug) || (slug === 'department-master' && pathname.endsWith('/organisation-masters'));

          return (
            <Link key={id} href={href} className="block w-[180px] sm:w-[220px] lg:w-full shrink-0 flex-1 lg:flex-initial">
              <Card
                padding="none"
                className={`group cursor-pointer rounded-xl border px-3 py-2 transition-all duration-200 flex items-center justify-between gap-2.5 min-h-[46px] w-full ${
                  isActive
                    ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-xs bg-gradient-to-r from-blue-50/60 via-white to-white'
                    : 'border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-xs hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs'
                        : `${iconBg} ${iconColor} group-hover:scale-105`
                    }`}
                  >
                    <Icon size={15} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div
                      className={`text-xs font-bold leading-snug transition-colors ${
                        isActive ? 'text-blue-700' : 'text-slate-800 group-hover:text-blue-600'
                      }`}
                    >
                      <TruncatedText text={title} maxLength={20} placement="right" className="cursor-pointer" />
                    </div>
                    <div
                      className={`text-[11px] font-medium leading-snug transition-colors ${
                        isActive ? 'text-blue-600/90 font-semibold' : 'text-slate-500'
                      }`}
                    >
                      <TruncatedText text={subtitle} maxLength={22} placement="right" className="cursor-pointer" />
                    </div>
                  </div>
                </div>

                <ChevronRight
                  size={14}
                  className={`shrink-0 transition-all duration-200 ${
                    isActive
                      ? 'text-blue-600 translate-x-0.5'
                      : 'text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5'
                  }`}
                />
              </Card>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
