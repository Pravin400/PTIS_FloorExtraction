//property-society.service.ts
/* ---------------- PROPERTY SOCIETY DETAILS ---------------- */

import { apiClient } from "@/services/api.service";
import { handleApiResponse } from "@/lib/utils/api";
import {
    PropertySocietyDetailsApiItem,
    PropertySocietyDetailsResponse,
    UpdatePropertySocietyDetailsDto
} from "@/types/property-society-details.types";
import { ActionResult } from "@/types/common.types";

const propertySocietyCache = new Map<number, { data: PropertySocietyDetailsApiItem | null; timestamp: number }>();
const inFlightSocietyDetails = new Map<number, Promise<PropertySocietyDetailsApiItem | null>>();
const SOCIETY_CACHE_TTL = 60 * 1000; // 60 seconds

export function invalidatePropertySocietyCache(propertyId?: number): void {
    if (!propertyId) {
        propertySocietyCache.clear();
        inFlightSocietyDetails.clear();
        return;
    }
    propertySocietyCache.delete(propertyId);
    inFlightSocietyDetails.delete(propertyId);
}

//  get Property Society details
export async function getPropertySocietyDetails(propertyId: number): Promise<PropertySocietyDetailsApiItem | null> {
    const cached = propertySocietyCache.get(propertyId);
    if (cached && Date.now() - cached.timestamp < SOCIETY_CACHE_TTL) {
        return cached.data;
    }

    const existingPromise = inFlightSocietyDetails.get(propertyId);
    if (existingPromise) {
        return existingPromise;
    }

    const fetchPromise = (async () => {
        try {
            const response = await apiClient.get<PropertySocietyDetailsResponse>(`/Property/${propertyId}/society-details`, {
                cache: 'no-store',
            });
            const result = handleApiResponse(response, "Failed to fetch property society details").items;
            propertySocietyCache.set(propertyId, { data: result, timestamp: Date.now() });
            return result;
        } catch {
            return null;
        }
    })();

    inFlightSocietyDetails.set(propertyId, fetchPromise);
    try {
        return await fetchPromise;
    } finally {
        inFlightSocietyDetails.delete(propertyId);
    }
}

/* ---------------- UPDATE PROPERTY SOCIETY DETAILS ---------------- */
export async function updatePropertySocietyDetails(propertyId: number, payload: UpdatePropertySocietyDetailsDto): Promise<ActionResult<null>> {
    invalidatePropertySocietyCache(propertyId);
    const response = await apiClient.put<ActionResult<null>>(`/Property/${propertyId}/society-details`, payload);
    return handleApiResponse(response, "Failed to update property society details");
}