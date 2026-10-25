"use client";

import { MatrixGrid } from "@/components/common/MatrixGrid";
import { MatrixGridPagination } from "@/components/common/MatrixGrid";
import { sanitizePositiveDecimal, POSITIVE_DECIMAL_INVALID_KEYS } from "@/lib/utils/validation";
import type { RateCategory, ISelectOption } from "@/types/RVRateMaster";
import { RateMatrixHeader } from "./RateMatrixHeader";
import { toast } from "sonner";
import { useState, useMemo, useEffect } from "react";
import { RateMatrixTabs } from "./RateMatrixTabs";
import { applyMultiplierToMatrix } from "@/hooks/RVRateMaster/helpers/ratePayloadHelpers";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";
import { buildMatrixColumns, buildMatrixMetaColumns, buildMatrixRows, buildCategoryColorMap, filterRateCategories } from "./rateMatrixHelpers";

// Maximum allowed rate value
const MAX_RATE_VALUE = 99999;

type MatrixRow = {
  id: number;
  zone?: string;
  zoneNo?: string;
  taxZoneId?: number;
  [key: string]: number | string | null | undefined;
};

interface RateMatrixSectionProps {
  // Matrix data
  matrixData: MatrixRow[];
  setMatrixData: (data: MatrixRow[] | ((prev: MatrixRow[]) => MatrixRow[])) => void;
  setAllZoneEdits: (edits: Record<string, Record<string, number>> | ((prev: Record<string, Record<string, number>>) => Record<string, Record<string, number>>)) => void;
  // Categories
  rateCategories: RateCategory[];
  // Filter values for display
  selectedZone: string;
  selectedZoneLabel?: string;
  selectedUseGroup: string;
  selectedUseGroupLabel?: string;
  assessmentYear: string;
  assessmentYearLabel?: string;
  // Rate unit
  rateUnit: "SqMeter" | "SqFeet";
  // Options for labels
  zoneOptions: ISelectOption[];
  useGroupOptions: ISelectOption[];
  assessmentYears: ISelectOption[];
  assessmentYearRanges?: Array<{
    label: string;
    value: string;
    fromYear: string | number;
    toYear: string | number;
  }>;
  // Zone remarks map
  zoneRemarksMap: Map<string, string>;
  // Stats
  filledRatesCount: number;
  // Pagination
  matrixPageNumber: number;
  matrixPageSize: number;
  matrixTotalPages: number;
  matrixTotalCount: number;
  onPaginationChange: (page: number, pageSize: number) => void;
  // Mode and handlers
  mode: "edit" | "delete" | "add";
  id?: string | null;
  // Action handlers
  onAddRates: () => void;
  onUpdateRates: () => void;
  onDeleteRates: () => void;
  // Validation
  existingRateFound: boolean;
  // Multipliers
  multipliers?: Record<string, number>;
  // Translations
  t: ReturnType<typeof import("next-intl").useTranslations>;
  tCommon: ReturnType<typeof import("next-intl").useTranslations>;
}

export function RateMatrixSection({
  matrixData,
  setMatrixData,
  setAllZoneEdits,
  rateCategories,
  selectedZone,
  selectedZoneLabel,
  selectedUseGroup,
  selectedUseGroupLabel,
  assessmentYear,
  assessmentYearLabel,
  rateUnit,
  zoneOptions,
  useGroupOptions,
  assessmentYears,
  assessmentYearRanges,
  zoneRemarksMap,
  filledRatesCount,
  matrixPageNumber,
  matrixPageSize,
  matrixTotalPages,
  matrixTotalCount,
  onPaginationChange,
  mode,
  id,
  onAddRates,
  onUpdateRates,
  onDeleteRates,
  existingRateFound,
  multipliers,
  t,
  tCommon,
}: RateMatrixSectionProps) {
  const [activePreviewTab, setActivePreviewTab] = useState<string>(selectedUseGroup);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActivePreviewTab(selectedUseGroup);
  }, [selectedUseGroup]);

  const activeMultipliers = useMemo(() => {
    if (!multipliers) return [];
    return Object.entries(multipliers).filter(
      ([useGroup, value]) => value > 0 && value !== 1.0 && useGroup !== selectedUseGroup
    );
  }, [multipliers, selectedUseGroup]);

  const gridData = useMemo(() => {
    if (activePreviewTab === selectedUseGroup || !multipliers) {
      return matrixData;
    }
    const currentMultiplier = multipliers[activePreviewTab] || 1.0;
    return applyMultiplierToMatrix(matrixData as unknown as Array<Record<string, unknown>>, currentMultiplier, rateCategories) as MatrixRow[];
  }, [activePreviewTab, selectedUseGroup, matrixData, multipliers, rateCategories]);

  const isPreviewMode = activePreviewTab !== selectedUseGroup;
  const gridMode = isPreviewMode ? 'view' : (mode === 'edit' || mode === 'add' ? 'edit' : 'view');

  const singleColorClass = "text-blue-900";
  const singleColorClassHeader = "text-blue-700";

  const categoryColorMap = buildCategoryColorMap(rateCategories, singleColorClass);
  const taxZoneLabel = useAliasLabel("Tax Zone", t("aliasFallback.taxZone"));
  const typeOfUseLabel = useAliasLabel("Type_Of_Use", t("aliasFallback.typeOfUse"));
  const aliasLabels = useMemo(() => ({
    taxZone: taxZoneLabel,
    typeOfUse: typeOfUseLabel,
  }), [taxZoneLabel, typeOfUseLabel]);

  const filteredCategories = filterRateCategories(rateCategories);
  const matrixColumns = buildMatrixColumns(filteredCategories, singleColorClassHeader, tCommon, rateUnit, t, aliasLabels);
  const matrixMetaColumns = buildMatrixMetaColumns(t, aliasLabels);
  const matrixRows = buildMatrixRows(gridData, filteredCategories, zoneRemarksMap);

  return (
    <div className="mt-2 bg-white rounded-xl border border-blue-200 shadow-lg overflow-hidden">
      <RateMatrixHeader
        selectedZone={selectedZone}
        selectedZoneLabel={selectedZoneLabel}
        selectedUseGroup={selectedUseGroup}
        selectedUseGroupLabel={selectedUseGroupLabel}
        assessmentYear={assessmentYear}
        assessmentYearLabel={assessmentYearLabel}
        zoneOptions={zoneOptions}
        useGroupOptions={useGroupOptions}
        assessmentYears={assessmentYears}
        assessmentYearRanges={assessmentYearRanges}
        filledRatesCount={filledRatesCount}
        mode={mode}
        id={id}
        onAddRates={onAddRates}
        onUpdateRates={onUpdateRates}
        onDeleteRates={onDeleteRates}
        existingRateFound={existingRateFound}
        t={t}
      />

      {/* Preview Tabs */}
      <RateMatrixTabs
        activeMultipliers={activeMultipliers}
        activePreviewTab={activePreviewTab}
        setActivePreviewTab={setActivePreviewTab}
        selectedUseGroup={selectedUseGroup}
        useGroupOptions={useGroupOptions}
        t={t}
      />

      {/* Table Section */}
      <div className="bg-white p-0">
        <div className="overflow-x-auto overflow-y-auto max-h-[500px]">
          <MatrixGrid
            columns={matrixColumns}
            metaColumns={matrixMetaColumns}
            rows={matrixRows}
            colorMap={categoryColorMap}
            mode={gridMode}
            editableColumns={filteredCategories.map(cat => cat.constructionCode || cat.constructionId)}
            cellMaxValue={MAX_RATE_VALUE}
            allowZero={true}
            onCellChange={(rowId, colId, value) => {
              let numValue: number | undefined;

              if (value === undefined || value === null || value === "") {
                numValue = undefined;
              } else {
                // Sanitize and validate value
                const sanitized = sanitizePositiveDecimal(String(value));
                numValue = sanitized === "" ? undefined : Number(sanitized);
              }

              // Check if value exceeds maximum allowed rate
              if (numValue !== undefined && numValue > MAX_RATE_VALUE) {
                toast.error(t('messages.rateExceedsMaximum', { max: MAX_RATE_VALUE }));
                return;
              }

              // Find the row to get zoneNo
              const targetRow = matrixData.find(row => String(row.id) === rowId);
              const zoneNo = (targetRow?.zoneNo || (typeof targetRow === 'object' && targetRow && 'zone' in targetRow ? (targetRow as { zone?: string }).zone : undefined)) as string;

              // Update matrixData for current page
              setMatrixData(prev => prev.map(row => {
                if (String(row.id) === rowId) {
                  const updatedRow = { ...row };
                  if (numValue === undefined) {
                    updatedRow[colId] = null;
                  } else {
                    updatedRow[colId] = numValue;
                  }
                  return updatedRow;
                }
                return row;
              }));

              // Update allZoneEdits to persist across page changes
              if (zoneNo) {
                setAllZoneEdits(prevEdits => {
                  const updatedEdits = { ...prevEdits };
                  const zoneEdits = { ...(updatedEdits[zoneNo] || {}) };
                  if (numValue === undefined) {
                    zoneEdits[colId] = null as unknown as number;
                  } else {
                    zoneEdits[colId] = numValue;
                  }
                  updatedEdits[zoneNo] = zoneEdits;
                  return updatedEdits;
                });
              }
            }}
            onCellKeyDown={(e) => {
              // Prevent invalid keys for positive decimal input
              if (POSITIVE_DECIMAL_INVALID_KEYS.test(e.key)) {
                e.preventDefault();
              }
            }}
            getCellClassName={(value) => {
              // Highlight cells: blue for values that are explicitly defined, light gray for undefined
              return value !== undefined && value !== null && value !== ""
                ? "bg-blue-50 text-blue-800 border-blue-300"
                : "bg-gray-50 text-gray-500 border-gray-200";
            }}
            translations={{
              action: tCommon('table.columns.actions'),
              currencySymbol: "₹",
              deleteRow: tCommon('table.actions.delete'),
            }}
          />
        </div>

        {/* Pagination outside scrollable area */}
        <div className="mt-4">
          <MatrixGridPagination
            pageNumber={matrixPageNumber}
            pageSize={matrixPageSize}
            totalCount={matrixTotalCount}
            totalPages={matrixTotalPages}
            onPageChange={(page) => onPaginationChange(page, matrixPageSize)}
            onPageSizeChange={(size) => onPaginationChange(1, size)}
            pageSizeOptions={[100, 150, 200]}
          />
        </div>
      </div>
    </div>
  );
}
