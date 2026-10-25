import { useCallback } from "react";

type RangeValidationResult = {
  valid: boolean;
  minError: string | null;
  maxError: string | null;
};

type TranslationFn = (key: string, values?: Record<string, string | number | Date>) => string;

type ExistingRange = { min: number; max: number };

export function useDepreciationValidation(t: TranslationFn, values?: Record<string, string | number | Date>) {
  /**
   * Returns the first existing range that [newMin, newMax] overlaps with, or null if none.
   * Uses inclusive boundary comparison: ranges sharing an endpoint are considered overlapping.
   * NOTE: Only checks ranges visible on the current page. The server is the
   * authoritative guard for ranges on other pages (returns 409 on conflict).
   */
  const checkOverlap = useCallback(
    (newMin: number, newMax: number, existingRanges: ExistingRange[]): ExistingRange | null => {
      return existingRanges.find((r) => newMin <= r.max && newMax >= r.min) ?? null;
    },
    []
  );

  /**
   * Validate basic rules for min and max values
   */
  const validateBasicRules = useCallback((min: string, max: string) => {
    const errors = { minError: null as string | null, maxError: null as string | null };

    // Required validation
    if (!min) errors.minError = t("errors.minMax", values);
    if (!max) errors.maxError = t("errors.minMax", values);
    if (errors.minError || errors.maxError) return errors;

    // Number validation - allow negative for now to catch them in next step
    if (!/^-?\d+$/.test(min)) errors.minError = t("errors.mustBeNumber", values);
    if (!/^-?\d+$/.test(max)) errors.maxError = t("errors.mustBeNumber", values);
    if (errors.minError || errors.maxError) return errors;

    const minNum = Number(min);
    const maxNum = Number(max);

    // Negative validation (after ensuring it's a valid number)
    if (minNum < 0) errors.minError = t("errors.cannotBeNegative", values);
    if (maxNum < 0) errors.maxError = t("errors.cannotBeNegative", values);
    if (errors.minError || errors.maxError) return errors;

    // Range and limit validation
    if (minNum > 999) errors.minError = t("errors.mustBe999OrLess", values);
    if (maxNum > 999) errors.maxError = t("errors.mustBe999OrLess", values);
    if (minNum >= maxNum) errors.maxError = t("errors.invalidRange", values);

    return errors;
  }, [t, values]);

  /**
   * Validate min and max values with basic rules (no overlap check)
   */
  const validateMinMax = useCallback(
    (min: string, max: string): RangeValidationResult => {
      const { minError, maxError } = validateBasicRules(min, max);
      const valid = !minError && !maxError;
      
      return { valid, minError, maxError };
    },
    [validateBasicRules]
  );

  /**
   * Sanitize input value - allow only digits up to 3 characters.
   * Numeric range validation is enforced separately by `validateBasicRules` (0-999).
   */
  const sanitizeInput = useCallback((value: string): string => {
    return value.replaceAll(/\D/g, "").slice(0, 3);
  }, []);

  /**
   * Checks if adding a new range will create an invalid gap.
   * A new range is VALID if:
   * 1. It is anchored (starts at 0, or abuts an existing range).
   * 2. AND it does not leave a gap of exactly 1 year anywhere (a single year is treated as a typo).
   * If it leaves a gap of >1 year, it is allowed so the user can fill it later.
   * Returns an object indicating which field (min or max) should be changed to connect it, or null if valid.
   */
  const checkGap = useCallback(
    (newMin: number, newMax: number, existingRanges: ExistingRange[]) => {
      if (existingRanges.length === 0) {
        if (newMin !== 0) return { field: 'min', expectedValue: 0 };
        return null;
      }
      
      const sorted = [...existingRanges].sort((a, b) => a.min - b.min);
      const nextRangeIndex = sorted.findIndex(r => r.min > newMax);
      
      // 1. Check if the new range is anchored
      const isAnchored = newMin === 0 || existingRanges.some(
        r => newMin === r.max + 1 || newMax === r.min - 1
      );

      if (!isAnchored) {
        // Guide them to anchor it
        if (nextRangeIndex === 0) {
          return { field: 'max', expectedValue: sorted[0].min - 1 };
        } else if (nextRangeIndex === -1) {
          return { field: 'min', expectedValue: sorted[sorted.length - 1].max + 1 };
        } else {
          return { field: 'min', expectedValue: sorted[nextRangeIndex - 1].max + 1 };
        }
      }

      // 2. It is anchored. Check if it leaves a gap of exactly 1 year.
      const newRange = { min: newMin, max: newMax };
      const allRanges = [...sorted, newRange].sort((a, b) => a.min - b.min);
      
      // Check gap before the first range
      if (allRanges[0].min === 1) {
         if (allRanges[0] === newRange) {
           return { field: 'min', expectedValue: 0 };
         }
      }

      for (let i = 0; i < allRanges.length - 1; i++) {
        const gapStart = allRanges[i].max + 1;
        const gapEnd = allRanges[i+1].min - 1;
        
        if (gapStart <= gapEnd) {
          const gapSize = gapEnd - gapStart + 1;
          
          if (gapSize === 1) {
            // A single year gap is not allowed. Point the error to the new range.
            if (allRanges[i] === newRange) {
              return { field: 'max', expectedValue: gapEnd };
            } else if (allRanges[i+1] === newRange) {
              return { field: 'min', expectedValue: gapStart };
            } else {
              // Existing single year gap elsewhere, point to it just in case.
              return { field: 'min', expectedValue: gapStart };
            }
          }
        }
      }

      return null;
    },
    []
  );

  return {
    validateMinMax,
    sanitizeInput,
    checkOverlap,
    checkGap,
  };
}
