'use client';

import React from 'react';
import { SearchSelect } from '@/components/common';
import { UsageSectionProps } from '@/types/floor-details.types';
import { FloorData } from '@/types/room-details.types';
import { LookupData } from '@/types/common-details.types';
import { getSelectOptions } from '@/lib/utils/form-options.util';
import { normalizeToStringArray } from '@/lib/utils/dropdown-helpers';
import { FieldWrapper } from './SectionField';
import { checkIsUtilityCategory } from '@/lib/utils/floorSubmission/floor-utility-checks';

export const UsageSection: React.FC<UsageSectionProps & { selectedFloorType?: 'Construction' | 'OpenPlot'; isPlotCategory?: boolean }> = ({
  t,
  editingFloorForm,
  setEditingFloorForm,
  formErrors,
  setFormErrors,
  constructionTypeOptions,
  constructionLookup,
  useOptions,
  useLookup,
  subTypeOptionsFromData,
  subTypeData,
  startTransition,
  updateUrlParams,
  getConstructionDescription,
  getUseDescription,
  getSubTypeDescription,
  handleOpenDropdown,
  selectedFloorType = 'Construction',
  isPlotCategory: _isPlotCategory = false,
}) => {
  const isUseEnabled = selectedFloorType === 'OpenPlot' || !!editingFloorForm.constructionTypeId;

  const filteredUseOptions = React.useMemo(() => {
    const rawOptions = normalizeToStringArray(useOptions);
    const lookup = (useLookup || []) as LookupData[];

    return rawOptions.filter(opt => {
      const item = lookup.find(u => {
        const desc = String(u.description || '').trim().replace(/\s+/g, ' ');
        const code = u.typeOfUseCode ? String(u.typeOfUseCode).trim().replace(/\s+/g, ' ') : '';
        const id = String(u.typeOfUseId || u.id || u.ID || '').trim().replace(/\s+/g, ' ');
        const cleanOpt = String(opt || '').trim().replace(/\s+/g, ' ');
        return cleanOpt === desc || (code && cleanOpt === `${code} - ${desc}`) || (id && cleanOpt === `${id} - ${desc}`);
      });
      if (!item) return false;
      // OpenPlot: only show categories 2 & 3
      if (selectedFloorType === 'OpenPlot') {
        const itemCategoryId = item.typeOfUseCategoryId !== undefined && item.typeOfUseCategoryId !== null
          ? Number(item.typeOfUseCategoryId)
          : null;
        return itemCategoryId === 2 || itemCategoryId === 3;
      }
      // Construction: filter out Open Plot specific categories (categories 3 & 4)
      const catId = item.typeOfUseCategoryId !== undefined && item.typeOfUseCategoryId !== null
        ? Number(item.typeOfUseCategoryId)
        : null;
      return catId !== 2 && catId !== 3 && catId !== 4;
    });
  }, [useOptions, useLookup, selectedFloorType]);

  return (
    <>
      {/* Con Typ (Construction Type) */}
      {selectedFloorType !== 'OpenPlot' && (
        <FieldWrapper label={t('floor.conTyp')} htmlFor="floor-type" required error={formErrors.constructionTypeId || formErrors.conTyp}>
          <div onFocusCapture={() => handleOpenDropdown('loadConstruction')}>
            <SearchSelect
              id="floor-type"
              name="constructionTypeId"
              menuPlacement="top"
              options={[
                { label: t('floor.selectType'), value: "" },
                ...getSelectOptions(
                  normalizeToStringArray(constructionTypeOptions),
                  constructionLookup,
                  'constructionTypeId',
                  'description',
                  'constructionCode',
                  editingFloorForm.constructionTypeId,
                  getConstructionDescription
                ).filter(opt => {
                  if (selectedFloorType === 'Construction') {
                    const lblStr = String(opt.label).toLowerCase();
                    const valStr = String(opt.value).toLowerCase();
                    return !lblStr.includes('open plot') && valStr !== '11';
                  }
                  return true;
                })
              ]}
              value={
                selectedFloorType === 'Construction' &&
                  (String(editingFloorForm.conTyp || '').toLowerCase().includes('open plot') ||
                    String(editingFloorForm.constructionTypeDescription || '').toLowerCase().includes('open plot') ||
                    String(editingFloorForm.constructionTypeId || '') === '11')
                  ? ''
                  : String(editingFloorForm.constructionTypeId ?? '')
              }
              onChange={(_name, value) => {
                const desc = getConstructionDescription(value, constructionLookup);
                setEditingFloorForm((prev: FloorData) => ({
                  ...prev,
                  constructionTypeId: value,
                  conTyp: desc || value,
                  constructionTypeDescription: desc || value
                }));
                if (formErrors.constructionTypeId || formErrors.conTyp) {
                  setFormErrors((prev) => ({ ...prev, constructionTypeId: '', conTyp: '' }));
                }
              }}
              placeholder={t('floor.selectType')}
              className="h-9 text-sm"
            />
          </div>
        </FieldWrapper>
      )}

      {/* Use */}
      <FieldWrapper
        label={t('floor.use')}
        htmlFor="floor-use"
        required
        error={formErrors.typeOfUseId || formErrors.use}
        labelExtra={
          !isUseEnabled && (
            <span className="text-[9px] text-orange-500 font-medium px-1.5 py-0.5 bg-orange-50 rounded border border-orange-100 animate-pulse">
              {t('floor.selectConTypFirst')}
            </span>
          )
        }
      >
        <div onFocusCapture={() => isUseEnabled && handleOpenDropdown('loadUsage')}>
          <SearchSelect
            id="floor-use"
            name="typeOfUseId"
            menuPlacement="top"
            options={[
              { label: t('floor.selectUsage'), value: "" },
              ...getSelectOptions(
                filteredUseOptions,
                useLookup,
                'typeOfUseId',
                'description',
                'typeOfUseCode',
                editingFloorForm.typeOfUseId,
                (val: string, lookup: LookupData[]): string => {
                  return (
                    getUseDescription(val, lookup) ||
                    String(editingFloorForm.use || editingFloorForm.usageDescription || editingFloorForm.typeOfUseDescription || '')
                  );
                }
              )
            ]}
            value={String(editingFloorForm.typeOfUseId ?? '')}
            onChange={(_name, value) => {
              const desc = getUseDescription(value, useLookup);
              startTransition(() => {
                updateUrlParams({ typeOfUseId: value, loadSubType: 'true' });
              });
              const selectedUse = useLookup?.find(u => String(u.typeOfUseId || u.id || '') === String(value));
              const categoryId: number | null = selectedUse ? (selectedUse.typeOfUseCategoryId !== undefined && selectedUse.typeOfUseCategoryId !== null ? Number(selectedUse.typeOfUseCategoryId) : null) : null;
              const isUtil = checkIsUtilityCategory(categoryId);
              setEditingFloorForm((prev: FloorData) => ({
                ...prev,
                typeOfUseId: value,
                use: desc || value,
                typeOfUseDescription: desc || value,
                subTypeOfUseId: "",
                subTyp: "",
                subTypeOfUseDescription: "",
                typeOfUseCategoryId: categoryId,
                ...(isUtil ? { rooms: "0" } : {})
              }));
              setFormErrors((prev) => ({ ...prev, typeOfUseId: '', use: '', rooms: '' }));
            }}
            placeholder={!isUseEnabled ? t('floor.selectConTypFirst') : t('floor.selectUsage')}
            disabled={!isUseEnabled}
            className={`h-9 text-sm transition-colors ${!isUseEnabled ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' : ''}`}
          />
        </div>
      </FieldWrapper>

      {/* Sub Type */}
      <FieldWrapper
        label={t('floor.subTyp')}
        htmlFor="floor-sub-typ"
        error={formErrors.subTypeOfUseId || formErrors.subTyp}
        labelExtra={
          !editingFloorForm.typeOfUseId && (
            <span className="text-[9px] text-orange-500 font-medium px-1.5 py-0.5 bg-orange-50 rounded border border-orange-100 animate-pulse">
              {t('floor.selectUseFirst')}
            </span>
          )
        }
      >
        <div onFocusCapture={() => editingFloorForm.typeOfUseId && handleOpenDropdown('loadSubType')}>
          <SearchSelect
            id="floor-sub-typ"
            name="subTypeOfUseId"
            menuPlacement="top"
            options={[
              { label: t('floor.selectSubtype'), value: "" },
              ...getSelectOptions(
                subTypeOptionsFromData,
                subTypeData,
                'subTypeOfUseId',
                'description',
                'searchKey',
                editingFloorForm.subTypeOfUseId as string | number | undefined,
                (val: string, lookup: LookupData[]): string => {
                  return getSubTypeDescription(val, lookup) || String(editingFloorForm.subTypeOfUseDescription || '');
                }
              )
            ]}
            value={String(editingFloorForm.subTypeOfUseId ?? '')}
            onChange={(_name, value) => {
              const desc = getSubTypeDescription(value, subTypeData);
              setEditingFloorForm((prev: FloorData) => ({
                ...prev,
                subTypeOfUseId: value,
                subTyp: desc || value,
                subTypeOfUseDescription: desc || value
              }));
              if (formErrors.subTypeOfUseId || formErrors.subTyp) {
                setFormErrors((prev) => ({ ...prev, subTypeOfUseId: '', subTyp: '' }));
              }
            }}
            placeholder={!editingFloorForm.typeOfUseId ? t('floor.selectUseFirst') : subTypeOptionsFromData.length === 0 ? t('floor.noSubtypesAvailable') : t('floor.selectSubtype')}
            disabled={!editingFloorForm.typeOfUseId || subTypeOptionsFromData.length === 0}
            className={`h-9 text-sm transition-colors ${!editingFloorForm.typeOfUseId || subTypeOptionsFromData.length === 0
              ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
              : ''
              }`}
          />
        </div>
      </FieldWrapper>
    </>
  );
};
