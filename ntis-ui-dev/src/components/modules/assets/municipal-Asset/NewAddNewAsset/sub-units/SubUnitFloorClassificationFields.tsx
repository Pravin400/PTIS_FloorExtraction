'use client';

import React, { useState } from 'react';
import { Building2, LayoutGrid } from 'lucide-react';
import { Input, SearchSelect } from '@/components/common';
import { AnimatedDigitInput } from '@/components/common/AnimatedDigitInput';
import { SubUnitFloorClassificationFieldsProps } from '@/types/asset/sub-units.types';
import { withSelectPlaceholder } from '@/lib/utils/asset-utils/new-add-new-asset/dropdown-placeholder.utils';

export function SubUnitFloorClassificationFields({
  formData,
  setFormData,
    handleFloorSelect,
  handleUseTypeSelect,
  floorSelectOptions,
  dropdownOptions,
  subFloorOptions,
  dynamicSubUseTypes,
  submissionType,
  setSubmissionType,
  roomsList,
  setRoomsList,
  setIsRoomsDrawerOpen,
  inp,
  t,
}: SubUnitFloorClassificationFieldsProps) {
  const currentRoomsCount = roomsList.reduce((acc, r) => acc + Number(r.count || 1), 0);
  const [roomCountInput, setRoomCountInput] = useState<string>(String(currentRoomsCount || ''));

  const [prevRoomsCount, setPrevRoomsCount] = useState(currentRoomsCount);
  if (prevRoomsCount !== currentRoomsCount) {
    setPrevRoomsCount(currentRoomsCount);
    setRoomCountInput(String(currentRoomsCount || ''));
  }
    return (
      <>
        <SearchSelect
          label={t('floorDetails.separatelyUsedPlotArea')}
          name="submissionType"
          value={submissionType || ''}
          onChange={(_name, val) => {
            setSubmissionType(val as 'Construction' | 'Open Space');
          }}
          options={withSelectPlaceholder([
            { label: t('floorDetails.construction'), value: 'Construction' },
            { label: t('floorDetails.openSpace'), value: 'Open Space' },
          ])}
          placeholder="--Select--"
        />

      {floorSelectOptions.length > 1 ? (
        <SearchSelect
          label={t('subunit.fields.assignToFloor')}
          value={formData.floorId ? String(formData.floorId) : ''}
          onChange={(_name, val) => {
            const event = {
              target: { value: val },
            } as React.ChangeEvent<HTMLSelectElement>;
            handleFloorSelect(event);
          }}
          options={withSelectPlaceholder(floorSelectOptions.slice(1))}
          placeholder="--Select--"
        />
      ) : (
        <div className="flex flex-col">
          <span className="block text-[11px] font-medium text-gray-700 mb-1 truncate">
            {t('subunit.fields.assignToFloor')}
          </span>
          <div
            className={`${inp} flex items-center px-2 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 text-[10px] font-semibold`}
          >
            {t('notifications.noFloors')}
          </div>
        </div>
      )}
      <SearchSelect
        label={t('subunit.fields.subFloor')}
        name="subFloorId"
        value={formData.subFloorId ? String(formData.subFloorId) : ''}
        onChange={(_name, val) => {
          const matched = (subFloorOptions || []).find((o: { label?: string; value?: string | number; typeOfUseId?: string | number; [key: string]: unknown }) => String(o.value) === String(val));
          setFormData((p: Record<string, unknown>) => ({ ...p, subFloorId: val, subFloorName: matched?.label || '' }));
        }}
        options={withSelectPlaceholder(subFloorOptions || [])}
        placeholder="--Select--"
      />
      {submissionType === 'Construction' && (
        <>
          <AnimatedDigitInput
            label={t('subunit.fields.conYr')}
            name="conYear"
            value={String(formData.conYear || '')}
            onChange={(val) => setFormData((p: Record<string, unknown>) => ({ ...p, conYear: val }))}
            placeholder={t('subunit.fields.yearPlaceholder', { year: new Date().getFullYear() })}
            maxLength={4}
            className={inp}
          />
          <AnimatedDigitInput
            label={t('subunit.fields.asstYear') || 'Assessment Year'}
            name="asstYear"
            value={String(formData.asstYear || '')}
            onChange={(val) => setFormData((p: Record<string, unknown>) => ({ ...p, asstYear: val }))}
            placeholder={t('subunit.fields.yearPlaceholder', { year: new Date().getFullYear() })}
            maxLength={4}
            className={inp}
          />
          <SearchSelect
            label={t('subunit.fields.conType')}
            name="conType"
            value={formData.conType || ''}
            onChange={(_name, val) => setFormData((p: Record<string, unknown>) => ({ ...p, conType: val }))}
            options={withSelectPlaceholder(dropdownOptions?.constructionTypes || [])}
            placeholder="--Select--"
          />
        </>
      )}
      <SearchSelect
        label={t('subunit.fields.typeOfUse')}
        name="useType"
        value={formData.useType || ''}
        onChange={(_name, val) => handleUseTypeSelect(val)}
        options={withSelectPlaceholder(dropdownOptions?.useTypes || [])}
        placeholder="--Select--"
      />
      <SearchSelect
        label={t('subunit.fields.subTypeOfUse')}
        name="subUseType"
        value={formData.subUseType || ''}
        onChange={(_name, val) => setFormData((p: Record<string, unknown>) => ({ ...p, subUseType: val }))}
        options={withSelectPlaceholder(
          dynamicSubUseTypes.length > 0
            ? dynamicSubUseTypes
            : (dropdownOptions?.subUseTypes || []).filter(
                (o: { label?: string; value?: string | number; typeOfUseId?: string | number; [key: string]: unknown }) => String(o.typeOfUseId) === String(formData.useType)
              )
        )}
        placeholder="--Select--"
      />

      {submissionType === 'Construction' && (
        <div className="flex flex-col">
          <label className="mb-1 text-[11px] font-bold text-slate-600 flex items-center gap-1">
            <Building2 className="size-3 text-blue-500" />{' '}
            {t('floorDetails.rooms') || 'Rooms'}
            <span className="text-red-500"> *</span>
          </label>
          <div className="flex items-center gap-1">
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={3}
              min={0}
              value={roomCountInput}
              onChange={(e) => {
                // Strip non-digits, remove leading zeros, disallow decimals, cap at 999
                const raw = e.target.value.replace(/[^0-9]/g, '').slice(0, 3);
                setRoomCountInput(raw);
                if (!raw || raw === '0') {
                  // User is clearing or editing the number — DO NOT wipe roomsList while typing!
                  return;
                }
                const targetCount = Math.min(999, parseInt(raw, 10));
                import('@/lib/utils/asset-utils/new-add-new-asset/floor-details/room-open-space-amenity.utils').then((m) => {
                  setRoomsList((prev: { count?: number; [key: string]: unknown }[]) =>
                    m.syncEntityCount(prev, targetCount, (i: number) => m.makeDefaultRoom(i, dropdownOptions))
                  );
                });
              }}
              onBlur={() => {
                if (!roomCountInput || roomCountInput === '0') {
                  // If left blank or 0 on blur, restore the input display to actual roomsList length so rooms are never lost
                  setRoomCountInput(String(roomsList.length || ''));
                }
              }}
              className="font-bold text-slate-800 !w-full"
            />
            <button
              type="button"
              onClick={() => setIsRoomsDrawerOpen(true)}
              className="h-8 px-2 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-md text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-0.5 shadow-sm transition-all shrink-0 cursor-pointer"
              title="Config Rooms"
            >
              <LayoutGrid className="size-3" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
