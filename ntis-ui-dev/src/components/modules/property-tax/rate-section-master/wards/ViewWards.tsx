"use client";

import { useTranslations } from "next-intl";
import { SearchInput, Checkbox, Select, Badge } from "@/components/common";
import { NextPageButton, PrevPageButton } from "@/components/common/ActionButtons";
import { ViewWardsProps } from "@/types/rateSectionMaster.types";

const PAGE_SIZE_OPTIONS = [
  { label: "10", value: "10" },
  { label: "20", value: "20" },
  { label: "50", value: "50" },
  { label: "100", value: "100" },
];

export default function ViewWards({
  viewAllWards,
  wardAssignments,
  selectedWards,
  viewAllSearch,
  viewWardPage,
  viewWardPageSize,
  totalViewAllPages,
  checkedAvailable,
  loading,
  onSearch,
  onToggle,
  onPageChange,
  onPageSizeChange,
  onSelectAll,
  isSelectAllActive = false,
  selectAllLoading = false,
  wardAlias,
  wardsAlias
}: ViewWardsProps) {
  const t = useTranslations("rateSectionMaster");
  const ward = wardAlias || t("defaults.ward");
  const wards = wardsAlias || t("defaults.wards");

  const handleSelectAllChange = () => {
    if (!onSelectAll) return;
    onSelectAll(!isSelectAllActive);
  };

  return (
    <>
      <div className="px-4 py-2 bg-white/40 border-b border-blue-100/50">
        <SearchInput
          className="w-full rounded-sm border-gray-300 mb-0"
          value={viewAllSearch}
          onChange={onSearch}
          placeholder={t("wards.searchWardNo", { ward })}
        />
      </div>

      <div className="overflow-y-auto p-2 space-y-2 flex-1">
        {onSelectAll && viewAllWards.length > 0 && (
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
        {viewAllWards.map(w => {
          const isSelfSelected = checkedAvailable.has(w.wardNo);
          const isAlreadyInSelected = selectedWards.includes(w.wardNo);
          const assignment = wardAssignments[w.wardNo];

          return (
            <label
              key={w.wardNo}
              className="flex items-center gap-3 px-4 py-1 backdrop-blur-sm rounded-lg transition-all duration-200 border group cursor-pointer bg-white/60 border-blue-100/50 hover:bg-white/80 hover:border-blue-300/50 hover:shadow-md"
              onClick={() => !isAlreadyInSelected && !isSelectAllActive && onToggle(w.wardNo)}
            >
              <div onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={isSelfSelected || isAlreadyInSelected}
                  onCheckedChange={() => !isAlreadyInSelected && !isSelectAllActive && onToggle(w.wardNo)}
                  disabled={isAlreadyInSelected || isSelectAllActive}
                />
              </div>

              <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700 transition-colors flex items-center gap-2">
                {w.wardNo}
                {isAlreadyInSelected && (
                  <Badge size="sm" variant="default">
                    {t("wards.selected")}
                  </Badge>
                )}
                {assignment?.description && (
                  <Badge size="sm" variant="success">
                    {assignment.description}
                  </Badge>
                )}
              </span>
            </label>
          );
        })}
        {viewAllWards.length === 0 && (
          <div className="text-center text-gray-500 py-4">
            {t("wards.noWardsFound", { wards })}
          </div>
        )}
      </div>

      <div className="flex justify-between items-center px-4 py-2 bg-white/40 border-t border-blue-100/50">
        <div className="flex items-center gap-2">
          <Select
            options={PAGE_SIZE_OPTIONS}
            value={String(viewWardPageSize)}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            selectSize="sm"
            className="w-20"
          />
        </div>
        <div className="flex items-center gap-1">
          <PrevPageButton
            onClick={() => onPageChange(Math.max(1, viewWardPage - 1))}
            disabled={viewWardPage <= 1 || loading}
            aria-label={t("pagination.previous")}
          />
          <span className="text-xs text-gray-600">
            {viewWardPage} / {totalViewAllPages}
          </span>
          <NextPageButton
            onClick={() => onPageChange(Math.min(totalViewAllPages, viewWardPage + 1))}
            disabled={viewWardPage >= totalViewAllPages || loading}
            aria-label={t("pagination.next")}
          />
        </div>
      </div>
    </>
  );
}
