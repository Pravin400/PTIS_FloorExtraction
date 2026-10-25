'use client';

import React from 'react';
import { SearchSelect, type SearchSelectOption, Input } from '@/components/common';
import { UpdateButton, SearchButton } from '@/components/common/ActionButtons';
import FloorTable from '../FloorTable';
import SelectPropertiesTable from '../SelectPropertiesTable';
import { FloorData } from '@/types/room-details.types';
import { LookupData } from '@/lib/utils/floorSubmission/floor-mappers';
import type { SelectableProperty } from '@/types/floor-details.types';

import { useAliasLabel } from '@/lib/providers/AliasLabelsProvider';

interface PropertyWiseTabProps {
  t: (key: string, values?: Record<string, string | number | Date>) => string;
  properties: SelectableProperty[];
  selectedIds: Set<string | number>;
  onToggle: (id: string | number) => void;
  onClearSelection: () => void;
  onToggleMultiple?: (ids: Array<string | number>, select: boolean) => void;
  isLoading: boolean;
  disabledIds: Set<string | number>;
  sourcePropertyIds: Set<string | number>;
  isApplying: boolean;
  onApply: () => void;

  // Search props
  wardOptions: SearchSelectOption[];
  searchWardId: string;
  handleWardChange: (name: string | undefined, value: string) => void;
  isFetchingWards: boolean;
  searchPropertyNo: string;
  setSearchPropertyNo: (val: string) => void;
  sanitizeWardNo: (val: string) => string;
  sanitizePropertyNo: (val: string) => string;
  handleSearchProperties: () => void;

  // FloorTable props
  filteredFloors: FloorData[];
  floorSearch: string;
  setFloorSearch: (val: string) => void;
  selectedFloor: FloorData | null;
  setSelectedFloor: (val: FloorData | null) => void;
  isAddingNewFloor: boolean;
  setIsAddingNewFloor: (val: boolean) => void;
  handleAddFloor: () => void;
  updateUrlParams: (params: Record<string, string | null>) => void;
  handleDeleteFloor: (floor: FloorData) => void;
  startTransition: (fn: () => void) => void;
  setFormErrors: (errors: Record<string, string>) => void;
  floorLookup: LookupData[];
  subFloorLookup: LookupData[];
  constructionLookup: LookupData[];
  useLookup: LookupData[];
  subTypeData: LookupData[];
  setEditingFloorForm: (val: FloorData) => void;
}

export const PropertyWiseTab: React.FC<PropertyWiseTabProps> = ({
  t,
  properties,
  selectedIds,
  onToggle,
  onClearSelection,
  onToggleMultiple,
  isLoading,
  disabledIds,
  sourcePropertyIds,
  isApplying,
  onApply,
  wardOptions,
  searchWardId,
  handleWardChange,
  isFetchingWards,
  searchPropertyNo,
  setSearchPropertyNo,
  sanitizeWardNo,
  sanitizePropertyNo,
  handleSearchProperties,
  ...floorTableProps
}) => {
  const wardLabel = useAliasLabel('Ward', t('aliasFallback.ward'));
  const propertyNoLabel = useAliasLabel('Property_No', t('aliasFallback.propertyNo'));

  return (
    <>
      <FloorTable
        {...floorTableProps}
        t={t}
        handleOpenDataEntrySameAs={() => {}}
        viewOnly
      />

      <div className="flex items-end gap-3 mt-3 px-1 mb-3">
        <div className="w-44 relative [&_ul]:top-full [&_ul]:!z-30">
          <SearchSelect
            id="property-wise-search-ward-id"
            label={wardLabel}
            options={wardOptions}
            value={searchWardId}
            onChange={handleWardChange}
            sanitizeInput={sanitizeWardNo}
            className="h-8 text-xs"
            isLoading={isFetchingWards}
            loadingPlaceholder={t('search.loading')}
            noOptionsPlaceholder={t('search.noOptionsAvailable')}
          />
        </div>
        <div className="w-24 flex flex-col justify-end">
          <Input
            id="property-wise-search-property-no"
            label={propertyNoLabel}
            value={searchPropertyNo}
            onChange={(e) => setSearchPropertyNo(sanitizePropertyNo(e.target.value))}
            className="h-8 px-2 w-full text-xs font-semibold text-slate-700 bg-white border rounded shadow-sm text-center placeholder:text-slate-400 transition-colors border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed disabled:border-slate-200"
            disabled={!searchWardId}
            placeholder={propertyNoLabel}
          />
        </div>
        <SearchButton
          type="button"
          onClick={handleSearchProperties}
          disabled={!searchWardId || !searchPropertyNo.trim() || isLoading}
          label={t('floor.selectProperties.search')}
          size="sm"
          className="h-8 px-4 text-xs font-semibold rounded-md"
        />
      </div>

      <SelectPropertiesTable
        t={t}
        properties={properties}
        selectedIds={selectedIds}
        onToggle={onToggle}
        onClearSelection={onClearSelection}
        onToggleMultiple={onToggleMultiple}
        isLoading={isLoading}
        disabledIds={disabledIds}
        sourcePropertyIds={sourcePropertyIds}
        hideTypeColumn={true}
      />

      <div className="flex justify-end mt-4 px-1">
        <UpdateButton
          type="button"
          size="sm"
          label={isApplying ? t('floor.selectProperties.applying') : t('floor.selectProperties.applyPropertyButton')}
          onClick={onApply}
          disabled={!Array.from(selectedIds).some((id) => !sourcePropertyIds.has(id)) || isApplying}
          isLoading={isApplying}
          className="h-9 px-5 text-xs font-semibold rounded-md"
        />
      </div>
    </>
  );
};
