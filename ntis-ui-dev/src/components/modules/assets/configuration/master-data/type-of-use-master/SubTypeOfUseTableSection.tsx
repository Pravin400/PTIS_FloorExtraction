"use client";

import { Layers3 } from "lucide-react";
import { SearchInput } from "@/components/common";
import { useTranslations } from "next-intl";
import { MasterTable } from "@/components/common/MasterTable";
import { EditButton, DeleteButton, AddButton } from "@/components/common/ActionButtons";
import type { Column } from "@/components/common/MasterTable";
import type { AssetSubTypeOfUse, AssetTypeOfUse } from "@/types/asset-masters/type-of-use.types";

export interface SubTypeOfUseTableSectionProps {
  title: string;
  searchPlaceholder: string;
  addSubtypeLabel: string;
  actionsLabel: string;
  editLabel: string;
  deleteLabel: string;
  subtypeSearch: string;
  onSearchChange: (val: string) => void;
  onAddSubtype: () => void;
  columns: Column<AssetSubTypeOfUse>[];
  subtypes: AssetSubTypeOfUse[];
  pageNumber?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (size: number) => void;
  onEditSubtype: (row: AssetSubTypeOfUse) => void;
  onDeleteSubtype: (row: AssetSubTypeOfUse) => void;
  loading?: boolean;
  /** The currently selected type — used to display its code badge in the header */
  selectedType?: AssetTypeOfUse | null;
}

export function SubTypeOfUseTableSection({
  title,
  searchPlaceholder,
  addSubtypeLabel,
  actionsLabel,
  editLabel,
  deleteLabel,
  subtypeSearch,
  onSearchChange,
  onAddSubtype,
  columns,
  subtypes,
  pageNumber,
  pageSize,
  totalCount = 0,
  totalPages,
  onPageChange,
  onPageSizeChange,
  onEditSubtype,
  onDeleteSubtype,
  loading = false,
  selectedType,
}: SubTypeOfUseTableSectionProps) {
  const t = useTranslations("assetTypeOfUse");
  return (
    <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white shadow-sm lg:h-[600px] flex flex-col">
      {/* Header */}
      <div className="flex gap-3 rounded-t-2xl border-b border-slate-100 px-4 py-3 sticky top-0 bg-white z-10 flex-col sm:flex-row sm:items-center sm:justify-between">
        {/* Title row with selected type badge + count */}
        <div className="font-semibold text-slate-900 flex flex-wrap items-center gap-2">
          {title}
          {selectedType && (
            <span className="rounded-md bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 border border-blue-200">
              {selectedType.typeOfUseCode}
            </span>
          )}
          {selectedType && (
            <div className="flex items-center gap-1 text-xs text-purple-700 bg-purple-50 px-2 py-1 rounded-md border border-purple-300">
              <Layers3 className="h-4 w-4" />
              <span>{totalCount} {title}</span>
            </div>
          )}
        </div>

        {/* Search + Add */}
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput
            value={subtypeSearch}
            onChange={onSearchChange}
            placeholder={searchPlaceholder}
            className="mb-0 flex-1 min-w-[160px] text-gray-900"
          />
          <AddButton
            size="md"
            label={addSubtypeLabel}
            onClick={onAddSubtype}
            className="!bg-[#0f3d8a] hover:!bg-[#0b2f6b] !text-white"
          />
        </div>
      </div>

      {/* Table */}
      <div className="p-4 flex-1 overflow-y-auto">
        <MasterTable<AssetSubTypeOfUse>
          theadClassName="!bg-[#0f3d8a] !bg-none hover:!bg-[#0f3d8a] [&_*]:!text-white [&_button:hover]:!bg-transparent [&_button:hover]:!text-white/80"
          footerClassName="[&_.bg-\[\#2563EB\]]:!bg-[#0f3d8a] [&_.bg-\[\#2563EB\]]:!border-[#0f3d8a] [&_.bg-\[\#2563EB\]]:!text-white hover:[&_.bg-\[\#2563EB\]]:!bg-[#0b2f6b]"
          columns={columns}
          data={subtypes}
          loading={loading}
          height="sm"
          pageNumber={pageNumber}
          pageSize={pageSize}
          pageSizeOptions={[10, 20, 30, 40, 50]}
          totalCount={totalCount}
          totalPages={totalPages}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          renderActions={(row) => (
            <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-1">
              <EditButton aria-label={editLabel} onClick={() => onEditSubtype(row)} />
              <DeleteButton aria-label={deleteLabel} onClick={() => onDeleteSubtype(row)} />
            </div>
          )}
          actionLabel={actionsLabel}
          paginationConfig={{ enabled: true, showPageSizeSelector: true }}
          emptyText={t("noDataFound")}
          getRowKey={(row) => String(row.id)}
        />
      </div>
    </div>
  );
}

