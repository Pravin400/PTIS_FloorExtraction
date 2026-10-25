"use client";

import { useMemo } from "react";
import { Map } from "lucide-react";
import { useTranslations } from "next-intl";
import { SearchInput, Checkbox, Select } from "@/components/common";
import { PrevPageButton, NextPageButton } from "@/components/common/ActionButtons";
import { StatusBadge } from "@/components/common/StatusBadge";
import { RateSectionWardsProps } from "@/types/rateSectionMaster.types";

const PAGE_SIZE_OPTIONS = [
  { label: "10", value: "10" },
  { label: "20", value: "20" },
  { label: "50", value: "50" },
  { label: "100", value: "100" },
];

export default function RateSectionWards({
  filteredSelected,
  selectedSearch,
  selectedPage,
  selectedPageSize,
  selectedWardsTotalCount,
  checkedSelected,
  selectedZoneNo,
  selectedZoneName,
  onSearch,
  onToggle,
  onPageChange,
  onPageSizeChange,
  onSelectAll,
  isSelectAllActive = false,
  selectAllLoading = false,
  rateSectionAlias,
  wardsAlias
}: RateSectionWardsProps) {
  const t = useTranslations("rateSectionMaster");
  const rateSection = rateSectionAlias || t("defaults.rateSection");
  const wards = wardsAlias || t("defaults.wards");

  const totalSelectedPages = Math.ceil(filteredSelected.length / selectedPageSize) || 1;

  const paginatedSelected = useMemo(() => {
    const start = (selectedPage - 1) * selectedPageSize;
    const end = start + selectedPageSize;
    return filteredSelected.slice(start, end);
  }, [filteredSelected, selectedPage, selectedPageSize]);

  const handleSelectAllChange = () => {
    if (!onSelectAll || selectAllLoading) return;
    
    if (isSelectAllActive) {
      // Deselect all - pass empty array
      onSelectAll([]);
    } else {
      // Select all - pass placeholder (handler will fetch from API)
      onSelectAll(filteredSelected);
    }
  };

  return (
    <div className="flex-1 flex flex-col rounded-xl overflow-visible bg-gradient-to-br from-purple-50/80 to-indigo-50/80 backdrop-blur-md border-2 border-purple-200/50 shadow-lg">
      <div className="bg-gradient-to-r from-[#1A86E8] via-[#1A86E8] to-[#1A86E8] px-4 py-3 font-semibold text-sm text-[#fff] shadow-md">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            {t('wards.wardsInRateSection', { wards, rateSection })}
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-white/20 text-white border border-white/30">
              {selectedWardsTotalCount}
            </span>
          </span>
          <StatusBadge
            variant="info"
            label={
              selectedZoneName && selectedZoneName !== selectedZoneNo
                ? `${selectedZoneNo} - ${selectedZoneName}`
                : selectedZoneNo || ""
            }
          />
        </div>
      </div>

      <div className="px-4 py-2 bg-white/40 border-b border-purple-100/50">
        <SearchInput
          className="w-full rounded-sm  border-gray-300 mb-0"
          value={selectedSearch}
          onChange={onSearch}
          placeholder={t("wards.searchSelected", { wards })}
        />
      </div>

      <div className="overflow-y-auto p-3 space-y-2 flex-1">
        {onSelectAll && paginatedSelected.length > 0 && (
          <label
            className="flex items-center gap-3 px-4 py-1 bg-white/60 backdrop-blur-sm hover:bg-white/80 rounded-lg cursor-pointer transition-all duration-200 border border-purple-100/50 hover:border-purple-300/50 hover:shadow-md group"
          >
            <input
              type="checkbox"
              checked={isSelectAllActive}
              onChange={handleSelectAllChange}
              disabled={selectAllLoading}
              className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <span className="text-sm font-medium text-gray-700 group-hover:text-purple-700 transition-colors flex items-center gap-2 flex-1">
              {t('wardList.selectAll')}
              {selectAllLoading && (
                <span className="text-xs text-gray-500">
                  {'(Loading...)'}
                </span>
              )}
            </span>
          </label>
        )}
        {paginatedSelected.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 py-8">
            <Map size={40} className="text-gray-300 mb-3" />
            <p className="text-sm">{t("wards.emptyState", { wards, rateSection })}</p>
          </div>
        )}
 
        {paginatedSelected.map(w => {
          const isSelfSelected = checkedSelected.has(w);
 
          return (
            <label
              key={w}
              className="flex items-center gap-3 px-4 py-1.5 backdrop-purple-sm rounded-lg transition-all duration-200 border group cursor-pointer bg-white/60 border-purple-100/50 hover:bg-white/80 hover:border-purple-300/50 hover:shadow-md"
              onClick={() => !isSelectAllActive && onToggle(w)}
            >
              <div onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={isSelfSelected}
                  onCheckedChange={() => !isSelectAllActive && onToggle(w)}
                  disabled={isSelectAllActive}
                />
              </div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-purple-700 transition-colors">
                {w}
              </span>
            </label>
          );
        })}
      </div>

      <div className="flex justify-between items-center px-4 py-2 bg-white/40 border-t border-purple-100/50">
        <div className="flex items-center gap-2">
          <Select
            options={PAGE_SIZE_OPTIONS}
            value={String(selectedPageSize)}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            selectSize="sm"
            className="w-20"
          />
        </div>
        <div className="flex items-center gap-1">
          <PrevPageButton
            onClick={() => onPageChange(Math.max(1, selectedPage - 1))}
            disabled={selectedPage <= 1}
            aria-label={t("pagination.previous")}
          />
          <span className="text-xs text-gray-600">
            {selectedPage} / {totalSelectedPages}
          </span>
          <NextPageButton
            onClick={() => onPageChange(Math.min(totalSelectedPages, selectedPage + 1))}
            disabled={selectedPage >= totalSelectedPages}
            aria-label={t("pagination.next")}
          />
        </div>
      </div>
    </div>
  );
}
