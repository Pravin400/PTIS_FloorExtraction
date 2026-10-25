"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { SearchInput } from "@/components/common/SearchInput";
import { Select } from "@/components/common/select";
import { Button } from "@/components/common";
import type { LookupOption } from "@/types/water-bill/lookups.types";
import {
  STATIC_FINANCIAL_YEARS,
  STATIC_CONNECTION_CATEGORIES,
  STATIC_GEOGRAPHY_UNITS,
  STATIC_CHARGE_HEADS,
  PENALTY_TYPE_OPTIONS,
} from "@/lib/constants/water-masters.constants";

export interface PenaltyRuleFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  financialYearId?: number;
  onFinancialYearChange: (id?: number) => void;
  connectionCategoryId?: number;
  onCategoryChange: (id?: number) => void;
  geographyUnitId?: number;
  onGeographyChange: (id?: number) => void;
  chargeHeadId?: number;
  onChargeHeadChange: (id?: number) => void;
  penaltyType?: string;
  onPenaltyTypeChange: (pt?: string) => void;
  statusFilter: "all" | "active" | "inactive";
  onStatusFilterChange: (status: "all" | "active" | "inactive") => void;
  onReset: () => void;
  t: (key: string) => string;
  financialYearOptions?: LookupOption[];
  connectionCategoryOptions?: LookupOption[];
  geographyOptions?: LookupOption[];
  chargeHeadOptions?: LookupOption[];
}

export function PenaltyRuleFilters({
  searchTerm,
  onSearchChange,
  financialYearId,
  onFinancialYearChange,
  connectionCategoryId,
  onCategoryChange,
  geographyUnitId,
  onGeographyChange,
  chargeHeadId,
  onChargeHeadChange,
  penaltyType,
  onPenaltyTypeChange,
  statusFilter,
  onStatusFilterChange,
  onReset,
  t,
  financialYearOptions,
  connectionCategoryOptions,
  geographyOptions,
  chargeHeadOptions,
}: PenaltyRuleFiltersProps): React.ReactElement {
  const tCommon = useTranslations("common");
  const fyOptions = [{ value: "", label: "All Financial Years" }, ...(financialYearOptions || STATIC_FINANCIAL_YEARS)];
  const catOptions = [{ value: "", label: "All Categories" }, ...(connectionCategoryOptions || STATIC_CONNECTION_CATEGORIES)];
  const geoOptions = [{ value: "", label: "All Geography" }, ...(geographyOptions || STATIC_GEOGRAPHY_UNITS)];
  const chOptions = [{ value: "", label: "All Charge Heads" }, ...(chargeHeadOptions || STATIC_CHARGE_HEADS)];
  const ptOptions = [{ value: "", label: "All Penalty Types" }, ...PENALTY_TYPE_OPTIONS];
  const statusOptions = [
    { value: "all", label: "All Records" },
    { value: "active", label: "Active Only" },
    { value: "inactive", label: "Inactive Only" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 p-2.5 bg-white rounded-lg border border-slate-200 shadow-sm mb-4 w-full">
      <div className="w-full sm:w-[220px] shrink-0">
        <SearchInput
          value={searchTerm}
          onChange={onSearchChange}
          placeholder={t("searchPlaceholder") || "Search penalty rules..."}
          className="mb-0 w-full text-gray-900"
        />
      </div>

      <div className="flex-1 min-w-[125px]">
        <Select
          value={financialYearId ? String(financialYearId) : ""}
          onChange={(_e, val) => onFinancialYearChange(val ? Number(val) : undefined)}
          options={fyOptions}
          selectSize="sm"
          ariaLabel="Filter by FY"
        />
      </div>

      <div className="flex-1 min-w-[125px]">
        <Select
          value={connectionCategoryId ? String(connectionCategoryId) : ""}
          onChange={(_e, val) => onCategoryChange(val ? Number(val) : undefined)}
          options={catOptions}
          selectSize="sm"
          ariaLabel="Filter by Category"
        />
      </div>

      <div className="flex-1 min-w-[125px]">
        <Select
          value={geographyUnitId ? String(geographyUnitId) : ""}
          onChange={(_e, val) => onGeographyChange(val ? Number(val) : undefined)}
          options={geoOptions}
          selectSize="sm"
          ariaLabel="Filter by Geography"
        />
      </div>

      <div className="flex-1 min-w-[125px]">
        <Select
          value={chargeHeadId ? String(chargeHeadId) : ""}
          onChange={(_e, val) => onChargeHeadChange(val ? Number(val) : undefined)}
          options={chOptions}
          selectSize="sm"
          ariaLabel="Filter by Charge Head"
        />
      </div>

      <div className="flex-1 min-w-[125px]">
        <Select
          value={penaltyType || ""}
          onChange={(_e, val) => onPenaltyTypeChange(val || undefined)}
          options={ptOptions}
          selectSize="sm"
          ariaLabel="Filter by Penalty Type"
        />
      </div>

      <div className="flex-1 min-w-[110px]">
        <Select
          value={statusFilter}
          onChange={(_e, val) => onStatusFilterChange((val as "all" | "active" | "inactive") || "all")}
          options={statusOptions}
          selectSize="sm"
          ariaLabel="Filter by Status"
        />
      </div>

      <Button
        variant="secondary"
        size="sm"
        onClick={onReset}
        className="shrink-0"
      >
        {tCommon("actions.reset") || "Reset"}
      </Button>
    </div>
  );
}
