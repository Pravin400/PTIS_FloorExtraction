'use server';

import type { PropertyComparisonResponse } from '@/types/propertyComparison.types';
import type { ActionResult } from '@/types/common.types';
import { getPropertyComparison as getPropertyComparisonApi } from '@/lib/api/propertyComparison.service';
import { handleServerError } from '@/lib/utils/server-action-error-handler';
import { validatePropertyId } from '@/lib/utils/ptis-normalization';

/**
 * Server action for fetching property comparison metric cards data.
 */
export async function getPropertyComparisonAction(
  newPropertyId: string | number
): Promise<ActionResult<PropertyComparisonResponse>> {
  try {
    const propertyIdNum = validatePropertyId(newPropertyId);
    if (!propertyIdNum) {
      return { success: false, error: 'Invalid property ID' };
    }

    return await getPropertyComparisonApi(propertyIdNum);
  } catch (error: unknown) {
    return handleServerError(error, 'fetching property comparison action');
  }
}
