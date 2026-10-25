'use client';

import { Layers, Building2, Calendar, Hammer, FileText } from 'lucide-react';
import { SearchSelect, AnimatedDigitInput } from '@/components/common';
import type { FloorClassificationFieldsProps } from '@/types/asset/floor-details.types';
import { withSelectPlaceholder } from '@/lib/utils/asset-utils/new-add-new-asset/dropdown-placeholder.utils';

export function FloorClassificationFields({
  t,
  formState,
  setFormState,
  dropdownOptions,
  subFloorOptions,
  subUseTypeOptions,
}: FloorClassificationFieldsProps) {
  return (
    <>
      <div className="flex flex-col">
        <label className="mb-1 text-[11px] font-bold text-slate-700 flex items-center gap-1">
          <Layers className="size-3 text-blue-600" />
          {t('floorDetails.separatelyUsedPlotArea')}
        </label>
        <SearchSelect
          name="submissionType"
          options={withSelectPlaceholder([
            { label: t('floorDetails.construction'), value: 'Construction' },
            { label: t('floorDetails.openSpace'), value: 'Open Space' },
          ])}
          value={formState.submissionType || ''}
          onChange={(_name, val) => {
            setFormState((p: Record<string, unknown>) => ({
              ...p,
              submissionType: val,
              ...(val === 'Open Space' && {
                floor: '',
                subFloor: '',
                conYear: '',
                conType: '',
                builtUpAreaSqFt: 0,
              }),
            }));
          }}
          placeholder="--Select--"
        />
      </div>

      {formState.submissionType !== 'Open Space' && (
        <>
          <div className="flex flex-col">
            <label className="mb-1 text-[11px] font-bold text-slate-700 flex items-center gap-1">
              <Building2 className="size-3 text-indigo-600" />
              {t('floorDetails.floor')}
              <span className="text-red-500">*</span>
            </label>
            <SearchSelect
              name="floor"
              options={withSelectPlaceholder(dropdownOptions?.floorLevels || [])}
              value={formState.floor || ''}
              onChange={(_name, val) =>
                setFormState((p: Record<string, unknown>) => ({ ...p, floor: val, subFloor: '' }))
              }
              placeholder="--Select--"
            />
          </div>

          <div className="flex flex-col">
            <label className="mb-1 text-[11px] font-bold text-slate-700 flex items-center gap-1">
              <Layers className="size-3 text-cyan-600" />
              {t('floorDetails.subFloor')}
            </label>
            <SearchSelect
              name="subFloor"
              options={withSelectPlaceholder(subFloorOptions || [])}
              value={formState.subFloor || ''}
              onChange={(_name, val) => setFormState((p: Record<string, unknown>) => ({ ...p, subFloor: val }))}
              placeholder="--Select--"
            />
          </div>

          <div>
            <label className="mb-1 text-[11px] font-bold text-slate-700 flex items-center gap-1">
              <Calendar className="size-3 text-amber-600" />
              {t('floorDetails.conYr') || 'Con Yr'}
              <span className="text-red-500">*</span>
            </label>
            <AnimatedDigitInput
              name="conYear"
              value={formState.conYear || ''}
              onChange={(val) => {
                const cleanedVal = val.replace(/\D/g, '').slice(0, 4);
                setFormState((p: Record<string, unknown>) => ({ ...p, conYear: cleanedVal }));
              }}
              maxLength={4}
              className="font-mono w-full"
            />
          </div>
        </>
      )}

      <div>
        <label className="mb-1 text-[11px] font-bold text-slate-700 flex items-center gap-1">
          <Calendar className="size-3 text-purple-600" />
          {t.has('floorDetails.asstYr') ? t('floorDetails.asstYr') : 'Asst Yr'}
          <span className="text-red-500">*</span>
        </label>
        <AnimatedDigitInput
          name="asstYear"
          value={formState.asstYear || ''}
          onChange={(val) => {
            const cleanedVal = val.replace(/\D/g, '').slice(0, 4);
            setFormState((p: Record<string, unknown>) => ({ ...p, asstYear: cleanedVal }));
          }}
          maxLength={4}
          className="font-mono w-full"
        />
      </div>

      {formState.submissionType !== 'Open Space' && (
        <div className="flex flex-col">
          <label className="mb-1 text-[11px] font-bold text-slate-700 flex items-center gap-1">
            <Hammer className="size-3 text-orange-600" />
            {t('floorDetails.conType')}
            <span className="text-red-500">*</span>
          </label>
          <SearchSelect
            name="conType"
            options={withSelectPlaceholder(dropdownOptions?.constructionTypes || [])}
            value={formState.conType || ''}
            onChange={(_name, val) => setFormState((p: Record<string, unknown>) => ({ ...p, conType: val }))}
            placeholder="--Select--"
          />
        </div>
      )}

      <div className="flex flex-col">
        <label className="mb-1 text-[11px] font-bold text-slate-700 flex items-center gap-1">
          <FileText className="size-3 text-emerald-600" />
          {t('floorDetails.typeOfUse')}
          <span className="text-red-500">*</span>
        </label>
        <SearchSelect
          name="useType"
          options={withSelectPlaceholder(dropdownOptions?.useTypes || [])}
          value={formState.useType || ''}
          onChange={(_name, val) =>
            setFormState((p: Record<string, unknown>) => ({ ...p, useType: val, subUseType: '' }))
          }
          placeholder="--Select--"
        />
      </div>

      <div className="flex flex-col">
        <label className="mb-1 text-[11px] font-bold text-slate-700 flex items-center gap-1">
          <FileText className="size-3 text-teal-600" />
          {t('floorDetails.subTypeOfUse')}
        </label>
        <SearchSelect
          name="subUseType"
          options={withSelectPlaceholder(subUseTypeOptions || [])}
          value={formState.subUseType || ''}
          onChange={(_name, val) => setFormState((p: Record<string, unknown>) => ({ ...p, subUseType: val }))}
          placeholder="--Select--"
        />
      </div>
    </>
  );
}
