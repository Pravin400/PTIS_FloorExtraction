"use client";

import { SearchInput } from "@/components/common";
import { MasterTable } from "@/components/common/MasterTable";
import { EditButton, DeleteButton, AddButton } from "@/components/common/ActionButtons";
import type { Column } from "@/components/common/MasterTable";
import type { Mouja } from "@/types/asset-masters/mouja-subzone.types";

export interface MoujaTableSectionProps {
  title: string;
  searchPlaceholder: string;
  addMoujaLabel: string;
  actionsLabel: string;
  editLabel: string;
  deleteLabel: string;
  moujaSearch: string;
  onSearchChange: (val: string) => void;
  onAddMouja: () => void;
  columns: Column<Mouja>[];
  moujas: Mouja[];
  pageNumber?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
  selectedMoujaId?: string;
  onPageChange: (p: number) => void;
  onPageSizeChange: (size: number) => void;
  onRowClick: (row: Mouja) => void;
  onEditMouja: (row: Mouja) => void;
  onDeleteMouja: (row: Mouja) => void;
}

export function MoujaTableSection({
  title,
  searchPlaceholder,
  addMoujaLabel,
  actionsLabel,
  editLabel,
  deleteLabel,
  moujaSearch,
  onSearchChange,
  onAddMouja,
  columns,
  moujas,
  pageNumber,
  pageSize,
  totalCount,
  totalPages,
  selectedMoujaId,
  onPageChange,
  onPageSizeChange,
  onRowClick,
  onEditMouja,
  onDeleteMouja,
}: MoujaTableSectionProps) {
  return (
    <div className="col-span-1 bg-white rounded-xl border border-[#DCEAFF] p-4 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
        <h2 className="text-base font-bold text-slate-800">{title}</h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end sm:flex-1 sm:gap-4">
          <SearchInput
            value={moujaSearch}
            onChange={onSearchChange}
            placeholder={searchPlaceholder}
            className="mb-0 w-full sm:max-w-[180px] text-gray-900"
          />
          <AddButton
            label={addMoujaLabel}
            onClick={onAddMouja}
            className="!bg-[#0f3d8a] hover:!bg-[#0b2f6b] !text-white"
          />
        </div>
      </div>

      <div className="mouja-table-container">
        <MasterTable<Mouja>
          theadClassName="!bg-[#0f3d8a] !bg-none hover:!bg-[#0f3d8a] [&_*]:!text-white [&_button:hover]:!bg-transparent [&_button:hover]:!text-white/80"
          footerClassName="[&_.bg-\[\#2563EB\]]:!bg-[#0f3d8a] [&_.bg-\[\#2563EB\]]:!border-[#0f3d8a] [&_.bg-\[\#2563EB\]]:!text-white hover:[&_.bg-\[\#2563EB\]]:!bg-[#0b2f6b]"
          columns={columns}
          data={moujas}
          loading={false}
          height="lg"
          pageNumber={pageNumber}
          pageSize={pageSize}
          pageSizeOptions={[10, 20, 30, 40, 50]}
          totalCount={totalCount}
          totalPages={totalPages}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          onRowClick={onRowClick}
          rowClassName={(row) => String(row.id) === selectedMoujaId ? "bg-blue-50/70 hover:bg-blue-100/50 font-semibold" : ""}
          renderActions={(row) => (
            <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-1">
              <EditButton aria-label={editLabel} onClick={() => onEditMouja(row)} />
              <DeleteButton aria-label={deleteLabel} onClick={() => onDeleteMouja(row)} />
            </div>
          )}
          actionLabel={actionsLabel}
          paginationConfig={{ enabled: true, showPageSizeSelector: true }}
          getRowKey={(row) => String(row.id)}
        />
      </div>
    </div>
  );
}
