import type { InfoFieldProps, SectionCardProps } from '@/types/asset/municipal-Asset/asset-detail.types';
import React from 'react';
import { cn } from '@/lib/utils/cn';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common';

export function InfoField({ label, value, className, valueClassName }: InfoFieldProps): React.ReactElement {
  return (
    <div className={cn('grid grid-cols-[45%_55%] gap-1 mb-0.5 items-start', className)}>
      <span className="text-[10px] font-medium text-blue-700">
        {label}
      </span>
      <span className={cn('text-[11px] font-black text-blue-950 text-left', valueClassName)}>
        {value || '—'}
      </span>
    </div>
  );
}

/** Section wrapper card shared by all info panels */
export function SectionCard({ title, headerRight, children, className, titleIcon, iconBgClass }: SectionCardProps): React.ReactElement {
  return (
    <Card variant="default" padding="none" className={cn('border-slate-200 overflow-hidden shadow-sm h-full flex flex-col', className)}>
      {/* Section header */}
      <CardHeader className="mb-0 flex flex-row items-center justify-between px-2 py-1 border-b border-slate-100 bg-white space-y-0">
        <div className="flex items-center gap-1.5">
          {titleIcon && (
            <span className={cn("flex items-center justify-center w-5 h-5 rounded flex-shrink-0", iconBgClass || "border border-blue-200 text-blue-600 bg-blue-50/50")}>
              {titleIcon}
            </span>
          )}
          <CardTitle className="text-[12px] font-bold text-blue-800 leading-none">{title}</CardTitle>
        </div>
        {headerRight && <div className="flex-shrink-0">{headerRight}</div>}
      </CardHeader>
      {/* Content */}
      <CardContent className="px-2 py-1.5 flex-1">
        {children}
      </CardContent>
    </Card>
  );
}
