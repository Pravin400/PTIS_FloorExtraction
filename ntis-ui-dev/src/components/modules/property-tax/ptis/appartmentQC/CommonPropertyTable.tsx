'use client';

import { useMemo, useCallback, useState, useRef } from 'react';
import type { MouseEventHandler } from 'react';
import { useTranslations } from 'next-intl';
import { ApartmentQCMasterTable, type Column } from './ApartmentQCMasterTable';
import { SearchInput } from '@/components/common';
import { ArrowDown, ArrowUp, ArrowUpDown, ExternalLink } from 'lucide-react';
import { useTableAutoScroll } from '@/hooks/apartmentQc/useTableAutoScroll';
import { ColumnFilterDropdown, type FilterField } from './ColumnFilterDropdown';
import { Tooltip } from '@/components/common/Tooltip';
import { groupApartmentData } from './apartmentQC.utils';
import { useExcelExport } from '@/hooks/apartmentQc/useExcelExport';

import { ExportIconButton, EyeIconButton } from '@/components/common/ActionButtons';
import { SEARCH_ALPHANUMERIC_SANITIZE } from '@/lib/utils/validation-rules';
import { cn } from '@/lib/utils/cn';

type ColumnWithTooltip<T extends Record<string, unknown>> = Omit<Column<T>, 'key'> & {
  headerTooltip?: boolean | string;
  key?: string;
};

// Map column keys to filter fields
const FILTERABLE_COLUMNS: Record<string, FilterField> = {
  wing: 'wing',
  flatOrShopNo: 'flatOrShopNo',
  propertyTypeName: 'propertyType',
  apartmentType: 'apartmentType',
};

const SORT_COLUMN_KEYS: Record<string, string> = {
  id: 'Id',
  taxZoneId: 'TaxZoneId',
  wardId: 'WardId',
  propertyNo: 'PropertyNo',
  partitionNo: 'PartitionNo',
  mobileNo: 'MobileNo',
  emailId: 'EmailId',
  flatOrShopNo: 'FlatOrShopNo',
  flatOrShopName: 'FlatOrShopName',
  flatOrShopNoEnglish: 'FlatOrShopNoEnglish',
  flatOrShopNameEnglish: 'FlatOrShopNameEnglish',
  ownerName: 'OwnerName',
  ownerNameEnglish: 'OwnerNameEnglish',
  occupierName: 'OccupierName',
  occupierNameEnglish: 'OccupierNameEnglish',
  partType: 'PartType',
  propertyType: 'PropertyType',
  propertyTypeName: 'PropertyTypeName',
  bhk: 'BHK',
  wing: 'Wing',
  apartmentType: 'ApartmentType',
};


interface FilterOption {
  value: string;
  label: string;
}

type SortDirection = 'asc' | 'desc' | null;

function ApartmentSortButton({
  label,
  sortDirection,
  onClick,
  ariaLabel,
}: {
  label: string;
  sortDirection: SortDirection;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  ariaLabel: string;
}) {
  const Icon =
    sortDirection === 'asc' ? ArrowUp : sortDirection === 'desc' ? ArrowDown : ArrowUpDown;

  const IconSize = 12;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="inline-flex items-center justify-center p-1 gap-1 w-full h-full  text-[11px] font-semibold text-white bg-transparent hover:bg-transparent"
    >
      <span className="truncate ">{label}</span>
      {Icon && <Icon size={IconSize} />}
    </button>
  );
}

type CommonPropertyTableProps<T extends Record<string, unknown>> = {
  columns: Column<T>[];
  data: T[];
  title: string;
  activeTab: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onRowClick: (row: T) => void;
  loading?: boolean;
  isAutoScrolling: boolean;
  onToggleAutoScroll: () => void;
  pageNumber?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  _applyTypeColors?: boolean;
  // Filter props
  activeFilters?: Record<FilterField, string[]>;
  onFilterChange?: (field: FilterField, values: string[]) => void;
  onFetchFilterOptions?: (field: FilterField) => Promise<FilterOption[]>;
  sortBy?: string;
  sortOrder?: string;
  onSort?: (columnKey: string) => void;
  // Excel export props
  wardId?: string;
  propertyNo?: string;
};

function CommonPropertyTable<T extends Record<string, unknown>>({
  columns,
  data,
  title,
  activeTab,
  searchQuery,
  onSearchChange,
  onRowClick,
  loading = false,
  isAutoScrolling,
  onToggleAutoScroll,
  pageNumber = 1,
  pageSize = 5,
  totalCount,
  totalPages,
  onPageChange,
  onPageSizeChange,
  activeFilters = {} as Record<FilterField, string[]>,
  onFilterChange,
  onFetchFilterOptions,
  sortBy,
  sortOrder,
  onSort,
  wardId,
  propertyNo,
}: CommonPropertyTableProps<T>) {
  const t = useTranslations('appartmentQC');
  const tCommon = useTranslations('common');
  useTableAutoScroll(isAutoScrolling);

  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [isTableExpanded, setIsTableExpanded] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { isExporting, handleExcelExport } = useExcelExport({ wardId, propertyNo });

  // Derive filter options from the current data (only values actually appearing in the columns)
  const localFilterOptions = useMemo(() => {
    const optionsMap: Record<string, FilterOption[]> = {};

    for (const [colKey, field] of Object.entries(FILTERABLE_COLUMNS)) {
      const values = new Set<string>();
      data.forEach((row) => {
        const rawVal = row[colKey] as string | number | null | undefined;
        if (rawVal !== null && rawVal !== undefined && rawVal !== '') {
          values.add(String(rawVal));
        }
      });
      optionsMap[field] = Array.from(values)
        .sort((a, b) => a.localeCompare(b))
        .map((v) => ({ value: v, label: v }));
    }
    return optionsMap;
  }, [data]);

  // Local fetch function that returns only values present in the current column data
  const handleLocalFetchFilterOptions = useCallback(
    async (field: FilterField): Promise<FilterOption[]> => {
      if (onFetchFilterOptions) {
        return onFetchFilterOptions(field);
      }
      return localFilterOptions[field] || [];
    },
    [localFilterOptions, onFetchFilterOptions]
  );

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const query = searchQuery.toLowerCase();
    return data.filter((row) =>
      Object.values(row).some((val) => val?.toString().toLowerCase().includes(query))
    );
  }, [data, searchQuery]);

  const groupedData = useMemo(
    () => groupApartmentData(filteredData, pageNumber, pageSize),
    [filteredData, pageNumber, pageSize]
  );

  const styledColumns: Column<T>[] = useMemo(
    () =>
      columns.map((col) => {
        const filterField = FILTERABLE_COLUMNS[col.key as string];
        const columnLabel = String(col.label);
        const sortColumnKey = SORT_COLUMN_KEYS[col.key as string] || String(col.key);
        const sortDirection: SortDirection =
          sortBy === sortColumnKey && (sortOrder === 'asc' || sortOrder === 'desc')
            ? sortOrder
            : null;
        const isFilterable = !!filterField && !!onFilterChange;
        const hasActiveFilter = filterField && activeFilters[filterField]?.length > 0;

        const isPropertyNo = col.key === 'propertyNo';
        const isOldPropertyNo = col.key === 'oldPropertyNo';
        
        // Allow sorting for all columns defined in SORT_COLUMN_KEYS
        const disableSort = !Object.prototype.hasOwnProperty.call(SORT_COLUMN_KEYS, col.key as string);


        const sortButton = disableSort ? (
          <span className="inline-flex items-center justify-center p-1 gap-1 w-full h-full text-[11px] font-semibold text-white">
            <span className="truncate">{columnLabel}</span>
          </span>
        ) : (
          <ApartmentSortButton
            label={columnLabel}
            sortDirection={sortDirection}
            onClick={onSort ? () => onSort(sortColumnKey) : undefined}
            ariaLabel={`${tCommon('table.sort.by')} ${columnLabel}`}
          />
        );

        // Wrap with tooltip if headerTooltip is provided
        const colWithTooltip = col as ColumnWithTooltip<T>;
        const headerContent = colWithTooltip.headerTooltip ? (
          <Tooltip
            content={
              <div className="max-w-xs text-xs whitespace-normal">
                {typeof colWithTooltip.headerTooltip === 'string'
                  ? colWithTooltip.headerTooltip
                  : columnLabel}
              </div>
            }
            placement="top"
          >
            <span>{sortButton}</span>
          </Tooltip>
        ) : (
          sortButton
        );

        return {
          ...col,
          label: (
            <div className="flex items-center gap-1 w-full justify-center">
              {/* Column name with sort icon and filter icon integrated */}
              <div className="relative inline-flex items-center gap-1">
                {headerContent}

                {/* Funnel icon positioned to the right of the button */}
                {isFilterable && (
                  <div
                    className={cn(
                      'flex items-center transition-colors',
                      hasActiveFilter
                        ? '[&_button]:!text-amber-400 hover:[&_button]:!text-amber-300'
                        : '[&_button]:!text-white hover:[&_button]:!text-cyan-300'
                    )}
                  >
                    <ColumnFilterDropdown
                      field={filterField}
                      selectedValues={activeFilters[filterField] || []}
                      onFilterChange={onFilterChange}
                      onFetchOptions={handleLocalFetchFilterOptions}
                      isActive={hasActiveFilter}
                    />
                  </div>
                )}
              </div>
            </div>
          ) as unknown as string,
          cellClassName: `px-1 py-1 whitespace-nowrap ${col.cellClassName || ''}`,
          headerClassName: `!px-1.5 !py-1 border-l !border-gray-400/50 border-r !border-gray-400/50 ${col.headerClassName || ''}`,
          render: (value: unknown, row: T, rowIndex: number) => {
            // Enhanced cell design with improved font and border colors
            if (col.render) {
              return (
                <div className="text-xs text-center">
                  <span>{col.render(value as T[keyof T], row, rowIndex)}</span>
                </div>
              );
            }
            const displayValue =
              value === null || value === undefined || value === '' ? '-' : String(value);
            return (
              <div className="text-xs text-center">
                <span>{displayValue}</span>
                <ExternalLink
                  className={`inline-block w-3 h-3 ml-1 text-gray-400 group-hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all duration-200 ${isPropertyNo ? '!text-blue-500' : isOldPropertyNo ? '!text-amber-500' : ''}`}
                />
              </div>
            );
          },
        };
      }),
    [
      columns,
      activeFilters,
      onFilterChange,
      onSort,
      sortBy,
      sortOrder,
      tCommon,
      handleLocalFetchFilterOptions,
    ]
  );

  const handleSearchInputChange = useCallback(
    (value: string) => {
      const sanitized = value.replace(SEARCH_ALPHANUMERIC_SANITIZE, '');
      setLocalSearch(sanitized);

      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(() => {
        onSearchChange(sanitized);
      }, 500);
    },
    [onSearchChange]
  );

  const localizedTabLabel = useMemo(() => {
    if (activeTab === 'rateable') return t('apartmentTabs.rateable');
    if (activeTab === 'capital') return t('apartmentTabs.capital');
    if (activeTab === 'dual-method') return t('apartmentTabs.dual');
    return activeTab;
  }, [activeTab, t]);

  return (
    <div className="flex flex-col  border-blue-200 rounded">
      <ApartmentQCMasterTable<T>
        dataMode="grouped"
        columns={styledColumns}
        data={groupedData}
        loading={loading}
        height={isTableExpanded ? 600 : 250}
        isExpanded={isTableExpanded}
        onToggleExpand={() => setIsTableExpanded(!isTableExpanded)}
        pageNumber={pageNumber}
        pageSize={pageSize}
        totalCount={
          (totalCount ?? Math.ceil(filteredData.length / pageSize) * pageSize > filteredData.length)
            ? (totalCount ?? filteredData.length)
            : filteredData.length
        }
        totalPages={totalPages ?? Math.ceil(filteredData.length / pageSize)}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        onRowClick={(row, _index) => onRowClick(row)}
        headerExtra={
          <div className="flex items-center px-3 py-2 border-b border-blue-200 justify-between w-full">
            <div className="flex gap-2 items-center">
              <h3 className="text-sm font-semibold text-[#1E3A8A]">{title}</h3>
              <span className="text-[#6B7280]">-</span>
              <p className="text-sm text-[#6B7280]">
                {t('apartmentTabs.showingData', { tab: localizedTabLabel })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <SearchInput
                value={localSearch}
                onChange={handleSearchInputChange}
                placeholder={tCommon('searchPlaceholder')}
                className="w-80 mb-0"
              />
              <ExportIconButton
                onClick={handleExcelExport}
                isExporting={isExporting}
                disabled={isExporting || !wardId || !propertyNo}
                title={t('actions.exportExcel') || 'Export to Excel'}
              />
              <EyeIconButton
                onClick={onToggleAutoScroll}
                isAutoScrolling={isAutoScrolling}
                startTitle={t('actions.startAutoScroll')}
                stopTitle={t('actions.stopAutoScroll')}
              />
            </div>
          </div>
        }
        tableClassName="w-max min-w-full"
        theadClassName="bg-[#d9e3ec] text-black h-0 sticky top-0 z-20 [&_th]:whitespace-nowrap"
      />
    </div>
  );
}

export default CommonPropertyTable;
