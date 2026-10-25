'use client';

/**
 * Advance Filter Component
 * Path: src/components/common/AdvanceFilter.tsx
 *
 * Generic, reusable filter bar for data tables across the platform.
 * Supports debounced search, custom dropdowns with icons, ASC/DESC sorting,
 * date range pickers, and reset actions.
 * Line ceiling: <= 300 lines.
 */

import React, { useMemo } from 'react';
import { Search, RotateCcw, ArrowUpDown, Calendar } from 'lucide-react';
import { Button } from './ActionButton';
import { SearchSelect, type SearchSelectOption } from './SearchSelect';

export interface AdvanceFilterOption {
  value: string | number;
  label: string;
}

export interface AdvanceFilterDepartmentOption {
  id: string | number;
  name?: string;
  nameEn?: string;
  nameMr?: string;
  nameHi?: string;
  label?: string;
  value?: string | number;
}

export interface AdvanceFilterDepartment {
  value: string | number;
  onChange: (value: string) => void;
  options?: AdvanceFilterOption[];
  departments?: AdvanceFilterDepartmentOption[];
  placeholder?: string;
  icon?: React.ComponentType<{ className?: string }>;
  minWidthClass?: string;
  ariaLabel?: string;
  locale?: string;
}

export interface AdvanceFilterSelect {
  id: string;
  value: string | number;
  onChange: (value: string) => void;
  options: AdvanceFilterOption[];
  placeholder?: string;
  icon?: React.ComponentType<{ className?: string }>;
  minWidthClass?: string;
  ariaLabel?: string;
}

export interface AdvanceFilterDateRange {
  fromDate: string;
  toDate: string;
  onFromDateChange: (date: string) => void;
  onToDateChange: (date: string) => void;
  fromLabel?: string;
  toLabel?: string;
}

export interface AdvanceFilterSort {
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (val: 'asc' | 'desc') => void;
  ascLabel?: string;
  descLabel?: string;
  ariaLabel?: string;
}

export interface AdvanceFilterProps {
  // Search
  search?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  clearSearchLabel?: string;
  searchWidthClass?: string;

  // Department Dropdown (First-class municipal primitive)
  department?: AdvanceFilterDepartment;

  // Custom Dropdowns
  selects?: AdvanceFilterSelect[];

  // Sort Order
  sort?: AdvanceFilterSort;

  // Date Range
  dateRange?: AdvanceFilterDateRange;

  // Reset
  onReset?: () => void;
  resetLabel?: string;
  hasActiveFilters?: boolean;
  isLoading?: boolean;

  // Extension slots
  extraActions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export function AdvanceFilter({
  search,
  onSearchChange,
  searchPlaceholder = 'Search...',
  clearSearchLabel,
  searchWidthClass,
  department,
  selects = [],
  sort,
  dateRange,
  onReset,
  resetLabel = 'Reset',
  hasActiveFilters,
  isLoading = false,
  extraActions,
  children,
  className = '',
}: AdvanceFilterProps) {
  // Memoize resolved department options
  const resolvedDeptOptions: AdvanceFilterOption[] = useMemo(() => {
    if (!department) return [];
    if (department.options) return department.options;
    if (!department.departments) return [];

    const loc = department.locale || 'en';
    return department.departments.map((dept) => {
      let label = dept.label || '';
      if (!label) {
        if (loc === 'mr') {
          label = dept.nameMr || dept.nameEn || dept.name || '';
        } else if (loc === 'hi') {
          label = dept.nameHi || dept.nameMr || dept.nameEn || dept.name || '';
        } else {
          label = dept.nameEn || dept.name || dept.nameMr || '';
        }
      }
      return {
        value: dept.value !== undefined ? dept.value : dept.id,
        label: label || String(dept.id),
      };
    });
  }, [department]);

  // Memoize search select department options
  const searchSelectDeptOptions: SearchSelectOption[] = useMemo(() => {
    if (!department) return [];
    const allOption: SearchSelectOption = {
      value: 'all',
      label: department.placeholder || 'All Departments',
    };
    return [
      allOption,
      ...resolvedDeptOptions.map((opt) => ({
        value: String(opt.value),
        label: opt.label,
      })),
    ];
  }, [department, resolvedDeptOptions]);

  // Auto-detect active filters if not explicitly provided
  const showReset =
    onReset &&
    (hasActiveFilters ??
      Boolean(
        (search && search.trim() !== '') ||
          (department && department.value !== 'all' && department.value !== '') ||
          selects.some((s) => s.value !== 'all' && s.value !== '') ||
          (sort && sort.sortOrder !== 'desc') ||
          (dateRange && (dateRange.fromDate !== '' || dateRange.toDate !== ''))
      ));

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/90 p-3 sm:p-3.5 shadow-2xs space-y-2.5 ${className}`}
    >
      <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
        {/* Left: Search input */}
        {onSearchChange !== undefined && (
          <div className={`relative ${searchWidthClass || 'w-full sm:w-48 md:w-56 shrink-0'}`}>
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search ?? ''}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-slate-50/80 hover:bg-slate-50 focus:bg-white text-xs sm:text-sm pl-9 pr-8 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-2xs placeholder:text-slate-400"
            />
            {Boolean(search) && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs px-1 cursor-pointer"
                title={clearSearchLabel || 'Clear search'}
                aria-label={clearSearchLabel || 'Clear search'}
              >
                ×
              </button>
            )}
          </div>
        )}

        {/* Common Department Select Dropdown */}
        {department && (
          <div className={`${department.minWidthClass || 'min-w-[140px] sm:min-w-[180px]'}`}>
            <SearchSelect
              id="advance-filter-department"
              name="department"
              options={searchSelectDeptOptions}
              value={department.value !== undefined ? String(department.value) : 'all'}
              onChange={(_name, val) => department.onChange(val)}
              placeholder={department.placeholder || 'All Departments'}
              disabled={isLoading}
              className="!text-xs !h-9 !rounded-xl !border-slate-200"
            />
          </div>
        )}

        {/* Custom Select Dropdowns */}
        {selects.map((selectItem) => {
          const Icon = selectItem.icon;
          const minWidth = selectItem.minWidthClass || 'min-w-[130px] sm:min-w-[150px]';

          return (
            <div key={selectItem.id} className={`relative ${minWidth}`}>
              {Icon && (
                <Icon className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              )}
              <select
                value={selectItem.value}
                onChange={(e) => selectItem.onChange(e.target.value)}
                aria-label={selectItem.ariaLabel || selectItem.placeholder}
                className={`w-full bg-slate-50/80 hover:bg-slate-50 text-xs font-medium ${
                  Icon ? 'pl-8' : 'pl-3'
                } pr-7 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-2xs appearance-none cursor-pointer text-slate-800`}
              >
                {selectItem.placeholder && (
                  <option value="all">{selectItem.placeholder}</option>
                )}
                {selectItem.options.map((opt) => (
                  <option key={String(opt.value)} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          );
        })}

        {/* Sort Order Dropdown */}
        {sort && (
          <div className="relative min-w-[130px] sm:min-w-[145px]">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={sort.sortOrder}
              onChange={(e) => sort.onSortOrderChange(e.target.value as 'asc' | 'desc')}
              aria-label={sort.ariaLabel || 'Sort Order'}
              className="w-full bg-slate-50/80 hover:bg-slate-50 text-xs font-medium pl-8 pr-7 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-2xs appearance-none cursor-pointer text-slate-800"
            >
              <option value="desc">{sort.descLabel || 'Newest First (Desc)'}</option>
              <option value="asc">{sort.ascLabel || 'Oldest First (Asc)'}</option>
            </select>
          </div>
        )}

        {/* Date Range Picker */}
        {dateRange && (
          <div className="flex items-center gap-1.5 bg-slate-50/80 hover:bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200 transition-all shadow-2xs text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0 pointer-events-none" />
            <div className="flex items-center gap-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                {dateRange.fromLabel || 'FROM'}
              </span>
              <input
                type="date"
                value={dateRange.fromDate}
                onChange={(e) => dateRange.onFromDateChange(e.target.value)}
                className="bg-transparent text-xs text-slate-700 font-medium focus:outline-none cursor-pointer"
              />
            </div>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                {dateRange.toLabel || 'TO'}
              </span>
              <input
                type="date"
                value={dateRange.toDate}
                onChange={(e) => dateRange.onToDateChange(e.target.value)}
                className="bg-transparent text-xs text-slate-700 font-medium focus:outline-none cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Children Slot */}
        {children}

        {/* Reset Filters CTA */}
        {showReset && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onReset}
            disabled={isLoading}
            className="h-8.5 px-3 rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100 hover:border-rose-300 text-rose-700 font-semibold text-xs flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer shrink-0 active:scale-95"
            title={resetLabel}
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
            <span className="whitespace-nowrap">{resetLabel}</span>
          </Button>
        )}

        {/* Extra Actions Slot */}
        {extraActions && (
          <div className="ml-auto flex items-center gap-2">
            {extraActions}
          </div>
        )}
      </div>
    </div>
  );
}
