"use client"

import { useCallback, useMemo, useTransition } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { DeleteButton, EditButton, MasterTable, useConfirm } from "@/components/common";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import type { FloorTableRow } from "@/types/OldDetails/property-old-details.types";
import { getFloorInformationColumns } from "../FloorInformationColumns";
import { FloorTableSectionProps } from "@/types/OldDetails/property-old-floor-info.types";
import { formatAreaWithUnit } from "@/lib/utils/format";

const COLUMN_SORT_MAP: Record<string, string> = {
  floor: 'oldFloorId',
  subFloor: 'oldSubFloorId',
  conYr: 'oldConstructionYear',
  assessmentYr: 'oldAssessmentYear',
  conTyp: 'oldConstructionTypeId',
  use: 'oldTypeOfUseId',
  subUse: 'oldSubTypeOfUseId',
  carpetAreaCombined: 'oldCarpetAreaSqFeet',
  builtupAreaCombined: 'oldBuiltupAreaSqFeet',
};

/**
 * FloorTableSection Component
 * Displays the list of existing floor details in a table format
 * Handles edit and delete actions for floor records
 */
export function FloorTableSection({
  t,
  tCommon,
  existingFloorDetails,
  totalCount,
  pageNumber,
  pageSize,
  totalPages,
  onEdit,
  onDelete,
  onPageChange,
  onPageSizeChange,
}: FloorTableSectionProps) {
  const { confirm } = useConfirm();
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const locale = params.locale as string;
  const propertyId = params.propertyId as string;
  const [, startTransition] = useTransition();

  // Read current sort from URL search params (normalize to lowercase for comparison)
  const currentSortBy = searchParams.get("SortBy") || searchParams.get("sortBy") || "";
  const currentSortOrder = (searchParams.get("SortOrder") || searchParams.get("sortOrder") || "").toLowerCase();

  const handleSortClick = useCallback((key: string) => {
    const mappedKey = COLUMN_SORT_MAP[key] || key;
    let nextSortOrder = "asc";

    if (currentSortBy.toLowerCase() === mappedKey.toLowerCase()) {
      nextSortOrder = currentSortOrder === "asc" ? "desc" : "asc";
    }

    startTransition(() => {
      const urlParams = new URLSearchParams(searchParams.toString());
      urlParams.set("SortBy", mappedKey);
      urlParams.set("SortOrder", nextSortOrder);
      router.push(`/${locale}/property-tax/ptis/QuickDataEntry/${propertyId}/OldDetails/floor-information?${urlParams.toString()}`);
    });
  }, [searchParams, currentSortBy, currentSortOrder, locale, propertyId, router]);

  const handleDeleteClick = useCallback((row: FloorTableRow) => {
    confirm({
      variant: "delete",
      title: tCommon("messages.confirmDelete"),
      meta: { name: row.floor },
      onConfirm: async () => {
        await onDelete(row.id);
      }
    });
  }, [confirm, tCommon, onDelete]);

  const transformedData: FloorTableRow[] = existingFloorDetails.map(f => ({
    id: f.id,
    originalRow: f,
    floor: f.floorDescription,
    subFloor: f.subFloorDescription,
    conYr: f.oldConstructionYear,
    assessmentYr: f.oldAssessmentYear || '',
    conTyp: f.constructionTypeDescription,
    use: f.typeOfUseDescription,
    subUse: f.subTypeOfUseDescription,
    carpetAreaSqFt: f.oldCarpetAreaSqFeet,
    carpetAreaSqM: f.oldCarpetAreaSqMeter,
    carpetAreaCombined: formatAreaWithUnit(
      f.oldCarpetAreaSqFeet != null ? Number(f.oldCarpetAreaSqFeet) : null,
      f.oldCarpetAreaSqMeter != null ? Number(f.oldCarpetAreaSqMeter) : null
    ),
    builtupAreaCombined: formatAreaWithUnit(
      f.oldBuiltupAreaSqFeet != null ? Number(f.oldBuiltupAreaSqFeet) : null,
      f.oldBuiltupAreaSqMeter != null ? Number(f.oldBuiltupAreaSqMeter) : null
    ),
  }));

  const adaptedColumns = useMemo(() => {
    const baseCols = getFloorInformationColumns(t);
    return baseCols.map((col) => {
      const mappedKey = COLUMN_SORT_MAP[col.key as string] || (col.key as string);
      const isSorted = currentSortBy.toLowerCase() === mappedKey.toLowerCase();
      const visualSort = isSorted ? currentSortOrder : 'none';

      return {
        ...col,
        label: (
          <button
            type="button"
            onClick={() => handleSortClick(col.key as string)}
            className="inline-flex h-6 w-full items-center justify-center gap-0.5 rounded border border-white/10 bg-black/5 px-1.5 text-[10px] font-bold text-white shadow-sm transition-colors duration-200 select-none cursor-pointer hover:bg-black/15 active:bg-black/25 whitespace-nowrap focus:outline-none focus:ring-1 focus:ring-white/50"
            aria-label={`Sort by ${col.label}`}
          >
            <span className="truncate font-bold uppercase tracking-normal">{col.label}</span>
            <span className="inline-flex shrink-0 items-center ml-1">
              {visualSort === 'asc' ? (
                <ArrowUp className="h-2.5 w-2.5 text-white" />
              ) : visualSort === 'desc' ? (
                <ArrowDown className="h-2.5 w-2.5 text-white" />
              ) : (
                <ArrowUpDown className="h-2.5 w-2.5 text-white opacity-60 hover:opacity-100 transition-opacity" />
              )}
            </span>
          </button>
        ),
        render: (value: unknown, row: FloorTableRow, index: number) => {
          const content = col.render
            ? col.render(value, row, index)
            : <span className="font-bold text-slate-900">{value === null || typeof value === 'undefined' ? '-' : String(value)}</span>;
          const isCombinedArea = col.key === 'carpetAreaCombined' || col.key === 'builtupAreaCombined';

          return (
            <div className="px-1 py-1.5 text-[12px] text-center font-semibold text-slate-700">
              <div
                className={isCombinedArea ? "whitespace-nowrap" : "truncate"}
                title={value === null || typeof value === 'undefined' ? '-' : (typeof value === 'string' ? value : String(value))}
              >
                {content}
              </div>
            </div>
          );
        },
      };
    });
  }, [t, currentSortBy, currentSortOrder, handleSortClick]);

  return (
    <div className="mb-6 overflow-x-auto w-full [&_th]:whitespace-nowrap [&_th:last-child]:text-white! [&_th:last-child]:text-xs [&_th:last-child]:border-l [&_th:last-child]:border-solid [&_th:last-child]:border-white/30 [&_th]:border-r [&_th]:border-white/30 [&_th:last-child]:border-r-0 [&_td]:border-r [&_td]:border-blue-100 [&_td:last-child]:border-r-0 [&_th:last-child]:w-25 [&_th:last-child]:min-w-25 [&_td:last-child]:w-25 [&_td:last-child]:min-w-25 [&_td]:overflow-hidden">
      <MasterTable
        data={transformedData}
        columns={adaptedColumns}
        emptyText={t('floor.noFloorData')}
        maxBodyHeightClassName="max-h-[400px] whitespace-nowrap" //max-h-[400px]
        tableClassName="table-fixed w-full min-w-[1270px]"
        theadClassName="sticky top-0 z-20 bg-[#1e3a8a] text-white border-b border-blue-300 [&_th]:px-1 [&_th]:py-1.5 [&_th:last-child]:border-l [&_th:last-child]:border-solid [&_th:last-child]:border-white/30"
        rowClassName={() => "hover:bg-blue-50/50 transition-colors"}
        pageNumber={pageNumber}
        pageSize={pageSize}
        totalCount={totalCount}
        totalPages={totalPages}
        onPageChange={onPageChange}
        onPageSizeChange={(size) => onPageSizeChange(String(size))}
        paginationConfig={{
          enabled: true,
          showPageSizeSelector: true,
        }}
        getRowKey={(row) => row.id}
        renderActions={useCallback((row: FloorTableRow) => (
          <div className="flex items-center gap-2 whitespace-nowrap">
            <EditButton onClick={() => onEdit(row.originalRow)} />
            <DeleteButton onClick={() => handleDeleteClick(row)} />
          </div>
        ), [onEdit, handleDeleteClick])}
      />
    </div>
  );
}
