import { apiClient } from '@/services/api.service';
import type { DualMethodResponse } from '@/types/dualMethod.types';
import type { ActionResult } from '@/types/common.types';
import { normalizePtisTaxes, validatePropertyId } from '@/lib/utils/ptis-normalization';
import { handleServerError } from '@/lib/utils/server-action-error-handler';

function getTaxTotal(totalValue: unknown, rawTaxes: unknown): number | undefined {
  if (totalValue != null) return Number(totalValue);
  const taxesTotal = (rawTaxes as Record<string, unknown>)?.TaxTotal;
  if (taxesTotal != null) return Number(taxesTotal);
  return undefined;
}

function normalizeDualMethodResponse(data: DualMethodResponse): DualMethodResponse {
  const raw = data as unknown as Record<string, unknown>;
  return {
    ...data,
    oldTaxes: normalizePtisTaxes(raw.oldTaxes),
    rvTaxes: normalizePtisTaxes(raw.rvTaxes),
    cvTaxes: normalizePtisTaxes(raw.cvTaxes),
    retainTaxes: normalizePtisTaxes(raw.retainTaxes),
    oldTaxesTotal: getTaxTotal(raw.oldTaxesTotal, raw.oldTaxes),
    rvTaxesTotal: getTaxTotal(raw.rvTaxesTotal, raw.rvTaxes),
    cvTaxesTotal: getTaxTotal(raw.cvTaxesTotal, raw.cvTaxes),
    retainTaxesTotal: getTaxTotal(raw.retainTaxesTotal, raw.retainTaxes),
  };
}

export async function getDualMethod(propertyId: number | string): Promise<ActionResult<DualMethodResponse>> {
  try {
    const propertyIdNum = validatePropertyId(propertyId);

    if (!propertyIdNum) {
      return { success: false, error: 'Invalid property ID' };
    }

    const response = await apiClient.get<DualMethodResponse>(`/DualMethod/${propertyIdNum}`, {
      cache: 'no-store',
    });

    if (!response.success || !response.data) {
      return {
        success: false,
        error: response.error || 'Failed to fetch dual method data',
        statusCode: response.statusCode
      };
    }

    return {
      success: true,
      data: normalizeDualMethodResponse(response.data),
      statusCode: response.statusCode
    };
  } catch (error: unknown) {
    return handleServerError(error, 'fetching dual method data');
  }
}
