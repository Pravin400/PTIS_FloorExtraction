'use client';

import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import type { MunicipalDepartment } from '@/types/grievance';

interface DepartmentCardProps {
  dept: MunicipalDepartment;
  theme: { icon: string; bg: string };
  onSelect?: (dept: MunicipalDepartment) => void;
  onToggle?: () => void;
  className?: string;
}

export function DepartmentCard({ dept, theme, onSelect, onToggle, className = '' }: DepartmentCardProps) {
  const t = useTranslations('grievance');
  const displayName = dept.nameEn;

  const handleClick = () => {
    if (onSelect) {
      onSelect(dept);
    } else if (onToggle) {
      onToggle();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      className={`group relative bg-white rounded-lg border border-slate-200/90 hover:border-emerald-400 shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_12px_-2px_rgba(16,185,129,0.12)] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-150 ease-out cursor-pointer overflow-hidden flex flex-col justify-between p-2 pt-2.5 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 ${className}`}
    >
      {/* Top Accent bar on hover */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-transparent group-hover:bg-gradient-to-r group-hover:from-emerald-500 group-hover:via-teal-400 group-hover:to-emerald-500 transition-all duration-200" />

      {/* 1. Header & Title: Logo + Department Heading */}
      <div className="flex items-center gap-2.5 min-w-0 mb-1">
        <div className="shrink-0">
          <div
            className={`w-7 h-7 rounded-md flex items-center justify-center text-xs shadow-2xs border group-hover:scale-105 transition-transform duration-150 ${theme.bg}`}
          >
            <span className="select-none">{dept.icon || theme.icon}</span>
          </div>
        </div>
        <h3 className="text-[11px] font-bold text-slate-800 group-hover:text-emerald-700 leading-tight line-clamp-2 transition-colors flex-1 min-w-0 min-h-[1.65rem] flex items-center">
          {displayName}
        </h3>
      </div>

      {/* 2. Footer: Direct Action Button */}
      <div className="flex items-center justify-end pt-1 border-t border-slate-100 text-[9px]">
        <span className="inline-flex items-center gap-1 font-bold text-emerald-700 group-hover:text-emerald-800 transition-colors">
          <span>{t('reportIssueDirect')}</span>
          <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
        </span>
      </div>
    </div>
  );
}
