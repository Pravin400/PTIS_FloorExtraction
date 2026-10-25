/**
 * On-The-Go Responsibility & Assignment Section
 * Path: src/components/modules/grievance/admin/on-the-go/OnTheGoAssignmentSection.tsx
 *
 * Cascading selectors for Zone, Ward, Department, Field Officer, and Additional Landmark.
 * Line ceiling: < 200 lines.
 */

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown, ShieldCheck, Plus, Minus, MapPin } from 'lucide-react';
import { Input } from '@/components/common';
import type { ZoneOption, WardOption } from '@/hooks/grievance/admin/useOnTheGoOfficers';
import type { OnTheGoOfficerOption, OnTheGoCategoryOption } from '@/types/grievance/on-the-go.types';

export interface OnTheGoAssignmentSectionProps {
  zoneId: number | null;
  wardNumber: number | null;
  departmentId: string | null;
  grievanceTypeId?: number | null;
  officerUserId: number | null;
  landmark: string;
  errors?: {
    zoneId?: string;
    wardNumber?: string;
    departmentId?: string;
    grievanceTypeId?: string;
    officerUserId?: string;
    landmark?: string;
  };
  zones: ZoneOption[];
  activeZone?: ZoneOption;
  departments: Array<{ id: string; nameEn: string }>;
  categories?: OnTheGoCategoryOption[];
  officers: OnTheGoOfficerOption[];
  activeOfficer?: OnTheGoOfficerOption;
  isSubmitting: boolean;
  onZoneChange: (id: number | null) => void;
  onWardChange: (num: number | null) => void;
  onDepartmentChange: (id: string | null) => void;
  onCategoryChange?: (id: number | null) => void;
  onOfficerChange: (id: number | null) => void;
  onLandmarkChange: (val: string) => void;
}

export function OnTheGoAssignmentSection({
  zoneId,
  wardNumber,
  departmentId,
  grievanceTypeId,
  officerUserId,
  landmark,
  errors,
  zones,
  activeZone,
  departments,
  categories = [],
  officers,
  activeOfficer,
  isSubmitting,
  onZoneChange,
  onWardChange,
  onDepartmentChange,
  onCategoryChange,
  onOfficerChange,
  onLandmarkChange,
}: OnTheGoAssignmentSectionProps) {
  const t = useTranslations('grievance');
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);

  return (
    <div className="space-y-3">
      <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
        {t('assignResponsibility')}
      </h2>

      {/* Row 1: Zone & Ward in a Single Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Zone */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
            <span>{t('zoneLabel')}</span>
            <span className="text-red-500 font-bold">*</span>
          </label>
          <div className="relative">
            <select
              value={zoneId ?? ''}
              onChange={(e) => onZoneChange(e.target.value ? Number(e.target.value) : null)}
              disabled={isSubmitting}
              className="w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2 pr-8 text-sm text-slate-800 focus:border-emerald-600 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="">{t('selectZone')}</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          </div>
          {errors?.zoneId && <p className="text-[11px] text-red-500">{errors.zoneId}</p>}
        </div>

        {/* Ward */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
            <span>{t('wardLabel')}</span>
            <span className="text-red-500 font-bold">*</span>
          </label>
          <div className="relative">
            <select
              value={wardNumber ?? ''}
              onChange={(e) => onWardChange(e.target.value ? Number(e.target.value) : null)}
              disabled={isSubmitting || !zoneId}
              className="w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2 pr-8 text-sm text-slate-800 focus:border-emerald-600 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 disabled:bg-slate-100 disabled:text-slate-400"
            >
              <option value="">{!zoneId ? t('selectZoneFirst') : t('selectWard')}</option>
              {activeZone?.wards.map((w: WardOption) => (
                <option key={w.wardNumber} value={w.wardNumber}>
                  {t('wardLabel')} {w.wardNumber}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          </div>
          {errors?.wardNumber && <p className="text-[11px] text-red-500">{errors.wardNumber}</p>}
        </div>
      </div>

      {/* Row 2: Department & Category / Issue Type in a Single Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Department */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
            <span>{t('departmentLabel')}</span>
            <span className="text-red-500 font-bold">*</span>
          </label>
          <div className="relative">
            <select
              value={departmentId ?? ''}
              onChange={(e) => {
                onDepartmentChange(e.target.value || null);
                if (onCategoryChange) onCategoryChange(null);
              }}
              disabled={isSubmitting || departments.length === 0}
              className="w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2 pr-8 text-sm text-slate-800 focus:border-emerald-600 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="">{t('selectDepartment')}</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nameEn}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          </div>
          {errors?.departmentId && <p className="text-[11px] text-red-500">{errors.departmentId}</p>}
        </div>

        {/* Category / Issue Type */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
            <span>{t('defectTypeOptional')}</span>
          </label>
          <div className="relative">
            <select
              value={grievanceTypeId ?? ''}
              onChange={(e) => onCategoryChange?.(e.target.value ? Number(e.target.value) : null)}
              disabled={isSubmitting || !departmentId || categories.length === 0}
              className="w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2 pr-8 text-sm text-slate-800 focus:border-emerald-600 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 disabled:bg-slate-100 disabled:text-slate-400"
            >
              <option value="">
                {!departmentId ? t('selectDepartmentFirst') : t('selectDefectType')}
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          </div>
          {errors?.grievanceTypeId && <p className="text-[11px] text-red-500">{errors.grievanceTypeId}</p>}
        </div>
      </div>

      {/* Row 3: Field Officer */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
          <span>{t('officerLabel')}</span>
          <span className="text-red-500 font-bold">*</span>
        </label>
        <div className="relative">
          <select
            value={officerUserId ?? ''}
            onChange={(e) => onOfficerChange(e.target.value ? Number(e.target.value) : null)}
            disabled={isSubmitting || !departmentId || officers.length === 0}
            className="w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2 pr-8 text-sm text-slate-800 focus:border-emerald-600 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 disabled:bg-slate-100 disabled:text-slate-400"
          >
            <option value="">
              {!departmentId
                ? t('selectDepartmentFirst')
                : officers.length === 0
                ? t('noOfficersAllocated')
                : t('selectOfficer')}
            </option>
            {officers.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        </div>
        {activeOfficer && (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pl-0.5 pt-0.5 truncate">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">
              {activeOfficer.designation}
              {activeOfficer.wardNumber || wardNumber ? ` · ${t('wardLabel')} ${activeOfficer.wardNumber || wardNumber}` : ''}
            </span>
          </div>
        )}
        {errors?.officerUserId && <p className="text-[11px] text-red-500">{errors.officerUserId}</p>}
      </div>

      {/* Row 3: Additional Details (Landmark / Road Name) below Department */}
      <div className="pt-2 border-t border-slate-100 space-y-2">
        <button
          type="button"
          onClick={() => setIsAccordionOpen(!isAccordionOpen)}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors cursor-pointer group focus:outline-hidden"
        >
          <span className="w-4 h-4 rounded border border-slate-300 flex items-center justify-center text-slate-500 group-hover:border-slate-400 group-hover:text-slate-700">
            {isAccordionOpen ? <Minus className="w-3.5 h-3.5 stroke-[2.5]" /> : <Plus className="w-3.5 h-3.5 stroke-[2.5]" />}
          </span>
          <span>{t('additionalDetails')}</span>
        </button>

        {isAccordionOpen && (
          <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50 border border-slate-200/90 space-y-2 animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                <span>{t('landmarkRoadName')}</span>
              </label>
              <Input
                naked={false}
                type="text"
                value={landmark}
                onChange={(e) => onLandmarkChange(e.target.value)}
                disabled={isSubmitting}
                placeholder={t('landmarkPlaceholder')}
                error={errors?.landmark}
                className="rounded-lg border-slate-300 py-1.5 focus:border-emerald-600 focus:ring-emerald-500/20"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
