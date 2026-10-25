'use client';

import { useState } from 'react';
import { CheckCircle, ChevronDown, ChevronLeft, Package } from 'lucide-react';
import { Button, SaveButton, Badge, SearchInput } from '@/components/common';
import type { ULBDepartmentLicenseTabProps } from '@/types/ulbconfig-master.types';
import { ULBDepartmentCard } from '../parts/ULBDepartmentCard';

const INITIAL_VISIBLE = 10;

export function ULBDepartmentLicenseTab({
  t,
  filtered,
  totalCount,
  activeCount,
  searchQuery,
  onSearchChange,
  master,
  onToggle,
  onDateChange,
  onEnableAll,
  onDisableAll,
  onPrevious,
  onSaveProgress,
  onFinalize,
  isSaving,
  isLoadingDepartments,
  footerClassName,
}: ULBDepartmentLicenseTabProps) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const pending = totalCount - activeCount;

  return (
    <>
      <div className="mb-3 flex-shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="h-1.5 bg-gradient-to-r from-teal-500 via-emerald-500 to-green-500" />
        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 text-white">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-tight text-slate-800">
                {t('sections.departmentActivation')}
              </h3>
              <p className="text-xs text-slate-500">{t('sections.departmentActivationHint')}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge className="gap-2 border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              {t('status.availableCount', { count: totalCount })}
            </Badge>
            <Badge className="gap-2 border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
              {t('status.activeCount', { count: activeCount })}
            </Badge>
            <Badge className="gap-2 border-amber-100 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              {t('status.pendingCount', { count: pending })}
            </Badge>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-4 py-2">
          <SearchInput
            placeholder={t('fields.filterModules')}
            value={searchQuery}
            onChange={onSearchChange}
            className="mb-0 w-full max-w-xs"
          />
          <div className="flex items-center gap-2">

            <Button
              variant="ghost"
              size="sm"
              onClick={onEnableAll}
              className="h-8 rounded-lg px-3 text-xs font-bold text-emerald-600 hover:bg-emerald-50"
            >
              {t('buttons.enableAll')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDisableAll}
              className="h-8 rounded-lg px-3 text-xs font-bold text-rose-600 hover:bg-rose-50"
            >
              {t('buttons.disableAll')}
            </Button>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1 pb-16">
        {isLoadingDepartments ? (
          <div className="flex min-h-[240px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center">
            <Package className="mb-3 h-8 w-8 animate-pulse text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">{t('messages.loading')}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex min-h-[240px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center">
            <Package className="mb-3 h-8 w-8 text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">{t('messages.noDepartments')}</p>
            <p className="mt-1 max-w-sm text-xs text-slate-500">{t('messages.noDepartmentsHint')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.slice(0, visibleCount).map((dept) => (
              <ULBDepartmentCard
                key={dept.id}
                dept={dept}
                t={t}
                onToggle={(id, enabled) => onToggle(id, enabled, master)}
                onDateChange={onDateChange}
              />
            ))}

            {filtered.length > visibleCount && (
              <div className="col-span-full flex justify-center py-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setVisibleCount(filtered.length)}
                  className="gap-1.5 text-[10px] font-bold text-slate-500 hover:text-primary"
                >
                  {t('buttons.revealModules', { count: filtered.length })}
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className={`${footerClassName} justify-between`}>
        <Button
          onClick={onPrevious}
          icon={ChevronLeft}
          className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-blue-700 bg-blue-700 px-6 font-semibold text-white shadow-sm hover:bg-blue-700 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0"
        >
          {t('buttons.previous')}
        </Button>
        <div className="flex gap-3">
          <SaveButton
            label={t('buttons.saveProgress')}
            onClick={onSaveProgress}
            disabled={isSaving}
            className="h-11 rounded-xl px-5"
          />
          <Button
            onClick={onFinalize}
            disabled={isSaving}
            icon={CheckCircle}
            className="flex h-11 items-center gap-2 rounded-xl bg-emerald-600 px-6 font-black text-white hover:bg-emerald-700"
          >
            {t('buttons.finalize')}
          </Button>
        </div>
      </div>
    </>
  );
}
