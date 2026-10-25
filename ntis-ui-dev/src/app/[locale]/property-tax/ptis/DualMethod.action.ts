"use server";

import type { DualMethodResponse } from "@/types/dualMethod.types";
import type { ActionResult } from "@/types/common.types";
import { getDualMethod as getDualMethodApi } from "@/lib/api/dualMethod.service";
import { handleServerError } from "@/lib/utils/server-action-error-handler";
import { validatePropertyId } from "@/lib/utils/ptis-normalization";
/**
 * Server action for fetching Dual Method comparison data.
 *
 * Freshness note:
 * - Used in request-time PTIS comparison rendering.
 * - Avoid implicit static caching in this action; keep data freshness strategy
 *   centralized and explicit in the service/API layer.
 */
export async function getDualMethod(
  propertyId: string | number
): Promise<ActionResult<DualMethodResponse>> {
  try {
    const propertyIdNum = validatePropertyId(propertyId);
    if (!propertyIdNum) {
      return { success: false, error: 'Invalid property ID' };
    }

    const result = await getDualMethodApi(propertyIdNum);

    if (!result.success) {
      return { success: false, error: result.error, statusCode: result.statusCode };
    }

    return { success: true, data: result.data, statusCode: result.statusCode };
  } catch (error: unknown) {
    return handleServerError(error, 'fetching dual method data');
  }
}
