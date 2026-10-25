"use client";

import { Layers2 } from "lucide-react";
import { SearchInput } from "@/components/common";
import { CardList } from "@/components/common/CardList";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Tooltip } from "@/components/common/Tooltip";
import { EditButton, DeleteButton, AddButton } from "@/components/common/ActionButtons";
import { cn } from "@/lib/utils/cn";
import { useTranslations } from "next-intl";
import type { AssetTypeOfUse } from "@/types/asset-masters/type-of-use.types";

export interface TypeOfUseTableSectionProps {
  title: string;
  searchPlaceholder: string;
  addTypeLabel: string;
  editLabel: string;
  deleteLabel: string;
  typeSearch: string;
  onSearchChange: (val: string) => void;
  onAddType: () => void;
  types: AssetTypeOfUse[];
  pageNumber?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
  selectedTypeOfUseId?: string;
  onPageChange: (p: number) => void;
  onPageSizeChange: (size: number) => void;
  onRowClick: (row: AssetTypeOfUse) => void;
  onEditType: (row: AssetTypeOfUse) => void;
  onDeleteType: (row: AssetTypeOfUse) => void;
  loading?: boolean;
}

export function TypeOfUseTableSection({
  title,
  searchPlaceholder,
  addTypeLabel,
  editLabel,
  deleteLabel,
  typeSearch,
  onSearchChange,
  onAddType,
  types,
  pageNumber = 1,
  pageSize = 10,
  totalCount = 0,
  totalPages = 1,
  selectedTypeOfUseId,
  onPageChange,
  onPageSizeChange,
  onRowClick,
  onEditType,
  onDeleteType,
  loading = false,
}: TypeOfUseTableSectionProps) {
  const t = useTranslations("assetTypeOfUse");
  const tCommon = useTranslations("common");

  return (
    <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white shadow-sm min-h-[400px] lg:h-[600px] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex flex-col gap-3 rounded-t-2xl border-b border-slate-100 px-4 py-3 bg-white z-10 flex-shrink-0 sm:flex-row sm:items-center sm:justify-between">
        <div className="font-semibold text-slate-900">{title}</div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end sm:flex-1 sm:gap-4">
          <SearchInput
            value={typeSearch}
            onChange={onSearchChange}
            placeholder={searchPlaceholder}
            className="mb-0 w-full sm:max-w-xs text-gray-900"
          />
          <AddButton
            size="md"
            label={addTypeLabel}
            onClick={onAddType}
            className="!bg-[#0f3d8a] hover:!bg-[#0b2f6b] !text-white"
          />
        </div>
      </div>

      {/* Card list */}
      <div className="flex-1 flex flex-col min-h-0">
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-sm text-slate-400">
            <span className="animate-pulse">{tCommon("actions.loading")}</span>
          </div>
        ) : (
          <CardList<AssetTypeOfUse>
            data={types}
            pageNumber={pageNumber}
            pageSize={pageSize}
            totalCount={totalCount}
            totalPages={totalPages}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
            pageSizeOptions={[10, 20, 30, 40, 50]}
            emptyText={t("noDataFound")}
            emptyIcon={<Layers2 className="mx-auto mb-2 h-8 w-8 text-slate-300" />}
            maxHeightClassName="max-h-[320px] sm:max-h-[350px] lg:max-h-[415px] overflow-y-auto"
            className="border-none rounded-none shadow-none [&_.bg-\[\#2563EB\]]:!bg-[#0f3d8a] [&_.bg-\[\#2563EB\]]:!border-[#0f3d8a] [&_.bg-\[\#2563EB\]]:!text-white hover:[&_.bg-\[\#2563EB\]]:!bg-[#0b2f6b]"
            renderCard={(typeItem) => {
              const selected = String(typeItem.id) === selectedTypeOfUseId;
              return (
                <div key={typeItem.id} className="w-full px-2 mb-3">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => onRowClick(typeItem)}
                    onKeyDown={(e) => {
                      if (e.target !== e.currentTarget) return;
                      if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
                        e.preventDefault();
                        onRowClick(typeItem);
                      }
                    }}
                    className={cn(
                      "cursor-pointer select-none rounded-xl border px-4 py-3 text-left shadow-sm transition",
                      selected
                        ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200"
                        : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
                    )}
                  >
                    <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                      {/* LEFT: Code + Description */}
                      <div className="flex items-center gap-2 min-w-0 shrink">
                        <span className="rounded-lg bg-emerald-500 px-2 py-1 text-xs font-bold text-white whitespace-nowrap">
                          {typeItem.typeOfUseCode}
                        </span>
                        <Tooltip content={typeItem.description} placement="bottom">
                          <span className="text-sm font-semibold text-slate-900 truncate max-w-[160px]">
                            {typeItem.description}
                          </span>
                        </Tooltip>
                      </div>

                      {/* RIGHT: Seq + Status + Actions */}
                      <div className="flex items-center gap-2 shrink-0 ml-auto">
                        <span className="text-purple-700 bg-purple-50 px-2 py-1 rounded-md border border-purple-300 text-xs whitespace-nowrap">
                          {t("seq")}: <b>{typeItem.searchSequence ?? "-"}</b>
                        </span>

                        <StatusBadge value={typeItem.isActive} />

                        <EditButton
                          size="sm"
                          aria-label={editLabel}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditType(typeItem);
                          }}
                        />
                        <DeleteButton
                          size="sm"
                          aria-label={deleteLabel}
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteType(typeItem);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            }}
          />
        )}
      </div>
    </div>
  );
}



