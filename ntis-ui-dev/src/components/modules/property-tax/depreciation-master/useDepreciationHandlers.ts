"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { useRouter, usePathname } from "next/navigation";
import { useConfirm } from "@/components/common";
import {
  addRangeAction,
  syncDepreciationRatesAction,
  deleteRangeAction,
} from "@/app/[locale]/property-tax/depreciation-master/actions";
import type { RangeRow, DepreciationRow } from "@/types/depreciation.types";
import { useDepreciationValidation } from "@/hooks/useDepreciationValidation";

interface UseDepreciationHandlersParams {
  t: (key: string, values?: Record<string, string | number | Date>) => string;
  locale: string;
  pageNumber?: number;
  pageSize: number;
  dbRows: DepreciationRow[];
  ranges: RangeRow[];
  allRanges?: RangeRow[];
  effectiveSelectedRangeId: string | null;
  pendingChanges: Record<number, number>;
  setPendingChanges: React.Dispatch<React.SetStateAction<Record<number, number>>>;
  pendingNewRecords: Record<string, { minYear: number; maxYear: number; constructionTypeId: number; rate: number }>;
  setPendingNewRecords: React.Dispatch<React.SetStateAction<Record<string, { minYear: number; maxYear: number; constructionTypeId: number; rate: number }>>>;
  setLocalRateOverrides: React.Dispatch<React.SetStateAction<Record<string, Record<number, number>>>>;
  setSaving: React.Dispatch<React.SetStateAction<boolean>>;
  setMinValue: React.Dispatch<React.SetStateAction<string>>;
  setMaxValue: React.Dispatch<React.SetStateAction<string>>;
  setMinError: React.Dispatch<React.SetStateAction<string | null>>;
  setMaxError: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedRangeId: React.Dispatch<React.SetStateAction<string | null>>;
  minValue: string;
  maxValue: string;
  values?: Record<string, string | number | Date>;
}


export function useDepreciationHandlers({
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
}: UseDepreciationHandlersParams) {
  const { confirm } = useConfirm();
  const router = useRouter();
  const pathname = usePathname();
  const { validateMinMax, sanitizeInput, checkOverlap, checkGap } = useDepreciationValidation(t, values);
  const effectiveAllRanges = allRanges && allRanges.length > 0 ? allRanges : ranges;

  const buildUrl = useCallback(
    (page: number, size: number) => {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(size));
      return `${pathname}?${params.toString()}`;
    },
    [pathname]
  );

  const handlePageChange = useCallback(
    (page: number) => router.push(buildUrl(page, pageSize)),
    [router, buildUrl, pageSize]
  );

  const handlePageSizeChange = useCallback(
    (size: number) => router.push(buildUrl(1, size)),
    [router, buildUrl]
  );

  const refreshPage = useCallback(() => router.refresh(), [router]);

  const reloadData = useCallback(async () => {
    setSaving(true);
    try {
      refreshPage();
      setPendingChanges({});
      setPendingNewRecords({});
      setLocalRateOverrides({});
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t("errors.load", values));
    } finally {
      setSaving(false);
    }
  }, [t, refreshPage, setSaving, setPendingChanges, setLocalRateOverrides, setPendingNewRecords, values]);

  const handleCellChange = useCallback(
    (rowId: string, colId: string, value: string | number) => {
      const numValue = typeof value === "string" ? Number(value) : value;

      setLocalRateOverrides((prev) => {
        const existing = prev[rowId];
        return {
          ...prev,
          [rowId]: existing
            ? { ...existing, [Number(colId)]: numValue }
            : { [Number(colId)]: numValue },
        };
      });

      const range = ranges.find((r) => r.id === rowId);
      if (!range) return;

      const targetRecord = dbRows.find(
        (r) =>
          r.constructionTypeId === Number(colId) &&
          r.minYear === range.min &&
          r.maxYear === range.max
      );

      if (targetRecord?.id) {
        setPendingChanges((prev) => ({
          ...prev,
          [targetRecord.id]: numValue,
        }));
      } else {
        const newKey = `new_${range.min}_${range.max}_${colId}`;
        setPendingNewRecords((prev) => ({
          ...prev,
          [newKey]: {
            minYear: range.min,
            maxYear: range.max,
            constructionTypeId: Number(colId),
            rate: numValue,
          },
        }));
      }
    },
    [ranges, dbRows, setLocalRateOverrides, setPendingChanges, setPendingNewRecords]
  );

  const handleUpdateRates = useCallback(async () => {
    const changeCount = Object.keys(pendingChanges).length;
    const newRecordCount = Object.keys(pendingNewRecords).length;
    if (changeCount === 0 && newRecordCount === 0) {
      toast.info(t("messages.noChanges", values));
      return;
    }

    confirm({
      variant: "update",
      onConfirm: async () => {
        setSaving(true);
        const tid = toast.loading(t("messages.updating", { count: changeCount + newRecordCount, ...values }));
        try {
          const res = await syncDepreciationRatesAction(locale, dbRows, pendingChanges, pendingNewRecords);
          if (!res.success) throw new Error(res.error);
          toast.success(t("success.updated", values), { id: tid });
          await reloadData();
        } catch (err: unknown) {
          toast.error(err instanceof Error ? err.message : t("errors.update", values), { id: tid });
        } finally {
          setSaving(false);
        }
      },
    });
  }, [pendingChanges, pendingNewRecords, locale, dbRows, t, setSaving, reloadData, confirm, values]);

  const handleMinChange = useCallback(
    (value: string) => {
      const sanitized = sanitizeInput(value);
      setMinValue(sanitized);
      setMinError(null);
    },
    [sanitizeInput, setMinValue, setMinError]
  );

  const handleMaxChange = useCallback(
    (value: string) => {
      const sanitized = sanitizeInput(value);
      setMaxValue(sanitized);
      setMaxError(null);
    },
    [sanitizeInput, setMaxValue, setMaxError]
  );

  const handleAddRange = useCallback(async () => {
    const result = validateMinMax(minValue, maxValue);
    setMinError(result.minError);
    setMaxError(result.maxError);

    if (!result.valid) return;

    const overlapping = checkOverlap(Number(minValue), Number(maxValue), effectiveAllRanges);
    if (overlapping) {
      setMinError(t("errors.overlap", { range: `${overlapping.min}-${overlapping.max}`, ...values }));
      return;
    }

    const gapResult = checkGap(Number(minValue), Number(maxValue), effectiveAllRanges);
    if (gapResult !== null) {
      if (gapResult.field === 'max') {
        setMaxError(t("errors.gapMax", { expectedMax: gapResult.expectedValue, ...values }));
      } else {
        setMinError(t("errors.gapMin", { expectedMin: gapResult.expectedValue, ...values }));
      }
      return;
    }

    setSaving(true);
    const tid = toast.loading(t("messages.creatingRange", values));
    try {
      const res = await addRangeAction(locale, {
        minYear: Number(minValue),
        maxYear: Number(maxValue),
      });

      if (!res.success) throw new Error(res.error);

      toast.success(t("success.added", values), { id: tid });
      setMinValue("");
      setMaxValue("");
      await reloadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t("errors.add", values), { id: tid });
    } finally {
      setSaving(false);
    }
  }, [minValue, maxValue, effectiveAllRanges, locale, t, validateMinMax, checkOverlap, checkGap, setMinError, setMaxError, setSaving, setMinValue, setMaxValue, reloadData, values]);

  const handleDeleteRange = useCallback(async () => {
    if (!effectiveSelectedRangeId) return;
    const range = effectiveAllRanges.find((r) => r.id === effectiveSelectedRangeId);
    if (!range) return;

    confirm({
      variant: "delete",
      title: t("deleteRangeConfirmTitle", values),
      description: t("deleteRangeConfirmDesc", {
        min: range.min,
        max: range.max,
        age: `${range.min}-${range.max}`,
        ...values,
      }),
      meta: { range: `${range.min}-${range.max}` },
      onConfirm: async () => {
        setSaving(true);
        try {
          const res = await deleteRangeAction(locale, {
            minYear: range.min,
            maxYear: range.max,
          });
          if (!res.success) throw new Error(res.error);
          toast.success(t("success.deleted", values));
          await reloadData();
        } catch (err: unknown) {
          toast.error(err instanceof Error ? err.message : t("errors.delete", values));
        } finally {
          setSaving(false);
        }
      },
    });
  }, [effectiveSelectedRangeId, effectiveAllRanges, locale, t, confirm, setSaving, reloadData, values]);

  const handleRangeSelection = useCallback(
    (rangeId: string | null) => {
      setSelectedRangeId(rangeId);
      if (rangeId && pageSize > 0 && effectiveAllRanges.length > 0) {
        const rangeIndex = effectiveAllRanges.findIndex((r) => r.id === rangeId);
        if (rangeIndex !== -1) {
          const targetPage = Math.floor(rangeIndex / pageSize) + 1;
          if (pageNumber && targetPage !== pageNumber) {
            router.push(buildUrl(targetPage, pageSize));
          }
        }
      }
    },
    [setSelectedRangeId, pageSize, effectiveAllRanges, pageNumber, router, buildUrl]
  );

  return {
    handlePageChange,
    handlePageSizeChange,
    handleCellChange,
    handleUpdateRates,
    handleMinChange,
    handleMaxChange,
    handleAddRange,
    handleDeleteRange,
    handleRangeSelection,
  };
}
