"use client";

import { Layers } from "lucide-react";
import { SearchInput } from "@/components/common";
import { MasterTable } from "@/components/common/MasterTable";
import { EditButton, DeleteButton, AddButton } from "@/components/common/ActionButtons";
import type { Column } from "@/components/common/MasterTable";
import type { SubZoneDetails, Mouja } from "@/types/asset-masters/mouja-subzone.types";

export interface SubZoneTableSectionProps {
  title: string;
  moujaLabel: string;
  searchPlaceholder: string;
  addSubZoneLabel: string;
  selectMoujaNotice: string;
  cannotAddInactiveNotice?: string;
  actionsLabel: string;
  editLabel: string;
  deleteLabel: string;
  selectedMoujaId?: string;
  selectedMouja?: Mouja;
  isMoujaActive: boolean;
  subZoneSearch: string;
  onSearchChange: (val: string) => void;
  onAddSubZone: () => void;
  columns: Column<SubZoneDetails>[];
  subZones: SubZoneDetails[];
  pageNumber?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (size: number) => void;
  onEditSubZone: (row: SubZoneDetails) => void;
  onDeleteSubZone: (row: SubZoneDetails) => void;
}

export function SubZoneTableSection({
  title,
  moujaLabel,
  searchPlaceholder,
  addSubZoneLabel,
  selectMoujaNotice,
  cannotAddInactiveNotice,
  actionsLabel,
  editLabel,
  deleteLabel,
  selectedMoujaId,
  selectedMouja,
  isMoujaActive,
  subZoneSearch,
  onSearchChange,
  onAddSubZone,
  columns,
  subZones,
  pageNumber,
  pageSize,
  totalCount,
  totalPages,
  onPageChange,
  onPageSizeChange,
  onEditSubZone,
  onDeleteSubZone,
}: SubZoneTableSectionProps) {
  return (
    <div className="col-span-1 bg-white rounded-xl border border-[#DCEAFF] p-4 space-y-4 animate-in fade-in duration-300">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
        <h2 className="text-base font-bold text-slate-800 min-w-0 flex-1">
          {title}
          {selectedMoujaId && selectedMouja && (
            <span className="text-xs text-blue-600 font-semibold ml-2 break-all">
              ({moujaLabel}: {selectedMouja.moujaName || "-"})
            </span>
          )}
        </h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end sm:gap-4 shrink-0">
          <SearchInput
            value={subZoneSearch}
            onChange={onSearchChange}
            placeholder={searchPlaceholder}
            className="mb-0 w-full sm:max-w-[200px] text-gray-900"
          />
          <AddButton
            disabled={!selectedMoujaId || !isMoujaActive}
            onClick={onAddSubZone}
            title={
              !selectedMoujaId
                ? selectMoujaNotice
                : !isMoujaActive
                ? (cannotAddInactiveNotice || "Cannot add SubZone to an inactive Mouja")
                : addSubZoneLabel
            }
            label={addSubZoneLabel}
            className="!bg-[#0f3d8a] hover:!bg-[#0b2f6b] !text-white"
          />
        </div>
      </div>

      {!selectedMoujaId ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
          <Layers className="w-8 h-8 text-slate-300 mb-2" />
          <span className="text-sm text-slate-500 font-medium">{selectMoujaNotice}</span>
        </div>
      ) : (
        <div className="subzone-table-container">
          <MasterTable<SubZoneDetails>
            theadClassName="!bg-[#0f3d8a] !bg-none hover:!bg-[#0f3d8a] [&_*]:!text-white [&_button:hover]:!bg-transparent [&_button:hover]:!text-white/80"
            footerClassName="[&_.bg-\[\#2563EB\]]:!bg-[#0f3d8a] [&_.bg-\[\#2563EB\]]:!border-[#0f3d8a] [&_.bg-\[\#2563EB\]]:!text-white hover:[&_.bg-\[\#2563EB\]]:!bg-[#0b2f6b]"
            columns={columns}
            data={subZones}
            loading={false}
            height="lg"
            pageNumber={pageNumber}
            pageSize={pageSize}
            pageSizeOptions={[10, 20, 30, 40, 50]}
            totalCount={totalCount}
            totalPages={totalPages}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
            renderActions={(row) => (
              <div className="flex items-center gap-1">
                <EditButton aria-label={editLabel} onClick={() => onEditSubZone(row)} />
                <DeleteButton aria-label={deleteLabel} onClick={() => onDeleteSubZone(row)} />
              </div>
            )}
            actionLabel={actionsLabel}
            paginationConfig={{ enabled: true, showPageSizeSelector: true }}
            getRowKey={(row) => String(row.id)}
          />
        </div>
      )}
    </div>
  );
}
