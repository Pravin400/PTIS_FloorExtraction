'use client';

import type { ReactNode } from 'react';
import { CheckCircle, Package, Shield } from 'lucide-react';
import { Button, Label, ToggleSwitch } from '@/components/common';
import { cn } from '@/lib/utils/cn';
import { formatExpiryDate, formatDurationText } from '@/lib/utils/ulb-configuration.utils';
import type { ULBDepartmentCardProps } from '@/types/ulbconfig-master.types';
import { UlbInput } from '../ULBFormField';

const COMPACT_LABEL =
  'mb-1 block truncate text-[9px] font-semibold uppercase leading-none tracking-wide text-slate-500';

function CardField({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('min-w-0 w-full', className)}>
      <Label className={COMPACT_LABEL}>{label}</Label>
      {children}
    </div>
  );
}

export function ULBDepartmentCard({ dept, t, onToggle, onDateChange }: ULBDepartmentCardProps) {
  const fieldClass = 'h-7 w-full min-w-0 border-slate-200 bg-white px-1.5 text-[10px] font-medium';

  return (
    <div
      className={cn(
        'group relative flex h-full min-w-[280px] flex-col rounded-lg border bg-white transition-all duration-300 focus-within:z-10',
        dept.enabled ? 'border-emerald-200 shadow-sm' : 'border-slate-200 hover:border-slate-300'
      )}
    >
      <div
        className={cn(
          'flex items-center justify-between rounded-t-lg border-b px-3 py-2.5',
          dept.enabled ? 'border-emerald-100 bg-emerald-50/60' : 'border-slate-100 bg-slate-50/60'
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div
            className={cn(
              'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md',
              dept.enabled
                ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-sm'
                : 'bg-slate-200 text-slate-400'
            )}
          >
            <Package className="h-3.5 w-3.5" />
          </div>
          <h4
            className={cn(
              'truncate text-xs font-semibold leading-tight',
              dept.enabled ? 'text-slate-800' : 'text-slate-500'
            )}
          >
            {dept.name}
          </h4>
        </div>
        <div className="flex-shrink-0 scale-[0.85]">
          <ToggleSwitch
            checked={dept.enabled}
            onChange={(checked) => onToggle(dept.id, checked)}
            showPopup={false}
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-center px-3 py-2.5">
        {dept.enabled ? (
          <div className="space-y-2">
            <div className="grid grid-cols-3 items-start gap-2">
              <CardField label={t('fields.startDate')}>
                <UlbInput
                  type="date"
                  value={dept.startDate}
                  onChange={(e) => onDateChange(dept.id, 'startDate', e.target.value)}
                  className={fieldClass}
                />
              </CardField>

              <CardField label={t('fields.licenseDuration')}>
                <UlbInput
                  type="text"
                  value={formatDurationText(dept.duration)}
                  readOnly
                  title={formatDurationText(dept.duration)}
                  className={cn(fieldClass, 'bg-slate-50/70 text-slate-500 cursor-default border-slate-200/60')}
                />
              </CardField>

              <CardField label={t('fields.endDate')}>
                <UlbInput
                  type="date"
                  value={dept.endDate}
                  onChange={(e) => onDateChange(dept.id, 'endDate', e.target.value)}
                  className={fieldClass}
                />
              </CardField>
            </div>

            <div className="flex items-center justify-between rounded-md border border-emerald-100 bg-emerald-50 px-2 py-1.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-medium text-emerald-600">{t('fields.expires')}:</span>
                <span className="text-[10px] font-bold text-slate-700">
                  {formatExpiryDate(dept.endDate)}
                </span>
              </div>
              <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-4">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 transition-colors group-hover:bg-emerald-50">
              <Shield className="h-5 w-5 text-slate-300 group-hover:text-emerald-400" />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggle(dept.id, true)}
              className="h-7 px-3 text-[10px] font-medium text-slate-400 hover:bg-emerald-50 hover:text-emerald-600"
            >
              {t('buttons.clickToActivate')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
