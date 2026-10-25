import type { RateCategory } from "@/types/RVRateMaster";

/**
 * Validate that matrix has at least one non-zero rate
 */
export function validateMatrixHasRates(
  matrixData: Array<Record<string, unknown>>,
  rateCategories: RateCategory[]
): boolean {
  return matrixData.some(row => 
    rateCategories.some(cat => {
      const key = cat.constructionCode || cat.constructionId;
      const val = row[key];
      return val !== undefined && val !== null && val !== "" && !isNaN(Number(val)) && Number(val) >= 0;
    })
  );
}

/**
 * Parse matrix data to ensure all rate values are numbers
 */
export function parseMatrixData(
  matrixData: Array<Record<string, unknown>>,
  rateCategories: RateCategory[]
): Array<Record<string, unknown>> {
  return matrixData.map(row => {
    const parsedRow = { ...row };
    rateCategories.forEach(cat => {
      const key = String(cat.constructionCode || cat.constructionId).trim();
      const val = row[key];
      parsedRow[key] = val === '' || val === null || val === undefined ? undefined : Number(val);
    });
    return parsedRow;
  });
}

/**
 * Get user-friendly labels for use groups
 */
export function formatUseGroupLabels(
  submissions: Array<{ useGroup: string }>,
  getLabel: (useGroup: string) => string
): string {
  return submissions.map(s => getLabel(s.useGroup)).join(', ');
}

/**
 * Determine appropriate result based on success/error counts
 */
export interface OperationResult {
  allSuccess: boolean;
  partialSuccess: boolean;
  totalFailure: boolean;
}

export function getOperationResult(
  successCount: number,
  totalCount: number
): OperationResult {
  return {
    allSuccess: successCount === totalCount,
    partialSuccess: successCount > 0 && successCount < totalCount,
    totalFailure: successCount === 0
  };
}
