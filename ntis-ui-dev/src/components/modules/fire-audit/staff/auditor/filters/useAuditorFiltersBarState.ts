/**
 * Hook for managing Auditor Filters Bar State
 * Path: src/components/modules/fire-audit/staff/auditor/filters/useAuditorFiltersBarState.ts
 */

import { useState, useMemo, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { getBcp47Locale } from "@/lib/utils/fire-audit/date-utils";
import type {
  AuditorDashboardFilters,
  FilterFieldKey,
  FilterFieldConfig,
  FilterOption,
  AuditorFilterDraftState,
} from "@/types/fire-audit/auditor.types";
import type { AuditorFilterLookupData } from "@/types/fire-audit/catalog.types";
import { getFilterConfigs, getDateQuickPresets } from "./auditorFilters.config";

interface UseAuditorFiltersBarStateProps {
  filters: AuditorDashboardFilters;
  onApplyFilters: (newFilters: AuditorDashboardFilters) => void;
  onResetFilters: () => void;
  lookups?: AuditorFilterLookupData;
}

export function useAuditorFiltersBarState({
  filters,
  onApplyFilters,
  onResetFilters,
  lookups,
}: UseAuditorFiltersBarStateProps) {
  const t = useTranslations("fireAudit.auditorDashboard.search");
  const tFields = useTranslations("fireAudit.auditorDashboard.filterFields");
  const locale = useLocale();

  const [isDesktopExpanded, setIsDesktopExpanded] = useState(true);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const [openDropdownKey, setOpenDropdownKey] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState(filters.searchTerm || "");

  const initialDraft = useMemo<AuditorFilterDraftState>(
    () => ({
      appType: filters.appType || "",
      buildingType: filters.buildingType || "",
      node: filters.node || "",
      sector: filters.sector || "",
      wardNo: filters.wardNo || "",
      dateFilter: filters.dateFilter || "",
      riskCategory: filters.riskCategory || "",
    }),
    [
      filters.appType,
      filters.buildingType,
      filters.node,
      filters.sector,
      filters.wardNo,
      filters.dateFilter,
      filters.riskCategory,
    ]
  );

  const [draftFilters, setDraftFilters] = useState<AuditorFilterDraftState>(initialDraft);

  const handleDraftChange = useCallback((key: FilterFieldKey, value: string) => {
    setDraftFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const dateQuickPresets = useMemo(
    () => getDateQuickPresets(tFields),
    [tFields]
  );

  const selectedCalendarDate = useMemo(() => {
    const val = draftFilters.dateFilter;
    if (!val) return undefined;
    if (val === "today") return new Date();
    const parts = val.split("-");
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      const parsed = new Date(y, m, d);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return undefined;
  }, [draftFilters.dateFilter]);

  const handleCalendarSelect = useCallback(
    (date?: Date) => {
      if (date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        handleDraftChange("dateFilter", `${year}-${month}-${day}`);
      } else {
        handleDraftChange("dateFilter", "");
      }
    },
    [handleDraftChange]
  );

  const formatSelectedDateLabel = useCallback(
    (value: string | undefined): string => {
      if (!value) return tFields("anyDate");
      if (value === "today") return tFields("dateToday");
      if (value === "thisWeek" || value === "this_week") return tFields("dateThisWeek");
      if (value === "thisMonth" || value === "this_month") return tFields("dateThisMonth");
      if (value === "last7" || value === "last_7") return tFields("dateLast7");
      if (value === "last30" || value === "last_30") return tFields("dateLast30");

      const parts = value.split("-");
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        const dateObj = new Date(y, m, d);
        if (!isNaN(dateObj.getTime())) {
          return dateObj.toLocaleDateString(
            getBcp47Locale(locale),
            { day: "numeric", month: "short", year: "numeric" }
          );
        }
      }
      return value;
    },
    [tFields, locale]
  );

  const filterConfigs = useMemo(
    () => getFilterConfigs(tFields, lookups),
    [tFields, lookups]
  );

  // Counts applied filters (including searchTerm and status)
  const activeCount = useMemo(() => {
    let count = 0;
    if (filters.searchTerm && filters.searchTerm.trim()) count++;
    if (filters.status && filters.status.toUpperCase() !== "ALL") count++;
    const filterKeys: (keyof AuditorDashboardFilters)[] = [
      "appType",
      "buildingType",
      "node",
      "sector",
      "wardNo",
      "dateFilter",
      "riskCategory",
    ];
    for (const key of filterKeys) {
      const val = filters[key];
      if (typeof val === "string" && val.trim() && val.toUpperCase() !== "ALL") {
        count++;
      }
    }
    return count;
  }, [filters]);

  // Counts draft filters for the mobile sheet "Show Results" button
  const draftCount = useMemo(() => {
    let count = 0;
    if (searchTerm.trim()) count++;
    if (filters.status && filters.status.toUpperCase() !== "ALL") count++;
    for (const val of Object.values(draftFilters)) {
      if (val && val.toUpperCase() !== "ALL") {
        count++;
      }
    }
    return count;
  }, [searchTerm, filters.status, draftFilters]);

  const handleApply = useCallback(() => {
    setOpenDropdownKey(null);
    setIsMobileSheetOpen(false);
    const sanitizedSearch = searchTerm.replace(/[\x00-\x1F\x7F]/g, "").trim().slice(0, 100);
    onApplyFilters({
      ...filters,
      searchTerm: sanitizedSearch || undefined,
      ...draftFilters,
    });
  }, [filters, searchTerm, draftFilters, onApplyFilters]);

  const handleReset = useCallback(() => {
    setSearchTerm("");
    setDraftFilters({
      appType: "",
      buildingType: "",
      node: "",
      sector: "",
      wardNo: "",
      dateFilter: "",
      riskCategory: "",
    });
    setOpenDropdownKey(null);
    onResetFilters();
  }, [onResetFilters]);

  const getSelectedOption = useCallback(
    (item: FilterFieldConfig): FilterOption => {
      if (item.key === "dateFilter") {
        return {
          label: formatSelectedDateLabel(draftFilters.dateFilter),
          value: draftFilters.dateFilter || "",
        };
      }
      return (
        item.options.find((opt) => opt.value === draftFilters[item.key]) ||
        item.options[0]
      );
    },
    [draftFilters, formatSelectedDateLabel]
  );

  const handleSelectOption = useCallback(
    (key: FilterFieldKey, value: string) => {
      handleDraftChange(key, value);
      setOpenDropdownKey(null);
    },
    [handleDraftChange]
  );

  const handleCalendarDateSelect = useCallback(
    (date?: Date) => {
      handleCalendarSelect(date);
      setOpenDropdownKey(null);
    },
    [handleCalendarSelect]
  );

  return {
    t,
    tFields,
    locale,
    searchTerm,
    setSearchTerm,
    draftFilters,
    handleDraftChange,
    activeCount,
    draftCount,
    isDesktopExpanded,
    setIsDesktopExpanded,
    isMobileSheetOpen,
    setIsMobileSheetOpen,
    openDropdownKey,
    setOpenDropdownKey,
    filterConfigs,
    dateQuickPresets,
    selectedCalendarDate,
    handleCalendarSelect,
    formatSelectedDateLabel,
    handleApply,
    handleReset,
    getSelectedOption,
    handleSelectOption,
    handleCalendarDateSelect,
  };
}

export type AuditorFiltersBarState = ReturnType<typeof useAuditorFiltersBarState>;
