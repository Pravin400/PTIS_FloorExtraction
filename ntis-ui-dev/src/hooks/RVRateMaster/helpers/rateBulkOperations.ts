import type { IBackendRateMaster, RateCategory } from "@/types/RVRateMaster";
import { getRateMasterByFilters } from "@/app/[locale]/property-tax/rate-master/rvratemaster/action";
import { bulkCreateRateMasterAction, bulkUpdateRateMasterAction } from "@/app/[locale]/property-tax/rate-master/rvratemaster/action";
import { buildPayloadFromMatrix, applyMultiplierToMatrix, buildBulkUpdatePayload, buildBulkCreatePayload } from "./ratePayloadHelpers";

// Error marker for no rates to update
export const NO_RATES_TO_UPDATE_ERROR = '__NO_RATES_TO_UPDATE__';

interface RateSubmission {
  matrixData: Array<Record<string, unknown>>;
  useGroup: string;
  multiplier: number;
  backendRates?: IBackendRateMaster[];
}

/**
 * Parse backend error message and return user-friendly message
 */
function parseBackendError(errorMessage: string): string {
  try {
    // Check if the error contains rate validation errors
    if (errorMessage.includes('Rate_RateSquareFeet_Min_0') ||
      errorMessage.includes('Rate_RateSquareMeter_Min_0') ||
      errorMessage.includes('RateSquareFeet') ||
      errorMessage.includes('RateSquareMeter')) {
      return 'Rate value must be valid. Please enter a positive rate value.';
    }
    // Return original message if no pattern matches
    return errorMessage;
  } catch {
    return errorMessage;
  }
}

interface BuildPayloadConfig {
  selectedZone: string;
  selectedUseGroup: string;
  assessmentYear: string;
  rateFrequency: "Monthly" | "Yearly";
  rateUnit: "SqMeter" | "SqFeet";
  rateCategories: RateCategory[];
}

interface ProcessSubmissionsResult {
  successCount: number;
  errorMessages: string[];
}

/**
 * Build all rate submissions including multiplied variants
 */
export function buildRateSubmissions(
  completeMatrixData: Array<Record<string, unknown>>,
  selectedUseGroup: string,
  multipliers: Record<string, number>,
  rateCategories: RateCategory[]
): RateSubmission[] {
  const currentMultiplier = multipliers[selectedUseGroup] || 1.0;
  const finalMatrixData = applyMultiplierToMatrix(completeMatrixData, currentMultiplier, rateCategories);

  const submissions: RateSubmission[] = [
    { matrixData: finalMatrixData, useGroup: selectedUseGroup, multiplier: currentMultiplier }
  ];

  // Add multiplied variants for other use groups
  const activeMultipliers = Object.entries(multipliers).filter(
    ([useGroup, value]) => value > 0 && value !== 1.0 && useGroup !== selectedUseGroup
  );

  activeMultipliers.forEach(([useGroup, multiplier]) => {
    const multipliedMatrixData = applyMultiplierToMatrix(completeMatrixData, multiplier, rateCategories);
    submissions.push({ matrixData: multipliedMatrixData, useGroup, multiplier });
  });

  return submissions;
}

/**
 * Fetch backend rates for a submission
 */
export async function fetchBackendRatesForSubmission(
  selectedZone: string,
  useGroup: string,
  assessmentYear: string
): Promise<IBackendRateMaster[]> {
  try {
    return await getRateMasterByFilters(selectedZone, useGroup, assessmentYear);
  } catch (_err) {
    return [];
  }
}
/**
 * Process a single rate submission (updates + inserts)
 */
export async function processSingleSubmission(
  submission: RateSubmission,
  backendRates: IBackendRateMaster[],
  config: BuildPayloadConfig & { isOpenPlot?: boolean },
  getUseGroupLabel: (useGroup: string) => string
): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = [];

  const { updates, inserts } = buildPayloadFromMatrix(
    submission.matrixData,
    backendRates,
    { ...config, selectedUseGroup: submission.useGroup },
    submission.useGroup
  );

  // Check if there are no operations to perform
  if (updates.length === 0 && inserts.length === 0) {
    errors.push(NO_RATES_TO_UPDATE_ERROR);
    return { success: false, errors };
  }

  // Process updates
  if (updates.length > 0) {
    try {
      const payload = buildBulkUpdatePayload(updates);
      const updateResult = await bulkUpdateRateMasterAction(payload);
      if (!updateResult.success) {
        const errorMsg = updateResult.message || 'Failed to update rates';
        // Check if backend returned "No rates to update" error
        if (errorMsg.includes('No rates to update')) {
          errors.push(NO_RATES_TO_UPDATE_ERROR);
        } else {
          errors.push(`${getUseGroupLabel(submission.useGroup)} (Update): ${parseBackendError(errorMsg)}`);
        }
      }
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Server action failed');
    }
  }

  // Process inserts
  if (inserts.length > 0) {
    try {
      const payload = buildBulkCreatePayload(inserts);
      const finalPayload = config.isOpenPlot
        ? payload.map(({ constructionTypeId: _constructionTypeId, ...rest }) => rest)
        : payload;

      const createResult = await bulkCreateRateMasterAction(finalPayload, config.isOpenPlot);
      if (!createResult.success) {
        const errorMsg = createResult.message || 'Failed to create rates';
        errors.push(`${getUseGroupLabel(submission.useGroup)} (Create): ${parseBackendError(errorMsg)}`);
      }
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Server action failed');
    }
  }

  const hasOperations = updates.length > 0 || inserts.length > 0;
  const success = hasOperations && errors.length === 0;

  return { success, errors };
}

/**
 * Process multiple rate submissions and collect results
 */
export async function processRateSubmissions(
  submissions: RateSubmission[],
  config: BuildPayloadConfig & { isOpenPlot?: boolean },
  _getUseGroupLabel: (useGroup: string) => string
): Promise<ProcessSubmissionsResult> {
  let successCount = 0;
  const errorMessages: string[] = [];

  for (const submission of submissions) {
    const { success, errors } = await processSingleSubmission(
      submission,
      submission.backendRates || [],
      config,
      _getUseGroupLabel
    );

    if (success) {
      successCount++;
    }

    if (errors.length > 0) {
      errorMessages.push(...errors);
    }
  }

  return { successCount, errorMessages };
}
