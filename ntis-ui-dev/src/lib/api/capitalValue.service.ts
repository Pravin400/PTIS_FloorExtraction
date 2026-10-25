import { CapitalValueItem, CapitalValueResponse } from '@/types/capitalValue.types';
import { apiClient } from '@/services/api.service';
import type { ActionResult } from '@/types/common.types';
import { normalizePtisTaxes, validatePropertyId } from '@/lib/utils/ptis-normalization';
import { handleServerError } from '@/lib/utils/server-action-error-handler';

function normalizeCapitalValueResponse(data: CapitalValueResponse): CapitalValueResponse {
    const normalizeItem = (item: CapitalValueItem): CapitalValueItem => {
        const taxes = normalizePtisTaxes(item.taxes as unknown);
        const serverTaxTotal = (taxes as { taxName?: string; amount?: number }[]).find(
            (t) => t.taxName?.toUpperCase() === 'TAXTOTAL' || t.taxName?.toUpperCase() === 'TOTAL'
        )?.amount;

        return {
            ...item,
            id: item.id ?? item.propertyDetailsId,
            propertyDetailsId: Number(item.propertyDetailsId ?? item.id ?? 0),
            propertyId: Number(item.propertyId ?? 0),
            noOfRooms: Number(item.noOfRooms ?? 0),
            carpetAreaSqFeet: item.carpetAreaSqFeet ?? null,
            carpetAreaSqMeter: item.carpetAreaSqMeter ?? null,
            builtupAreaSqFeet: item.builtupAreaSqFeet ?? null,
            builtupAreaSqMeter: item.builtupAreaSqMeter ?? null,
            sdrr: item.sdrr ?? 0,
            baseValue: item.baseValue ?? 0,
            floorFactor: item.floorFactor ?? 0,
            ageFactor: item.ageFactor ?? 0,
            ntbFactor: item.ntbFactor ?? 0,
            useFactor: item.useFactor ?? 0,
            capitalValue: item.capitalValue ?? 0,
            taxTotal: item.taxTotal ?? serverTaxTotal ?? null,
            taxes,
        };
    };

    if (Array.isArray(data)) {
        return data.map(normalizeItem);
    }

    return {
        ...data,
        items: Array.isArray(data.items) ? data.items.map(normalizeItem) : data.items,
        details: Array.isArray(data.details) ? data.details.map(normalizeItem) : data.details,
    };
}

/**
 * Fetches Capital Value details for a property
 */
export async function getCapitalValue(
    propertyId: string | number
): Promise<ActionResult<CapitalValueResponse>> {
    try {
        const propertyIdNum = validatePropertyId(propertyId);

        if (!propertyIdNum) {
            return { success: false, error: 'Invalid property ID' };
        }

        const endpoint = `/CapitalValue/${propertyIdNum}`;
        const response = await apiClient.get<CapitalValueResponse>(endpoint, {
            cache: 'no-store',
        });

        if (!response.success || !response.data) {
            return {
                success: false,
                error: response.error || response.message || 'Failed to fetch capital value',
                message: response.message,
                warning: response.warning,
                statusCode: response.statusCode
            };
        }

        return {
            success: true,
            data: normalizeCapitalValueResponse(response.data),
            message: response.message,
            warning: response.warning,
            error: response.error,
            statusCode: response.statusCode
        };
    } catch (error: unknown) {
        return handleServerError(error, 'fetching capital value');
    }
}
