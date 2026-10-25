"use server";

import type { RateableValueResponse } from "@/types/rateableValue.types";
import type { ActionResult } from "@/types/common.types";
import { getRateableValue as getRateableValueApi } from "@/lib/api/rateableValue.service";
import { handleServerError } from "@/lib/utils/server-action-error-handler";
import { validatePropertyId } from "@/lib/utils/ptis-normalization";

/**
 * Server action for fetching Rateable Value.
 *
 * Freshness note:
 * - This is intended for request-time valuation reads in PTIS flows.
 * - Do not introduce static caching in this action path; keep caching decisions
 *   explicit in the API/service layer if requirements change.
 */
export async function getRateableValue(
    propertyId: string | number,
    financeYear?: number,
    forceRecalculate: boolean = true
): Promise<ActionResult<RateableValueResponse>> {
    try {
        const propertyIdNum = validatePropertyId(propertyId);
        if (!propertyIdNum) {
            return { success: false, error: 'Invalid property ID' };
        }

        const result = await getRateableValueApi(propertyIdNum, financeYear, forceRecalculate);

        if (!result.success) {
            return { success: false, error: result.error, message: result.message, statusCode: result.statusCode };
        }

        return { success: true, data: result.data, message: result.message, error: result.error, statusCode: result.statusCode };
    } catch (error: unknown) {
        return handleServerError(error, 'fetching rateable value');
    }
}
