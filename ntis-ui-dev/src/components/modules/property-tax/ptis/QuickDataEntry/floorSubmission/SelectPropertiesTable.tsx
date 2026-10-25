'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { Checkbox, MasterTable, type Column } from '@/components/common';
import { ClearButton } from '@/components/common/ActionButtons';
import type { SelectableProperty } from '@/types/floor-details.types';
import { useAliasLabel } from '@/lib/providers/AliasLabelsProvider';

interface SelectPropertiesTableProps {
  t: (key: string, values?: Record<string, string | number>) => string;
  properties: SelectableProperty[];
  selectedIds: Set<string | number>;
  onToggle: (id: string | number) => void;
  onClearSelection: () => void;
  onToggleMultiple?: (ids: Array<string | number>, select: boolean) => void;
  isLoading?: boolean;
  disabledIds?: Set<string | number>;
  sourcePropertyIds?: Set<string | number>;
  hideTypeColumn?: boolean;
  leftHeaderContent?: React.ReactNode;
  /** 'default' shows CarpetArea + BuildupArea columns; 'parking' shows ParkingCarpetArea + ParkingBuiltupArea columns */
  variant?: 'default' | 'parking';
}

type SelectablePropertyRow = Record<string, unknown> &
  SelectableProperty & {
    selected: boolean;
    disabled: boolean;
    selection: string;
    propertyDisplay: string;
    categoryDisplay: string;
    typeDisplay: string;
    carpetAreaDisplay: string;
    builtupAreaDisplay: string;
    parkingCarpetAreaDisplay: string;
    parkingBuiltupAreaDisplay: string;
  };

const greenRowClassName =
  '!bg-green-100 [&>td]:!bg-green-100 hover:!bg-green-200 hover:[&>td]:!bg-green-200';


function formatPropertyDisplay(property: SelectableProperty): string {
  const parts = [property.wardNo, property.propertyNo, property.partitionNo]
    .map((v) => String(v ?? '').trim())
    .filter((v) => v && v !== '-');

  return parts.length > 0 ? parts.join('-') : '-';
}

function formatCategoryDisplay(property: SelectableProperty): string {
  const cat = String(property.categoryName ?? '').trim();
  return cat && cat !== '-' ? cat : '-';
}

function formatPropertyTypeDisplay(property: SelectableProperty): string {
  const label = String(property.typeLabel ?? '').trim();
  if (label) return label;

  const rawType = String(property.type ?? '').trim();
  if (!rawType || rawType === '-') return '-';
  return rawType;
}

function formatCarpetAreaDisplay(property: SelectableProperty): string {
  const sqFeet = property.carpetAreaSqFeet;
  const sqMeter = property.carpetAreaSqMeter;
  if (sqFeet == null && sqMeter == null) return '-';
  return `${sqFeet != null ? Number(sqFeet).toFixed(2) : '0.00'} / ${sqMeter != null ? Number(sqMeter).toFixed(2) : '0.00'}`;
}

function formatBuiltupAreaDisplay(property: SelectableProperty): string {
  const sqFeet = property.builtupAreaSqFeet;
  const sqMeter = property.builtupAreaSqMeter;
  if (sqFeet == null && sqMeter == null) return '-';
  return `${sqFeet != null ? Number(sqFeet).toFixed(2) : '0.00'} / ${sqMeter != null ? Number(sqMeter).toFixed(2) : '0.00'}`;
}

function formatParkingCarpetAreaDisplay(property: SelectableProperty): string {
  const sqFeet = property.parkingCarpetAreaSqFeet;
  const sqMeter = property.parkingCarpetAreaSqMeter;
  if (sqFeet == null && sqMeter == null) return '-';
  return `${sqFeet != null ? Number(sqFeet).toFixed(2) : '0.00'} / ${sqMeter != null ? Number(sqMeter).toFixed(2) : '0.00'}`;
}

function formatParkingBuiltupAreaDisplay(property: SelectableProperty): string {
  const sqFeet = property.parkingBuiltupAreaSqFeet;
  const sqMeter = property.parkingBuiltupAreaSqMeter;
  if (sqFeet == null && sqMeter == null) return '-';
  return `${sqFeet != null ? Number(sqFeet).toFixed(2) : '0.00'} / ${sqMeter != null ? Number(sqMeter).toFixed(2) : '0.00'}`;
}

const SelectPropertiesTable: React.FC<SelectPropertiesTableProps> = ({
  t,
  properties,
  selectedIds,
  onToggle,
  onClearSelection,
  onToggleMultiple,
  isLoading = false,
  disabledIds = new Set(),
  sourcePropertyIds = new Set(),
  hideTypeColumn = false,
  leftHeaderContent,
  variant = 'default',
}) => {
  const propertyLabel = useAliasLabel('Property_No', t('aliasFallback.propertyNo'));
  const categoryLabel = useAliasLabel('Category', t('aliasFallback.category'));
  const typeLabel = useAliasLabel('Type_Of_Use', t('aliasFallback.typeOfUse'));
  const wingLabel = useAliasLabel('Wing', t('aliasFallback.wing'));
  const flatNoLabel = useAliasLabel('Flat_No_Shop_No', t('aliasFallback.flatNoShopNo'));
  const carpetAreaLabel = useAliasLabel('Carpet_Area', t('aliasFallback.carpetArea'));
  const builtupAreaLabel = useAliasLabel('Builtup_Area', t('aliasFallback.builtupArea'));
  const parkingCarpetAreaLabel = useAliasLabel('Carpet_Area', t('aliasFallback.carpetArea'));
  const parkingBuiltupAreaLabel = useAliasLabel('Builtup_Area', t('aliasFallback.builtupArea'));

  const selectedCount = selectedIds.size;
  const selectableProperties = React.useMemo(
    () => properties.filter((property) => !disabledIds.has(property.id)),
    [disabledIds, properties]
  );
  const allSelected =
    selectableProperties.length > 0 && selectableProperties.every((property) => selectedIds.has(property.id));
  const someSelected = selectedCount > 0 && !allSelected;

  const tableData = React.useMemo<SelectablePropertyRow[]>(
    () =>
      properties.map((property) => ({
        ...property,
        selected: selectedIds.has(property.id),
        disabled: disabledIds.has(property.id),
        selection: String(property.id),
        propertyDisplay: formatPropertyDisplay(property),
        categoryDisplay: formatCategoryDisplay(property),
        typeDisplay: formatPropertyTypeDisplay(property),
        carpetAreaDisplay: formatCarpetAreaDisplay(property),
        builtupAreaDisplay: formatBuiltupAreaDisplay(property),
        parkingCarpetAreaDisplay: formatParkingCarpetAreaDisplay(property),
        parkingBuiltupAreaDisplay: formatParkingBuiltupAreaDisplay(property),
      })),
    [disabledIds, properties, selectedIds]
  );

  const handleSelectAll = React.useCallback(() => {
    if (allSelected) {
      onClearSelection();
      return;
    }

    if (onToggleMultiple) {
      const idsToSelect = selectableProperties
        .filter((property) => !selectedIds.has(property.id))
        .map((property) => property.id);
      onToggleMultiple(idsToSelect, true);
    } else {
      selectableProperties.forEach((property) => {
        if (!selectedIds.has(property.id)) onToggle(property.id);
      });
    }
  }, [allSelected, onClearSelection, onToggle, onToggleMultiple, selectableProperties, selectedIds]);

  const checkboxClassName =
    'h-4 w-4 border-slate-400 bg-white text-white data-[state=checked]:border-slate-800 data-[state=checked]:bg-slate-800 data-[state=indeterminate]:border-slate-800 data-[state=indeterminate]:bg-slate-800 [&_svg]:h-3.5 [&_svg]:w-3.5 [&_svg]:stroke-[3.5] disabled:opacity-100 disabled:border-slate-700 disabled:data-[state=checked]:bg-slate-700';

  const columns = React.useMemo<Column<SelectablePropertyRow>[]>(
    () => [
      {
        key: 'selection',
        label: (
          <Checkbox
            checked={allSelected}
            indeterminate={someSelected}
            onCheckedChange={handleSelectAll}
            className={checkboxClassName}
            aria-label={t('floor.selectProperties.selectAll')}
          />
        ),
        width: '44px',
        align: 'center',
        render: (_value, row) => (
          <Checkbox
            checked={row.selected}
            disabled={row.disabled}
            onCheckedChange={() => {
              if (!row.disabled) onToggle(row.id);
            }}
            onClick={(event) => event.stopPropagation()}
            className={checkboxClassName}
            aria-label={t('floor.selectProperties.selectProperty', { propertyNo: row.propertyNo })}
          />
        ),
      },
      {
        key: 'propertyDisplay',
        label: propertyLabel,
        width: '150px',
        cellClassName: 'whitespace-nowrap text-sm font-bold text-slate-800',
      },
      {
        key: 'categoryDisplay',
        label: categoryLabel,
        width: '110px',
        align: 'center',
        cellClassName: 'whitespace-nowrap text-sm font-bold text-slate-800',
      },
      ...(hideTypeColumn
        ? []
        : [
            {
              key: 'typeDisplay',
              label: typeLabel,
              width: '70px',
              cellClassName: 'whitespace-nowrap text-sm font-bold text-slate-800',
            },
          ]),
      {
        key: 'wingFlatNo',
        label: `${wingLabel}/${flatNoLabel}`,
        width: '100px',
        align: 'center',
        cellClassName: 'whitespace-nowrap text-sm font-bold text-slate-800',
        render: (_value, row) => {
          const wing = row.wing ? String(row.wing).trim() : '';
          const flat = row.flatNo ? String(row.flatNo).trim() : '-';
          
          if (wing && wing !== '-') {
            return `${wing}-${flat}`;
          }
          return flat;
        }
      },
      // Default variant: show CarpetArea + BuiltupArea; Parking variant: show ParkingCarpetArea + ParkingBuiltupArea
      ...(variant === 'parking'
        ? [
            {
              key: 'parkingCarpetAreaDisplay',
              label: parkingCarpetAreaLabel,
              width: '180px',
              cellClassName: 'whitespace-nowrap text-sm font-bold text-slate-800',
            },
            {
              key: 'parkingBuiltupAreaDisplay',
              label: parkingBuiltupAreaLabel,
              width: '180px',
              cellClassName: 'whitespace-nowrap text-sm font-bold text-slate-800',
            },
          ]
        : [
            {
              key: 'carpetAreaDisplay',
              label: carpetAreaLabel,
              width: '155px',
              cellClassName: 'whitespace-nowrap text-sm font-bold text-slate-800',
            },
            {
              key: 'builtupAreaDisplay',
              label: builtupAreaLabel,
              width: '155px',
              cellClassName: 'whitespace-nowrap text-sm font-bold text-slate-800',
            },
          ]),
    ],
    [allSelected, builtupAreaLabel, carpetAreaLabel, categoryLabel, checkboxClassName, flatNoLabel, handleSelectAll, hideTypeColumn, onToggle, parkingBuiltupAreaLabel, parkingCarpetAreaLabel, propertyLabel, someSelected, t, typeLabel, variant, wingLabel]
  );

  const headerExtra =
    selectedCount > 0 ? (
      <div className="ml-auto flex items-center gap-2">
        <span className="px-2 py-0.5 text-slate-800 rounded-full text-sm font-bold">
          {t('floor.selectProperties.selected', { count: selectedCount })}
        </span>
        <ClearButton
          type="button"
          label={t('floor.selectProperties.clearSelection')}
          onClick={onClearSelection}
          className="h-7 px-2.5 text-[11px] font-semibold rounded-md"
        />
      </div>
    ) : null;

  return (
    <div className="mt-3">
      {isLoading && (
        <div className="mb-2 flex items-center gap-2 rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-800">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{t('floor.selectProperties.loading')}</span>
        </div>
      )}
      <MasterTable<SelectablePropertyRow>
        columns={columns}
        data={tableData}
        loading={isLoading}
        getRowKey={(row) => row.id}
        onRowClick={(row) => {
          if (!row.disabled) onToggle(row.id);
        }}
        rowClassName={(row) => {
          const isSource = sourcePropertyIds.has(row.id);
          if (isSource) {
            return greenRowClassName + ' font-bold border-l-4 border-l-green-600 bg-green-100 !bg-green-100 [&>td]:!bg-green-100';
          }
          if (row.disabled) {
            return 'opacity-60 bg-slate-50 cursor-not-allowed border-l-4 border-l-transparent';
          }
          if (row.selected) {
            return greenRowClassName;
          }
          return 'border-l-4 border-l-transparent';
        }}
        headerTitle={t('floor.selectProperties.title')}
        headerExtra={
          <div className="flex items-center justify-between w-full select-properties-header-extra">
            <div className="flex items-center">
              {leftHeaderContent}
            </div>
            {headerExtra}
          </div>
        }
        emptyText={t('floor.selectProperties.noProperties')}
        loadingText={t('floor.selectProperties.loading')}
        containerClassName="md:[&_div:has(>h3)]:w-auto md:[&_div:has(>.select-properties-header-extra)]:w-auto md:[&_div:has(>.select-properties-header-extra)]:grow"
        tableClassName="table-fixed text-xs [&_th]:px-3 [&_td]:px-3"
        maxBodyHeightClassName="min-h-[200px] max-h-[260px]"
      />
    </div>
  );
};

export default SelectPropertiesTable;


