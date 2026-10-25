"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { JSX } from "react";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";
import type { RangeRow, DepreciationMasterProps } from "@/types/depreciation.types";
import { DepreciationMasterGrid } from "./DepreciationMasterGrid";
import { useDepreciationHandlers } from "./useDepreciationHandlers";

function makeRangeId(min: number, max: number): string {
  return `${min}-${max}`;
}

export default function DepreciationMaster({
  data,
  constructionTypes: initialConstructionTypes,
  allRanges: initialAllRanges,
  pageNumber,
  pageSize,
  totalCount,
  totalPages,
  locale: localeProp,
}: Readonly<DepreciationMasterProps>): JSX.Element {
  const t = useTranslations("depreciation.depreciationMaster");
  const locale = localeProp ?? "en";

  const assessmentLabel = useAliasLabel("Assessment", t("aliasFallback.assessment") || t("aliasFallback.entity"));
  const constructionTypeLabel = useAliasLabel("Construction_Type", t("aliasFallback.constructionType") || t("aliasFallback.entity"));

  const values = useMemo(
    () => ({
      assessment: assessmentLabel,
      constructionType: constructionTypeLabel,
      entity: assessmentLabel,
    }),
    [assessmentLabel, constructionTypeLabel]
  );

  /* ----------------------------- State ----------------------------- */
  const [saving, setSaving] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Record<number, number>>({});
  const [pendingNewRecords, setPendingNewRecords] = useState<
    Record<string, { minYear: number; maxYear: number; constructionTypeId: number; rate: number }>
  >({});
  const [minValue, setMinValue] = useState("");
  const [maxValue, setMaxValue] = useState("");
  const [minError, setMinError] = useState<string | null>(null);
  const [maxError, setMaxError] = useState<string | null>(null);
  const [selectedRangeId, setSelectedRangeId] = useState<string | null>(null);
  const [localRateOverrides, setLocalRateOverrides] = useState<Record<string, Record<number, number>>>({});

  /* ================= DERIVED STATE (useMemo) ================= */
  const derivedState = useMemo(() => {
    const rangeMap = new Map<string, RangeRow>();
    const rateMap: Record<string, Record<number, number>> = {};

    data.forEach((row) => {
      const id = makeRangeId(row.minYear, row.maxYear);

      if (!rangeMap.has(id)) {
        rangeMap.set(id, {
          id,
          min: row.minYear,
          max: row.maxYear,
          label: `${row.minYear}-${row.maxYear}`,
        });
      }

      if (!rateMap[id]) rateMap[id] = {};
      rateMap[id][row.constructionTypeId] = row.rate ?? 0;
    });

    const currentPageRanges = Array.from(rangeMap.values()).sort((a, b) => a.min - b.min);
    const effectiveAllRanges = initialAllRanges && initialAllRanges.length > 0 ? initialAllRanges : currentPageRanges;

    return {
      dbRows: data,
      ranges: currentPageRanges,
      allRanges: effectiveAllRanges,
      baseRatesByRange: rateMap,
      defaultSelectedRangeId: effectiveAllRanges[0]?.id ?? currentPageRanges[0]?.id ?? null,
    };
  }, [data, initialAllRanges]);

  // Merge base rates with local overrides
  const ratesByRange = useMemo(() => {
    const merged: Record<string, Record<number, number>> = {};
    for (const rangeId of Object.keys(derivedState.baseRatesByRange)) {
      const base = derivedState.baseRatesByRange[rangeId];
      const overrides = localRateOverrides[rangeId];
      merged[rangeId] = overrides ? { ...base, ...overrides } : base;
    }
    return merged;
  }, [derivedState.baseRatesByRange, localRateOverrides]);

  // Destructure for easier access
  const { dbRows, ranges, allRanges, defaultSelectedRangeId } = derivedState;

  // Use selected range or fallback to default
  const effectiveSelectedRangeId = useMemo(() => {
    if (selectedRangeId && allRanges.some((r) => r.id === selectedRangeId)) {
      return selectedRangeId;
    }
    return defaultSelectedRangeId;
  }, [selectedRangeId, allRanges, defaultSelectedRangeId]);

  /* ================= HANDLERS HOOK ================= */
  const {
    handlePageChange,
    handlePageSizeChange,
    handleCellChange,
    handleUpdateRates,
    handleMinChange,
    handleMaxChange,
    handleAddRange,
    handleDeleteRange,
    handleRangeSelection,
  } = useDepreciationHandlers({
    t,
    locale,
    pageNumber,
    pageSize,
    dbRows,
    ranges,
    allRanges,
    effectiveSelectedRangeId,
    pendingChanges,
    setPendingChanges,
    pendingNewRecords,
    setPendingNewRecords,
    setLocalRateOverrides,
    setSaving,
    setMinValue,
    setMaxValue,
    setMinError,
    setMaxError,
    setSelectedRangeId,
    minValue,
    maxValue,
    values,
  });

  // GRID MAPPING & RENDERING
  const matrixRows = useMemo(
    () =>
      ranges.map((r) => ({
        id: r.id,
        cells: ratesByRange[r.id] ?? {},
        meta: { range: `${r.min}-${r.max}` },
      })),
    [ranges, ratesByRange]
  );

  const visibleConstructionTypes = useMemo(() => {
    return initialConstructionTypes.filter((c) => {
      const code = c.constructionCode?.toLowerCase() || "";
      return !["op", "ops", "open plot"].includes(code);
    });
  }, [initialConstructionTypes]);

  const matrixColumns = useMemo(() => {
    return visibleConstructionTypes.map((c) => ({
      id: String(c.constructionId),
      label: c.constructionCode,
      unit: "%",
      headerClassName: "bg-blue-50 text-blue-900 font-semibold",
    }));
  }, [visibleConstructionTypes]);

  const editableColumnIds = useMemo(() => {
    return visibleConstructionTypes.map((c) => String(c.constructionId));
  }, [visibleConstructionTypes]);

  return (
    <DepreciationMasterGrid
      t={t}
      minValue={minValue}
      maxValue={maxValue}
      minError={minError}
      maxError={maxError}
      ranges={ranges}
      allRanges={allRanges}
      effectiveSelectedRangeId={effectiveSelectedRangeId}
      saving={saving}
      handleMinChange={handleMinChange}
      handleMaxChange={handleMaxChange}
      handleAddRange={handleAddRange}
      handleRangeSelection={handleRangeSelection}
      handleDeleteRange={handleDeleteRange}
      matrixColumns={matrixColumns}
      matrixRows={matrixRows}
      pageNumber={pageNumber}
      pageSize={pageSize}
      totalCount={totalCount}
      totalPages={totalPages}
      editableColumnIds={editableColumnIds}
      handleCellChange={handleCellChange}
      handleUpdateRates={handleUpdateRates}
      handlePageChange={handlePageChange}
      handlePageSizeChange={handlePageSizeChange}
      values={values}
    />
  );
}
