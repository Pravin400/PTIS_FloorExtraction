'use client';

import React from 'react';
import { Badge, Drawer, Input, Select } from '@/components/common';
import { UpdateButton } from '@/components/common/ActionButtons';
import FloorTable from '../FloorTable';
import SelectPropertiesTable from '../SelectPropertiesTable';
import { FloorData } from '@/types/room-details.types';
import { LookupData } from '@/lib/utils/floorSubmission/floor-mappers';
import { sanitizeNumericInput } from '@/lib/utils/input-sanitization';
import type { SelectableProperty } from '@/types/floor-details.types';

interface TypeWiseTabProps {
  t: (key: string, values?: Record<string, string | number | Date>) => string;
  currentPropertyType?: string;
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
  changeTypeInput: string;
  setChangeTypeInput: (val: string) => void;
  isApplyingTypeSubmission: boolean;
  onApplyTypeSubmission: () => void;

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

export const TypeWiseTab: React.FC<TypeWiseTabProps> = ({
  t,
  currentPropertyType,
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
  changeTypeInput,
  setChangeTypeInput,
  isApplyingTypeSubmission,
  onApplyTypeSubmission,
  ...floorTableProps
}) => {
  const [isChangeTypeDrawerOpen, setIsChangeTypeDrawerOpen] = React.useState(false);

  // Independent type filter state for Change Type drawer — separate from the main tab's state
  const [drawerTypeFilter, setDrawerTypeFilter] = React.useState<string>('all');

  const isApplyTypeDisabled = React.useMemo(() => {
    return selectedIds.size === 0;
  }, [selectedIds]);

  const isChangeTypeDisabled = React.useMemo(() => {
    // Apply button is disabled if no destination property (non-source) is selected
    return !Array.from(selectedIds).some((id) => !sourcePropertyIds.has(id));
  }, [selectedIds, sourcePropertyIds]);

  // Local state for Change Type text input to avoid input loop bug
  // Initialize as empty string by default instead of currentPropertyType
  const [inputValue, setInputValue] = React.useState(changeTypeInput || '');

  // Track previous value of changeTypeInput to sync state during render (recommended React pattern)
  const [prevChangeTypeInput, setPrevChangeTypeInput] = React.useState(changeTypeInput);
  if (changeTypeInput !== prevChangeTypeInput) {
    setInputValue(changeTypeInput || '');
    if (!changeTypeInput) {
      setDrawerTypeFilter('all');
    }
    setPrevChangeTypeInput(changeTypeInput);
  }

  // Extract unique sorted types from loaded properties for the dropdown options
  // Use || instead of ?? so that empty-string typeLabel also falls back to type
  const availableTypes = React.useMemo(() => {
    const typeMap = new Map<string, string>(); // type -> typeLabel
    properties.forEach((p) => {
      const val = String(p.type || '').trim();
      const label = String(p.typeLabel || p.type || '').trim();
      if (val && val !== '-' && label && label !== '-') {
        typeMap.set(val, label);
      }
    });
    return Array.from(typeMap.entries()).map(([value, label]) => ({
      value,
      label
    })).sort((a, b) =>
      a.label.localeCompare(b.label, undefined, { numeric: true, sensitivity: 'base' })
    );
  }, [properties]);

  // Options list for the common Select component
  const filterOptions = React.useMemo(() => {
    const list = [
      { label: t('floor.selectProperties.allTypes') || 'All Types', value: 'all' }
    ];
    availableTypes.forEach((item) => {
      list.push({ label: item.label, value: item.value });
    });
    return list;
  }, [availableTypes, t]);

  // Filter table rows based on selected type dropdown (used inside Change Type drawer)
  // This is keyed off drawerTypeFilter, independent of main tab filters
  const drawerFilteredProperties = React.useMemo(() => {
    if (drawerTypeFilter === 'all') return properties;
    return properties.filter((p) => {
      const raw = String(p.type || '').trim();
      return raw === drawerTypeFilter;
    });
  }, [properties, drawerTypeFilter]);

  // Filter table rows for main TypeWise tab layout (only properties matching the main property's type)
  const sameTypeProperties = React.useMemo(() => {
    if (!currentPropertyType) return properties;
    const targetType = String(currentPropertyType).trim();
    return properties.filter((p) => {
      const raw = String(p.type || '').trim();
      return raw === targetType;
    });
  }, [properties, currentPropertyType]);

  // When a type is chosen from dropdown inside Change Type drawer → auto-fill CHANGE TYPE input + update drawer filter
  // Also clears selection to avoid mismatch between visible and selected-but-hidden rows
  const handleTypeFilterChange = React.useCallback(
    (val: string) => {
      setDrawerTypeFilter(val);
      onClearSelection(); // Reset selection on filter change — prevents hidden-row selection confusion
      if (val !== 'all') {
        setChangeTypeInput(val);
      } else {
        setChangeTypeInput('');
      }
    },
    [setChangeTypeInput, onClearSelection]
  );


  // ── Render dropdown to be placed on the left side of the Change Type drawer table header ──────────
  const typeFilterDropdown = (
    <div className="flex items-center gap-1.5 ml-3 font-normal text-slate-700">
      <Badge variant="secondary" className="uppercase tracking-wide text-[9px] whitespace-nowrap bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-50">
        {t('floor.selectProperties.selectType') || 'Filter Type'}
      </Badge>
      <Select
        options={filterOptions}
        value={drawerTypeFilter}
        onChange={(_, val) => handleTypeFilterChange(val)}
        disabled={isLoading || availableTypes.length === 0}
        selectSize="sm"
        placeholder={t('floor.selectProperties.allTypes') || 'All Types'}
        className="w-[120px] text-[11px]"
        ariaLabel={t('floor.selectProperties.selectType') || 'Select Type'}
      />
    </div>
  );

  return (
    <>
      <FloorTable
        {...floorTableProps}
        t={t}
        handleOpenDataEntrySameAs={() => { }}
        viewOnly
      />

      <div className="mt-3 px-3 py-2 bg-blue-50 border border-blue-100 rounded text-[12px] font-medium text-red-700 shadow-sm">
        {t('floor.selectProperties.typeWiseInstruction')}
      </div>

      {/* ── Change Type Drawer Trigger ───────────────────────────────── */}
      <div className="flex justify-end items-center gap-3 mt-3 px-1">
        <UpdateButton
          type="button"
          size="sm"
          label={t('floor.selectProperties.changeType') || 'CHANGE TYPE'}
          onClick={() => {
            setDrawerTypeFilter('all');  // Always reset drawer filter to 'all' on open
            setIsChangeTypeDrawerOpen(true);
          }}
          className="h-9 px-5 text-xs font-semibold rounded-md uppercase tracking-wide bg-blue-600 hover:bg-blue-700 text-white"
        />
      </div>

      {/* ── Change Type Drawer ────────────────────────────────────────── */}
      <Drawer
        open={isChangeTypeDrawerOpen}
        onClose={() => setIsChangeTypeDrawerOpen(false)}
        title={(
          <h2 className="text-[15px] font-bold leading-tight text-slate-800">
            {t('floor.selectProperties.changeType') || 'CHANGE TYPE'}
          </h2>
        )}
        width="lg"
      >
        <div className="flex flex-col h-full p-4 bg-slate-50 gap-4 overflow-y-auto">
          {/* Change Type Input + Apply Types Row */}
          <div className="flex items-center gap-3 p-3.5 bg-white border border-slate-200 rounded-lg shadow-xs flex-wrap">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="uppercase tracking-wide text-[10px] whitespace-nowrap">
                {t('floor.selectProperties.changeType')}
              </Badge>
              <Input
                type="text"
                inputMode="numeric"
                maxLength={2}
                value={inputValue}
                onChange={(e) => {
                  const val = sanitizeNumericInput(e.target.value).slice(0, 2);
                  setInputValue(val);
                  setChangeTypeInput(val);
                }}
                onFocus={(e) => {
                  e.target.select();
                }}
                className={`h-8 w-16 rounded border border-slate-200 px-2 text-xs font-semibold text-center outline-none transition-colors bg-white text-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500`}
                aria-label={t('floor.selectProperties.changeType')}
              />
            </div>

            {/* Apply Types button */}
            <UpdateButton
              type="button"
              size="sm"
              label={isApplying ? t('floor.selectProperties.applying') : t('floor.selectProperties.applyTypesButton')}
              onClick={onApply}
              disabled={isApplyTypeDisabled || isApplying}
              isLoading={isApplying}
              className="h-9 px-5 text-xs font-semibold rounded-md"
            />
          </div>

          {/* Properties Table inside Change Type Drawer — always shows all types, with optional drawer-local filter */}
          <SelectPropertiesTable
            t={t}
            properties={drawerFilteredProperties}
            selectedIds={selectedIds}
            onToggle={onToggle}
            onClearSelection={onClearSelection}
            onToggleMultiple={onToggleMultiple}
            isLoading={isLoading}
            disabledIds={disabledIds}
            sourcePropertyIds={sourcePropertyIds}
            leftHeaderContent={typeFilterDropdown}
          />
        </div>
      </Drawer>

      {/* ── Properties Table (filtered by main property type) ─────────────────── */}
      <SelectPropertiesTable
        t={t}
        properties={sameTypeProperties}
        selectedIds={selectedIds}
        onToggle={onToggle}
        onClearSelection={onClearSelection}
        onToggleMultiple={onToggleMultiple}
        isLoading={isLoading}
        disabledIds={disabledIds}
        sourcePropertyIds={sourcePropertyIds}
      />

      {/* Apply Type Submission button */}
      <div className="flex justify-end mt-4 px-1">
        <UpdateButton
          type="button"
          size="sm"
          label={isApplyingTypeSubmission ? t('floor.selectProperties.applying') : t('floor.selectProperties.applyTypeSubmission')}
          onClick={onApplyTypeSubmission}
          disabled={isChangeTypeDisabled || isApplyingTypeSubmission}
          isLoading={isApplyingTypeSubmission}
          className="h-9 px-5 text-xs font-semibold rounded-md"
        />
      </div>

      {/* Note */}
      <div className="mt-4 px-3.5 py-3 bg-slate-100/60 border border-slate-200 rounded-md text-[11px] flex flex-col gap-1.5 shadow-sm">
        <p className="font-bold text-red-700 text-xs">{t('floor.selectProperties.typeClassificationNoteTitle')}</p>
        <p className="text-red-600 font-semibold">
          {t('floor.selectProperties.typeClassificationNote')}
        </p>
      </div>
    </>
  );
};
