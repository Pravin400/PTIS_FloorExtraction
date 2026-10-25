import { apiClient } from "@/services/api.service";
import { createApiError } from "./error-helpers";

/**
 * Plot Area API payload.
 * Represents the total plot area dimensions for a property.
 */
export interface PlotAreaPayload {
    totalPlotArea: number;
    length: number;
    width: number;
}

/**
 * Updates plot area data for a property.
 * PUT /api/DataEntry/UpdateProperty/{propertyId}
 *
 * @param propertyId - The property ID
 * @param payload - Plot area dimensions (totalPlotArea, length, width)
 * @returns The updated plot area data from the backend
 * @throws ApiError if the request fails
 */
export async function updatePlotArea(
    propertyId: string | number,
    payload: PlotAreaPayload
): Promise<Record<string, unknown> | unknown> {
    const response = await apiClient.put<unknown>(
        `/DataEntry/UpdateProperty/${encodeURIComponent(String(propertyId))}`,
        payload
    );

    if (!response.success) {
        throw createApiError(
            response.statusCode,
            response.error,
            "Update plot area failed"
        );
    }

    return response.data;
}

export interface PlotAreaResponse {
    length: number | null;
    width: number | null;
    totalPlotArea: number | null;
}

/**
 * Fetches plot area data for a property.
 * GET /api/DataEntry/GetByPropertyId/{propertyId}
 *
 * @param propertyId - The property ID
 * @returns The plot area data from the backend
 * @throws ApiError if the request fails
 */
export async function getPlotArea(
    propertyId: string | number
): Promise<PlotAreaResponse> {
    const response = await apiClient.get<PlotAreaResponse>(
        `/DataEntry/GetByPropertyId/${encodeURIComponent(String(propertyId))}`
    );

    if (!response.success || !response.data) {
        throw createApiError(
            response.statusCode,
            response.error,
            "Get plot area failed"
        );
    }

    return response.data;
}
