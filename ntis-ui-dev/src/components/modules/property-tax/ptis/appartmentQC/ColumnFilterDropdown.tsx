"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { FilterDropdown, type FilterOption, type FilterMode } from "@/components/common/FilterDropdown";

export type FilterField = 'wing' | 'flatOrShopNo' | 'apartmentType' | 'propertyType';

// Re-export for backward compatibility
export type { FilterOption, FilterMode };

interface ColumnFilterDropdownProps {
  field: FilterField;
  selectedValues: string[];
  onFilterChange: (field: FilterField, values: string[]) => void;
  onFetchOptions: (field: FilterField) => Promise<FilterOption[]>;
  isActive?: boolean;
  disabled?: boolean;
  mode?: FilterMode;
}

/**
 * Column-specific filter dropdown wrapper.
 * Wraps the generic FilterDropdown with field-specific logic.
 */
export function ColumnFilterDropdown({
  field,
  selectedValues,
  onFilterChange,
  onFetchOptions,
  isActive = false,
  disabled = false,
  mode = 'single',
}: ColumnFilterDropdownProps) {
  const t = useTranslations("appartmentQC");

  // Wrap the onFilterChange to include the field parameter
  const handleFilterChange = useCallback((values: string[]) => {
    onFilterChange(field, values);
  }, [field, onFilterChange]);

  // Wrap the onFetchOptions to include the field parameter
  const handleFetchOptions = useCallback(() => {
    return onFetchOptions(field);
  }, [field, onFetchOptions]);

  return (
    <FilterDropdown
      selectedValues={selectedValues}
      onFilterChange={handleFilterChange}
      onFetchOptions={handleFetchOptions}
      isActive={isActive}
      disabled={disabled}
      mode={mode}
      placeholder={t("filter.filterColumn") || "Filter column"}
      noOptionsText={t("filter.noOptions") || "No options available"}
      clearAllText={t("filter.clearAll") || "Clear All"}
      applyText={t("filter.apply") || "Apply"}
    />
  );
}

export default ColumnFilterDropdown;
