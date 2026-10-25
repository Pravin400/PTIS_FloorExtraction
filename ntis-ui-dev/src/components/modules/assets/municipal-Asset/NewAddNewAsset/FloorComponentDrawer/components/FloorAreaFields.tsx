'use client';

import { Maximize2, Building } from 'lucide-react';
import { Input } from '@/components/common';
import type { FloorAreaFieldsProps } from '@/types/asset/floor-details.types';

export function FloorAreaFields({
  t,
  formState,
}: FloorAreaFieldsProps) {
  return (
    <>
      <div className="flex flex-col">
        <label className="mb-1 text-[11px] font-bold text-slate-700 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Maximize2 className="size-3 text-blue-600" />
            <span>{t('floorDetails.areaSqFt') || 'Area (Sq Ft)'}</span>
            <span className="text-red-500">*</span>
          </span>
          <span className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 border border-blue-100 rounded-full">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
            </span>
            <span className="text-[8px] text-blue-700 font-bold uppercase tracking-tight">
              AUTO
            </span>
          </span>
        </label>
        <div className="group relative">
          <Input
            required
            type="number"
            name="carpetAreaSqFt"
            min={0}
            value={formState.carpetAreaSqFt ?? 0}
            readOnly
            className="bg-slate-50 border-slate-200 cursor-not-allowed font-mono font-bold text-slate-800 pr-16 focus:border-blue-500 focus:ring-blue-200 transition-colors"
          />
          <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 shadow-xs z-10">
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-wider">
              {'SQ FT'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col">
        <label className="mb-1 text-[11px] font-bold text-slate-700 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Maximize2 className="size-3 text-indigo-600" />
            <span>{t('floorDetails.areaSqM') || 'Area (Sq M)'}</span>
          </span>
          <span className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 border border-blue-100 rounded-full">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
            </span>
            <span className="text-[8px] text-blue-700 font-bold uppercase tracking-tight">
              AUTO
            </span>
          </span>
        </label>
        <Input
          required
          type="number"
          name="carpetAreaSqM"
          min={0}
          value={
            formState.carpetAreaSqFt
              ? (Number(formState.carpetAreaSqFt) / 10.7639).toFixed(2)
              : 0
          }
          readOnly
          className="bg-slate-50 border-slate-200 cursor-not-allowed font-mono font-bold text-slate-800"
        />
      </div>

      {formState.submissionType !== 'Open Space' && (
        <>
          <div className="flex flex-col">
            <label className="mb-1 text-[11px] font-bold text-slate-700 flex items-center gap-1">
              <Building className="size-3 text-emerald-600" />
              <span>{t('floorDetails.builtupAreaSqFt') || 'Builtup Area (Sq.Ft)'}</span>
            </label>
            <Input
              type="number"
              name="builtUpAreaSqFt"
              min={0}
              value={
                formState.builtUpAreaSqFt && Number(formState.builtUpAreaSqFt) > 0
                  ? formState.builtUpAreaSqFt
                  : formState.carpetAreaSqFt
                    ? Number((Number(formState.carpetAreaSqFt) * 1.2).toFixed(2))
                    : 0
              }
              readOnly
              className="bg-slate-50 border-slate-200 cursor-not-allowed font-mono font-bold text-emerald-700"
            />
          </div>

          <div className="flex flex-col">
            <label className="mb-1 text-[11px] font-bold text-slate-700 flex items-center gap-1">
              <Building className="size-3 text-teal-600" />
              <span>{t('floorDetails.builtupAreaSqM') || 'Builtup Area (Sq.M)'}</span>
            </label>
            <Input
              type="number"
              name="builtUpAreaSqM"
              min={0}
              value={
                formState.builtUpAreaSqFt && Number(formState.builtUpAreaSqFt) > 0
                  ? (Number(formState.builtUpAreaSqFt) / 10.7639).toFixed(2)
                  : formState.carpetAreaSqFt
                    ? ((Number(formState.carpetAreaSqFt) * 1.2) / 10.7639).toFixed(2)
                    : 0
              }
              readOnly
              className="bg-slate-50 border-slate-200 cursor-not-allowed font-mono font-bold text-emerald-700"
            />
          </div>
        </>
      )}
    </>
  );
}
