"use client";

import { SaveButton } from "@/components/common";
import { CardPagination } from "@/components/common/CardList";
import { MatrixGrid } from "@/components/common/MatrixGrid";
import type { RightPanelProps } from "@/types/depreciation.types";

export function RightPanel({
  matrixColumns,
  matrixRows,
  saving,
  pageNumber,
  pageSize,
  totalCount,
  totalPages,
  editableColumnIds,
  onCellChange,
  onUpdateRates,
  onPageChange,
  onPageSizeChange,
  t,
  values,
}: Readonly<RightPanelProps>) {
  return (
    <div className="col-span-12 lg:col-span-10">
      <div className="bg-white rounded-2xl border shadow-sm h-155 flex flex-col">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50/50 rounded-t-2xl">
          <span className="font-bold text-gray-700 uppercase text-xs tracking-wider">
            {t("createDepChart", values)}
          </span>
        </div>

        <div className="flex-1 overflow-auto text-gray-400">
          <MatrixGrid
            columns={matrixColumns}
            rows={matrixRows}
            metaColumns={[{ id: "range", label: t("ageRange", values), width: "120px" }]}
            mode="edit"
            editableColumns={editableColumnIds}
            onCellChange={onCellChange}
            cellMaxValue={99}
            translations={{
              action: t("action", values),
              currencySymbol: t("currencySymbol", values),
              deleteRow: t("deleteRow", values),
            }}
          />
        </div>

        <CardPagination
          pageNumber={pageNumber}
          pageSize={pageSize}
          totalCount={totalCount}
          totalPages={totalPages}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          pageSizeOptions={[10, 20, 50]}
          className="mx-4 mb-2"
        />

        <div className="p-4 border-t flex justify-end rounded-b-2xl">
          <SaveButton
            label={saving ? t("processing", values) : `${t("updateRates", values)}`}
            onClick={onUpdateRates}
            disabled={saving}
          />
        </div>
      </div>
    </div>
  );
}
