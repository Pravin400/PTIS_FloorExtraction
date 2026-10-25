'use server';

import type { CapitalValueResponse } from '@/types/capitalValue.types';
import type { ActionResult } from '@/types/common.types';
import { getCapitalValue as getCapitalValueApi } from '@/lib/api/capitalValue.service';
import { handleServerError } from '@/lib/utils/server-action-error-handler';
import { validatePropertyId } from '@/lib/utils/ptis-normalization';

/**
 * Server action for fetching Capital Value.
 *
 * Freshness note:
 * - This path is used for request-time PTIS valuation rendering.
 * - Keep caching behavior explicit and aligned with API/service-layer policy.
 */
export async function getCapitalValue(
  propertyId: string | number
): Promise<ActionResult<CapitalValueResponse>> {
  try {
    const propertyIdNum = validatePropertyId(propertyId);
    if (!propertyIdNum) {
      return { success: false, error: 'Invalid property ID' };
    }

    const result = await getCapitalValueApi(propertyIdNum);

    if (!result.success) {
      return {
        success: false,
        error: result.error || result.message,
        message: result.message,
        warning: result.warning,
        statusCode: result.statusCode,
      };
    }

    return {
      success: true,
      data: result.data,
      message: result.message,
      warning: result.warning,
      error: result.error,
      statusCode: result.statusCode,
    };
  } catch (error: unknown) {
    return handleServerError(error, 'fetching capital value');
  }
}
