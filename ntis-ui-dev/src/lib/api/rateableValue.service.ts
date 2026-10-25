import { apiClient } from '@/services/api.service';
import { RateableValueResponse } from '@/types/rateableValue.types';
import type { ActionResult } from '@/types/common.types';
import { normalizePtisTaxes, validatePropertyId } from '@/lib/utils/ptis-normalization';
import { handleServerError } from '@/lib/utils/server-action-error-handler';

function normalizeRateableValueResponse(data: RateableValueResponse): RateableValueResponse {
    return {
        ...data,
        propertyId: Number(data.propertyId ?? 0),
        financeYear: Number(data.financeYear ?? 0),
        totalRateableValue: data.totalRateableValue != null ? Number(data.totalRateableValue) : undefined,
        totalTax: data.totalTax != null ? Number(data.totalTax) : undefined,
        policy: {
            ...(data.policy ?? {}),
            policyCode: data.policy?.policyCode ?? '',
            policyDate: data.policy?.policyDate ?? '',
            policyYear: Number(data.policy?.policyYear ?? 0),
            policyRVorCVvalue: Number(data.policy?.policyRVorCVvalue ?? 0),
            taxTotal: Number(data.policy?.taxTotal ?? 0),
            taxes: normalizePtisTaxes(data.policy?.taxes),
        },
        details: (Array.isArray(data.details) ? data.details : Array.isArray(data.items) ? data.items : [])
            .map((item) => ({
                ...item,
                propertyDetailsId: Number(item.propertyDetailsId ?? 0),
                noOfRooms: Number(item.noOfRooms ?? 0),
                carpetAreaSqFeet: Number(item.carpetAreaSqFeet ?? 0),
                carpetAreaSqMeter: Number(item.carpetAreaSqMeter ?? 0),
                builtupAreaSqFeet: Number(item.builtupAreaSqFeet ?? 0),
                builtupAreaSqMeter: Number(item.builtupAreaSqMeter ?? 0),
                rentMonthly: Number(item.rentMonthly ?? 0),
                rentYearly: Number(item.rentYearly ?? 0),
                monthlyRate: Number(item.monthlyRate ?? 0),
                yearlyRate: Number(item.yearlyRate ?? 0),
                yearlyRent: Number(item.yearlyRent ?? 0),
                depreciation: Number(item.depreciation ?? 0),
                annualRentalValue: Number(item.annualRentalValue ?? 0),
                maintenance: Number(item.maintenance ?? 0),
                rateableValue: Number(item.rateableValue ?? 0),
                taxTotal: Number(item.taxTotal ?? 0),
                taxes: normalizePtisTaxes(item.taxes),
            })),
    };

}

/**
 * Service to handle Rateable Value related API calls.
 */
export async function getRateableValue(
    propertyId: number | string,
    financeYear?: number,
    forceRecalculate: boolean = true
): Promise<ActionResult<RateableValueResponse>> {
    try {
        const propertyIdNum = validatePropertyId(propertyId);

        if (!propertyIdNum) {
            return { success: false, error: 'Invalid property ID' };
        }

        const queryParams = new URLSearchParams();
        if (financeYear) {
            queryParams.set('financeYear', String(financeYear));
        }
        if (forceRecalculate !== undefined) {
            queryParams.set('forceRecalculate', String(forceRecalculate));
        }

        const queryString = queryParams.toString();
        const endpoint = queryString
            ? `/rateable-value/${propertyIdNum}?${queryString}`
            : `/rateable-value/${propertyIdNum}`;

        const payload = {
            forceRecalculate,
        };

        const response = await apiClient.post<RateableValueResponse>(endpoint, payload, {
            cache: 'no-store',
        });

        if (!response.success || !response.data) {
            return {
                success: false,
                error: response.error || 'Failed to fetch rateable value',
                message: response.message,
                statusCode: response.statusCode
            };
        }

        return {
            success: true,
            data: normalizeRateableValueResponse(response.data),
            message: response.message,
            error: response.error,
            statusCode: response.statusCode
        };
    } catch (error: unknown) {
        return handleServerError(error, 'fetching rateable value');
    }
}
