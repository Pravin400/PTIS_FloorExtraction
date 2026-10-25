'use client';

import { LayoutGrid } from 'lucide-react';
import { Input } from '@/components/common';
import { SubUnitAreaSummaryFieldsProps } from '@/types/asset/sub-units.types';

export function SubUnitAreaSummaryFields({
  submissionType,
  area,
  setIsOpenSpacesDrawerOpen,
  t,
}: SubUnitAreaSummaryFieldsProps) {
  return (
    <>
      <div className="flex flex-col">
        <label className="mb-1 text-[11px] font-bold text-slate-600">
          <span className="flex flex-wrap items-center gap-1">
            <span>{t('floorDetails.areaSqFt') || 'Area (Sq Ft)'}</span>
            <span className="text-red-500">*</span>
            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 border border-blue-100 rounded-full">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
              </span>
              <span className="text-[8px] text-blue-700 font-bold uppercase tracking-tight">
                AUTO
              </span>
            </span>
          </span>
        </label>
        <div className="group relative">
          <Input
            naked
            value={String(area)}
            readOnly
            className={`w-full px-2 py-0.5 border rounded-md bg-gray-50 border-gray-300 cursor-not-allowed font-mono font-bold text-blue-700 focus:border-blue-500 focus:ring-blue-200 transition-colors group-hover:bg-blue-50/30 ${submissionType === 'Open Space' ? 'pr-12' : 'pr-3'}`}
          />
          {submissionType === 'Open Space' && (
            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-slate-100/90 hover:bg-slate-200/90 px-2 py-1 rounded-md border border-slate-300 shadow-sm transition-all duration-200 group-hover:shadow group-focus-within:border-blue-400 group-focus-within:ring-1 group-focus-within:ring-blue-100 z-20">
              <button
                type="button"
                onClick={() => setIsOpenSpacesDrawerOpen(true)}
                className="flex items-center justify-center p-1 rounded hover:bg-blue-600 hover:text-white text-blue-600 transition-all active:scale-90 cursor-pointer"
                title="Configure Open Space"
              >
                <LayoutGrid className="size-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col">
        <label className="mb-1 text-[11px] font-bold text-slate-600">
          <span className="flex flex-wrap items-center gap-1">
            <span>{t('floorDetails.areaSqM') || 'Area (Sq M)'}</span>
            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 border border-blue-100 rounded-full">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
              </span>
              <span className="text-[8px] text-blue-700 font-bold uppercase tracking-tight">
                AUTO
              </span>
            </span>
          </span>
        </label>
        <Input
          naked
          value={String(Number((area / 10.7639).toFixed(2)))}
          readOnly
          className="w-full px-2 py-0.5 border rounded-md bg-gray-50 border-gray-300 cursor-not-allowed font-mono font-bold text-blue-700 transition-colors"
        />
      </div>

      {submissionType !== 'Open Space' && (
        <div className="flex flex-col">
          <label className="mb-1 text-[11px] font-bold text-slate-600">
            {t('floorDetails.builtupAreaSqFt') || 'Builtup Area (Sq Ft)'}
          </label>
          <Input
            naked
            value={String(Number((area * 1.2).toFixed(2)))}
            readOnly
            className="w-full px-2 py-0.5 border rounded-md bg-gray-50 border-gray-300 cursor-not-allowed font-mono font-bold text-emerald-700 transition-colors"
          />
        </div>
      )}

      {submissionType !== 'Open Space' && (
        <div className="flex flex-col">
          <label className="mb-1 text-[11px] font-bold text-slate-600">
            {t('floorDetails.builtupAreaSqM') || 'Builtup Area (Sq M)'}
          </label>
          <Input
            naked
            value={String(Number(((area * 1.2) / 10.7639).toFixed(2)))}
            readOnly
            className="w-full px-2 py-0.5 border rounded-md bg-gray-50 border-gray-300 cursor-not-allowed font-mono font-bold text-emerald-700 transition-colors"
          />
        </div>
      )}
    </>
  );
}
