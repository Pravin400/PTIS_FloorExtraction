'use client';

import { useTranslations } from 'next-intl';
import { ChevronDown, Filter } from 'lucide-react';
import { Badge, SearchInput, Button } from '@/components/common';
import type { Option } from '@/components/common';
import type { AssetRegisterFiltersProps } from '@/types/asset/asset-register/municipal-asset-register.types';
import { useAssetRegisterFilters } from '@/hooks/asset/asset-register/useAssetRegisterFilters';
import { AssetRegisterFilterGrid } from './filters/AssetRegisterFilterGrid';

export function AssetRegisterFilters({
  search,
  searchField: searchFieldProp,
  AssetNo,
  AssetTypeId,
  ZoneId,
  WardId,
  DepartmentId,
  categoryId,
  ownershipType,
  encroachmentStatus,
  categoryOptions,
  assetTypeOptions,
  zoneOptions,
  wardOptions,
  owningDepartmentOptions,
  ownershipOptions,
  exportButton,
}: AssetRegisterFiltersProps) {
  const t = useTranslations('assetRegister');

  const {
    searchValue,
    showFiltersPanel,
    handleSearchChange,
    handleZoneChange,
    handleWardChange,
    handleOwningDepartmentChange,
    handleAssetCategoryChange,
    handleAssetTypeChange,
    handleOwnershipTypeChange,
    handleEncroachmentStatusChange,
    handleResetFilters,
    handleFiltersPanelToggle,
  } = useAssetRegisterFilters({
    search,
    searchField: searchFieldProp,
    assetNo: AssetNo,
  });

  const zoneSelectOptions: Option[] = [
    { label: t('All_Zones'), value: 'all' },
    ...(zoneOptions || []).filter((opt) => opt.value !== 'all'),
  ];

  const wardSelectOptions: Option[] = [
    { label: t('All_Wards'), value: 'all' },
    ...(wardOptions || []).filter((opt) => opt.value !== 'all'),
  ];

  const departmentSelectOptions: Option[] = [
    { label: t('All_Departments'), value: 'all' },
    ...(owningDepartmentOptions || []).filter((opt) => opt.value !== 'all'),
  ];

  const categorySelectOptions: Option[] = [
    { label: t('All_Asset_Categories'), value: 'all' },
    ...(categoryOptions || []).filter((opt) => opt.value !== 'all'),
  ];

  const assetTypeSelectOptions: Option[] = [
    { label: t('All_Asset_Types'), value: 'all' },
    ...(assetTypeOptions || []).filter((opt) => opt.value !== 'all'),
  ];

  const appliedFiltersCount = [
    AssetTypeId && AssetTypeId !== 'all',
    ZoneId && ZoneId !== 'all',
    WardId && WardId !== 'all',
    DepartmentId && DepartmentId !== 'all',
    ownershipType && ownershipType !== 'all',
    encroachmentStatus && encroachmentStatus !== 'all',
    AssetNo,
  ].filter(Boolean).length;

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs">
      {/* Top Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3">
        {/* Left: Filter title badge */}
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            size="sm"
            icon={Filter}
            className="flex h-auto gap-1.5 rounded-lg border-0 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 [&_svg]:h-3.5 [&_svg]:w-3.5"
          >
            {t('Filters')}
          </Badge>
        </div>

        {/* Center: Search input */}
        <div className="w-full max-w-[340px] flex-1">
          <SearchInput
            value={searchValue ?? ''}
            onChange={handleSearchChange}
            placeholder={t('Search_assets_by_name_id')}
            className="mb-0 w-full [&_input]:!h-8.5 [&_input]:!rounded-xl [&_input]:!border-slate-200 [&_input]:!text-xs [&_input]:placeholder:text-slate-400"
            showClear={false}
          />
        </div>

        {/* Right Action Buttons: badge, collapse/expand toggle, Reset All, Export */}
        <div className="flex items-center gap-2">
          {appliedFiltersCount > 0 && (
            <Badge variant="outline" size="sm" className="inline-flex h-auto gap-0 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-600 border border-blue-100">
              {appliedFiltersCount} {t('Filters')}
            </Badge>
          )}

          <Button
            onClick={handleFiltersPanelToggle}
            variant="secondary"
            size="sm"
            icon={ChevronDown}
            aria-label={showFiltersPanel ? 'Collapse filters' : 'Expand filters'}
            className={`!h-8.5 !w-8.5 !min-w-0 !rounded-lg !border-slate-200 !p-0 !text-slate-500 hover:!bg-slate-50 hover:!border-slate-300 [&_svg]:transition-transform ${
              !showFiltersPanel ? '[&_svg]:rotate-180' : ''
            }`}
          />

          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetFilters}
            className="!h-8.5 !rounded-lg border border-red-200 !bg-red-50/60 !px-3 !gap-0 !text-xs !font-bold !text-red-600 hover:!bg-red-100 hover:border-red-300 !whitespace-normal !transition-colors !duration-150 cursor-pointer focus:!ring-0 focus:!ring-offset-0 focus-visible:![outline-style:auto]"
          >
            {t('Reset_All')}
          </Button>

          {exportButton && <div className="flex-shrink-0">{exportButton}</div>}
        </div>
      </div>

      {/* Grid of Filters */}
      {showFiltersPanel && (
        <AssetRegisterFilterGrid
          zoneSelectOptions={zoneSelectOptions}
          wardSelectOptions={wardSelectOptions}
          departmentSelectOptions={departmentSelectOptions}
          categorySelectOptions={categorySelectOptions}
          assetTypeSelectOptions={assetTypeSelectOptions}
          ownershipOptions={ownershipOptions}
          ZoneId={ZoneId}
          WardId={WardId}
          DepartmentId={DepartmentId}
          categoryId={categoryId}
          AssetTypeId={AssetTypeId}
          ownershipType={ownershipType}
          encroachmentStatus={encroachmentStatus}
          handleZoneChange={handleZoneChange}
          handleWardChange={handleWardChange}
          handleOwningDepartmentChange={handleOwningDepartmentChange}
          handleAssetCategoryChange={handleAssetCategoryChange}
          handleAssetTypeChange={handleAssetTypeChange}
          handleOwnershipTypeChange={handleOwnershipTypeChange}
          handleEncroachmentStatusChange={handleEncroachmentStatusChange}
        />
      )}
    </div>
  );
}
