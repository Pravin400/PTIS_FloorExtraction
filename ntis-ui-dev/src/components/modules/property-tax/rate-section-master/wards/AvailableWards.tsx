"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { SearchInput, Select } from "@/components/common";
import { PrevPageButton, NextPageButton } from "@/components/common/ActionButtons";
import { AvailableWardsProps } from "@/types/rateSectionMaster.types";
import { Checkbox } from "@/components/common";

const PAGE_SIZE_OPTIONS = [
  { label: "10", value: "10" },
  { label: "20", value: "20" },
  { label: "50", value: "50" },
  { label: "100", value: "100" },
];

export default function AvailableWards({
  allAvailableWards,
  wardAssignments,
  selectedWards,
  availableSearch,
  availablePage,
  availablePageSize,
  checkedAvailable,
  loading,
  onSearch,
  onToggle,
  onPageChange,
  onPageSizeChange,
  onSelectAll,
  isSelectAllActive = false,
  selectAllLoading = false,
  wardsAlias
}: AvailableWardsProps) {
  const t = useTranslations("rateSectionMaster");
  const wards = wardsAlias || t("defaults.wards");

  const unassignedWards = useMemo(() => {
    let filtered = allAvailableWards.filter(ward =>
      !wardAssignments[ward.wardNo] && !selectedWards.includes(ward.wardNo)
    );

    if (availableSearch) {
      const q = availableSearch.toLowerCase();
      filtered = filtered.filter(ward =>
        ward.wardNo.toLowerCase().includes(q) ||
        (ward.name && ward.name.toLowerCase().includes(q))
      );
    }

    return filtered;
  }, [allAvailableWards, wardAssignments, selectedWards, availableSearch]);

  const handleSelectAllChange = () => {
    if (!onSelectAll) return;
    onSelectAll(!isSelectAllActive);
  };

  const paginatedUnassignedWards = useMemo(() => {
    const start = (availablePage - 1) * availablePageSize;
    const end = start + availablePageSize;
    return unassignedWards.slice(start, end);
  }, [unassignedWards, availablePage, availablePageSize]);

  const totalUnassignedCount = unassignedWards.length;
  const totalUnassignedPages = Math.ceil(totalUnassignedCount / availablePageSize) || 1;

  return (
    <>
      <div className="px-4 py-2 bg-white/40 border-b border-blue-100/50">
        <SearchInput
          className="w-full rounded-sm border-gray-300 mb-0"
          value={availableSearch}
          onChange={onSearch}
          placeholder={t("wards.searchAvailable", { wards })}
        />
      </div>

      <div className="overflow-y-auto p-2 space-y-2 flex-1 mb-4">
        {onSelectAll && unassignedWards.length > 0 && (
          <label
            className="flex items-center gap-3 px-4 py-1 bg-white/60 backdrop-blur-sm hover:bg-white/80 rounded-lg cursor-pointer transition-all duration-200 border border-blue-100/50 hover:border-blue-300/50 hover:shadow-md group"
          >
            <input
              type="checkbox"
              checked={isSelectAllActive}
              onChange={handleSelectAllChange}
              disabled={selectAllLoading}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            />
            <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700 transition-colors flex items-center gap-2 flex-1">
              {t('wardList.selectAll')}
              {selectAllLoading && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs bg-blue-100 text-blue-700">
                  {t('actions.loading')}
                </span>
              )}
            </span>
          </label>
        )}
        {paginatedUnassignedWards.map(w => {
          const isSelfSelected = checkedAvailable.has(w.wardNo);

          return (
            <label
              key={w.wardNo}
              className="flex items-center gap-3 px-4 py-1 backdrop-blur-sm rounded-lg transition-all duration-200 border group cursor-pointer bg-white/60 border-blue-100/50 hover:bg-white/80 hover:border-blue-300/50 hover:shadow-md"
              onClick={() => !isSelectAllActive && onToggle(w.wardNo)}
            >
              <div onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={isSelfSelected}
                  onCheckedChange={() => !isSelectAllActive && onToggle(w.wardNo)}
                  disabled={isSelectAllActive}
                />
              </div>

              <span className="text-sm font-medium transition-colors text-gray-700 group-hover:text-blue-700">
                {w.wardNo}
              </span>
            </label>
          );
        })}
        {paginatedUnassignedWards.length === 0 && (
          <div className="text-center text-gray-500 py-4">
            {t("wards.noAvailableWards", { wards })}
          </div>
        )}
      </div>

      <div className="flex justify-between items-center px-4 py-2 bg-white/40 border-t border-blue-100/50">
        <div className="flex items-center gap-2">
          <Select
            options={PAGE_SIZE_OPTIONS}
            value={String(availablePageSize)}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            selectSize="sm"
            className="w-20"
          />
        </div>
        <div className="flex items-center gap-1">
          <PrevPageButton
            onClick={() => onPageChange(Math.max(1, availablePage - 1))}
            disabled={availablePage <= 1 || loading}
            aria-label={t("pagination.previous")}
          />
          <span className="text-xs text-gray-600">
            {availablePage} / {totalUnassignedPages}
          </span>
          <NextPageButton
            onClick={() => onPageChange(Math.min(totalUnassignedPages, availablePage + 1))}
            disabled={availablePage >= totalUnassignedPages || loading}
            aria-label={t("pagination.next")}
          />
        </div>
      </div>
    </>
  );
}
