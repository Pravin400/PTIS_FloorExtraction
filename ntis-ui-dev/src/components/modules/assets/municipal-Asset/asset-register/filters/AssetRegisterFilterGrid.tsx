'use client';

import { useTranslations } from 'next-intl';
import { Label, Select } from '@/components/common';
import type { Option } from '@/components/common';
import { AdditionalFilterFields } from './AdditionalFilterFields';

interface AssetRegisterFilterGridProps {
  zoneSelectOptions: Option[];
  wardSelectOptions: Option[];
  departmentSelectOptions?: Option[];
  categorySelectOptions: Option[];
  assetTypeSelectOptions: Option[];
  ownershipOptions?: Option[];
  ZoneId?: string;
  WardId?: string;
  DepartmentId?: string;
  categoryId?: number;
  AssetTypeId?: string;
  ownershipType?: string;
  encroachmentStatus?: string;
  handleZoneChange: (val: string) => void;
  handleWardChange: (val: string) => void;
  handleOwningDepartmentChange?: (val: string) => void;
  handleAssetCategoryChange: (val: string) => void;
  handleAssetTypeChange: (val: string[]) => void;
  handleOwnershipTypeChange: (val: string) => void;
  handleEncroachmentStatusChange: (val: string) => void;
}

export function AssetRegisterFilterGrid({
  zoneSelectOptions,
  wardSelectOptions,
  departmentSelectOptions = [],
  categorySelectOptions,
  assetTypeSelectOptions,
  ownershipOptions,
  ZoneId,
  WardId,
  DepartmentId,
  categoryId,
  AssetTypeId,
  ownershipType,
  encroachmentStatus,
  handleZoneChange,
  handleWardChange,
  handleOwningDepartmentChange,
  handleAssetCategoryChange,
  handleAssetTypeChange,
  handleOwnershipTypeChange,
  handleEncroachmentStatusChange,
}: AssetRegisterFilterGridProps) {
  const t = useTranslations('assetRegister');

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 p-4 border-t border-slate-100 bg-[#FBFDFE] rounded-b-xl">
      {/* 1. Ward / Zone */}
      <div className="flex flex-col space-y-1">
        <Label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
          {t('Ward_Zone')}
        </Label>
        <div className="grid grid-cols-2 gap-1.5">
          <Select
            options={zoneSelectOptions}
            value={ZoneId || 'all'}
            onChange={(_, val) => handleZoneChange(val || 'all')}
            selectSize="sm"
            className="[&_button]:!h-8 [&_button]:!rounded-lg [&_button]:!border-slate-200 [&_button]:!font-bold [&_button]:!text-xs [&_button]:text-slate-700 hover:[&_button]:!border-slate-300 [&_button]:!shadow-2xs"
          />
          <Select
            options={wardSelectOptions}
            value={WardId || 'all'}
            onChange={(_, val) => handleWardChange(val || 'all')}
            selectSize="sm"
            className="[&_button]:!h-8 [&_button]:!rounded-lg [&_button]:!border-slate-200 [&_button]:!font-bold [&_button]:!text-xs [&_button]:text-slate-700 hover:[&_button]:!border-slate-300 [&_button]:!shadow-2xs"
          />
        </div>
      </div>

      {/* 2. Asset Category */}
      <div className="flex flex-col space-y-1">
        <Label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
          {t('Asset_Category')}
        </Label>
        <Select
          options={categorySelectOptions}
          value={categoryId ? String(categoryId) : 'all'}
          onChange={(_, val) => handleAssetCategoryChange(val || 'all')}
          placeholder={t('All_Asset_Categories')}
          selectSize="sm"
          className="[&_button]:!h-8 [&_button]:!rounded-lg [&_button]:!border-slate-200 [&_button]:!font-bold [&_button]:!text-xs [&_button]:text-slate-700 hover:[&_button]:!border-slate-300 [&_button]:!shadow-2xs"
        />
      </div>

      {/* 3. Asset Type */}
      <div className="flex flex-col space-y-1">
        <Label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
          {t('Asset_Type')}
        </Label>
        <Select
          options={assetTypeSelectOptions}
          value={AssetTypeId || 'all'}
          onChange={(_, val) => handleAssetTypeChange(val === 'all' || !val ? [] : [val])}
          placeholder={!categoryId ? t('Select_Category_First') : t('All_Asset_Types')}
          disabled={!categoryId}
          selectSize="sm"
          className="[&_button]:!h-8 [&_button]:!rounded-lg [&_button]:!border-slate-200 [&_button]:!font-bold [&_button]:!text-xs [&_button]:text-slate-700 hover:[&_button]:!border-slate-300 [&_button]:!shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {/* 4. Owning Department */}
      <div className="flex flex-col space-y-1">
        <Label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
          {t('Owning_Department')}
        </Label>
        <Select
          options={departmentSelectOptions}
          value={DepartmentId || 'all'}
          onChange={(_, val) => handleOwningDepartmentChange?.(val || 'all')}
          placeholder={t('All_Departments')}
          selectSize="sm"
          className="[&_button]:!h-8 [&_button]:!rounded-lg [&_button]:!border-slate-200 [&_button]:!font-bold [&_button]:!text-xs [&_button]:text-slate-700 hover:[&_button]:!border-slate-300 [&_button]:!shadow-2xs"
        />
      </div>

      <AdditionalFilterFields
        ownershipType={ownershipType}
        encroachmentStatus={encroachmentStatus}
        ownershipOptions={ownershipOptions}
        handleOwnershipTypeChange={handleOwnershipTypeChange}
        handleEncroachmentStatusChange={handleEncroachmentStatusChange}
      />
    </div>
  );
}
