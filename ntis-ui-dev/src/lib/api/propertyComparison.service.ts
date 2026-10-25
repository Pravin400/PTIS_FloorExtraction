import { apiClient } from '@/services/api.service';
import type { PropertyComparisonResponse } from '@/types/propertyComparison.types';
import type { ActionResult } from '@/types/common.types';
import { validatePropertyId } from '@/lib/utils/ptis-normalization';
import { handleServerError } from '@/lib/utils/server-action-error-handler';

/**
 * Normalizes backend response objects (handles both PascalCase and camelCase keys from C# ASP.NET Core API).
 */
export function normalizePropertyComparisonResponse(raw: Record<string, unknown>): PropertyComparisonResponse {
  if (!raw || typeof raw !== 'object') {
    return {
      newPropertyId: 0,
    };
  }

  const rawArea = (raw.area ?? raw.Area) as Record<string, unknown> | undefined;
  const rawChangeOfUse = (raw.changeOfUse ?? raw.ChangeOfUse) as Record<string, unknown> | undefined;
  const rawRv = raw.rv ?? raw.Rv ?? raw.RV;
  const rawCv = raw.cv ?? raw.Cv ?? raw.CV;
  const rawAlv = raw.alv ?? raw.Alv ?? raw.ALV;
  const rawTax = raw.tax ?? raw.Tax;

  const area = rawArea
    ? {
        old: Number(rawArea.old ?? rawArea.Old ?? 0),
        new: Number(rawArea.new ?? rawArea.New ?? 0),
        change: Number(rawArea.change ?? rawArea.Change ?? 0),
        unit: String(rawArea.unit ?? rawArea.Unit ?? 'SqMeter'),
      }
    : undefined;

  const changeOfUse = rawChangeOfUse
    ? {
        hasChanged: Boolean(rawChangeOfUse.hasChanged ?? rawChangeOfUse.HasChanged ?? false),
        oldUse: String(rawChangeOfUse.oldUse ?? rawChangeOfUse.OldUse ?? 'N/A'),
        newUse: String(rawChangeOfUse.newUse ?? rawChangeOfUse.NewUse ?? 'N/A'),
      }
    : undefined;

  const parseValueComp = (val: unknown) => {
    if (!val || typeof val !== 'object') return undefined;
    const obj = val as Record<string, unknown>;
    return {
      old: Number(obj.old ?? obj.Old ?? 0),
      new: Number(obj.new ?? obj.New ?? 0),
      change: Number(obj.change ?? obj.Change ?? 0),
      changePercent:
        obj.changePercent != null
          ? Number(obj.changePercent)
          : obj.ChangePercent != null
          ? Number(obj.ChangePercent)
          : undefined,
    };
  };

  return {
    oldPropertyIds: String(raw.oldPropertyIds ?? raw.OldPropertyIds ?? ''),
    newPropertyId: Number(raw.newPropertyId ?? raw.NewPropertyId ?? 0),
    area,
    changeOfUse,
    rv: parseValueComp(rawRv),
    cv: parseValueComp(rawCv),
    alv: parseValueComp(rawAlv),
    tax: parseValueComp(rawTax),
  };
}

/**
 * Service to fetch property comparison metrics from API endpoint.
 * GET /PropertyComparison/compare?newPropertyId={newPropertyId}
 */
export async function getPropertyComparison(
  newPropertyId: number | string
): Promise<ActionResult<PropertyComparisonResponse>> {
  try {
    const propertyIdNum = validatePropertyId(newPropertyId);
    if (!propertyIdNum) {
      return { success: false, error: 'Invalid property ID' };
    }

    const endpoint = `/PropertyComparison/compare?newPropertyId=${propertyIdNum}`;

    const response = await apiClient.get<Record<string, unknown>>(endpoint, {
      cache: 'no-store',
    });

    if (!response.success || !response.data) {
      return {
        success: false,
        error: response.error || 'Failed to fetch property comparison details',
        message: response.message,
        statusCode: response.statusCode,
      };
    }

    const normalizedData = normalizePropertyComparisonResponse(response.data);

    return {
      success: true,
      data: normalizedData,
      message: response.message,
      statusCode: response.statusCode,
    };
  } catch (error: unknown) {
    return handleServerError(error, 'fetching property comparison details');
  }
}
