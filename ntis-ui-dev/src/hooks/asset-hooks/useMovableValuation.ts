/* eslint-disable @typescript-eslint/no-explicit-any */

import { useCallback, useEffect, useRef } from "react";

/**
 * Movable-asset CV auto-recalculation.
 *
 * Previously ran inside a `useEffect` watching formData, debounced via a
 * plain `setTimeout`. Converted to a ref-held debounce invoked explicitly
 * from field onChange/onBlur handlers (see AssetValuation.tsx's
 * `handleMovableFieldChange`), so the API call is event-triggered rather
 * than effect-triggered. `scheduleRecalc` reads formData via a ref (kept in
 * sync every render) so the debounced call always sees the latest values
 * regardless of when the timer fires. A one-time mount calculation is kept
 * (ref-guarded, not reacting to changes) since `condition` can arrive
 * already-set from an earlier wizard step with no onChange on this page.
 */
export function useMovableValuation(
  formData: any,
  updateFormData: (data: any) => void,
  conditions: any[],
  isBuilding: boolean,
  isLand: boolean
) {
  const formDataRef = useRef(formData);
  const conditionsRef = useRef(conditions);
  useEffect(() => {
    formDataRef.current = formData;
    conditionsRef.current = conditions;
  });

  const lastCalculatedRef = useRef<{
    grossValue?: string;
    purchaseDate?: string;
    depreciationRate?: string;
    condition?: string;
  }>({});

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedOnceRef = useRef(false);

  const runCalculation = useCallback(async () => {
    const fd = formDataRef.current;
    if (!fd.isMovableCategory) return;

    const grossVal = String(fd.grossValue ?? "0");
    const depRate = String(fd.depreciationRate ?? "10");
    const cond = String(fd.condition ?? "Good");
    const purchaseDate = String(fd.purchaseDate ?? "");

    if (
      lastCalculatedRef.current.grossValue === grossVal &&
      lastCalculatedRef.current.purchaseDate === purchaseDate &&
      lastCalculatedRef.current.depreciationRate === depRate &&
      lastCalculatedRef.current.condition === cond
    ) {
      return;
    }

    const normalizedCond = cond.toLowerCase().trim();
    let resolvedCondFactor = 1.0;
    const conds = conditionsRef.current;
    if (conds && conds.length > 0) {
      const categoryId = Number(fd.categoryId || 0);
      const match = conds.find(
        (c) =>
          String(c.conditionName).toLowerCase().trim() === normalizedCond &&
          (categoryId === 0 || Number(c.inventoryItemCategoryId) === categoryId)
      );
      if (match) {
        resolvedCondFactor = match.conditionFactor;
      } else {
        const matchName = conds.find(
          (c) => String(c.conditionName).toLowerCase().trim() === normalizedCond
        );
        if (matchName) resolvedCondFactor = matchName.conditionFactor;
      }
    } else {
      if (normalizedCond === "good") resolvedCondFactor = 0.85;
      else if (normalizedCond === "average") resolvedCondFactor = 0.75;
      else if (normalizedCond === "poor") resolvedCondFactor = 0.40;
    }

    try {
      const { calculateMovableCVAction } = await import("@/app/[locale]/assets/municipal-Asset/new-add-new-asset/furniture-fixture/movable-cv.actions");
      const assetId = Number(fd.assetId || fd.id || 0);
      const res = await calculateMovableCVAction(assetId, resolvedCondFactor);
      const data = res.data || {};
      if (res.success && data.capitalValue !== undefined) {
        lastCalculatedRef.current = {
          grossValue: grossVal,
          purchaseDate,
          depreciationRate: depRate,
          condition: cond,
        };

        const current = formDataRef.current;
        if (
          current.capitalValue !== data.capitalValue ||
          current.currentBookValue !== data.currentBookValue ||
          current.marketValue !== data.marketValue
        ) {
          updateFormData({
            capitalValue: data.capitalValue,
            currentBookValue: data.currentBookValue,
            marketValue: data.marketValue,
          });
        }
      }
    } catch (err) {
      console.error("Failed to run movable CV calculation:", err);
    }
  }, [updateFormData]);

  const scheduleRecalc = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      runCalculation();
    }, 800);
  }, [runCalculation]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Non-movable categories: capitalValue mirrors grossValue directly, no
  // recalculation API call involved — a plain prop-derivation sync, not a
  // fetch, so it's fine to leave as a reactive effect.
  useEffect(() => {
    if (formData.isMovableCategory) return;
    if (!isBuilding && !isLand && formData.grossValue && formData.grossValue !== formData.capitalValue) {
      updateFormData({ capitalValue: formData.grossValue });
    }
  }, [formData.isMovableCategory, formData.grossValue, formData.capitalValue, isBuilding, isLand, updateFormData]);

  // One-time mount calculation (ref-guarded, not formData-reactive): needed
  // because `condition` can arrive already-set from an earlier step with no
  // onChange fired on this page to hang the trigger on.
  useEffect(() => {
    if (mountedOnceRef.current) return;
    mountedOnceRef.current = true;
    if (formData.isMovableCategory) runCalculation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { scheduleRecalc };
}
