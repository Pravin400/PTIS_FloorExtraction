import { apiClient } from "@/services/api.service";
import { normalizeApiFloorData } from "./floor-types-guard";
import { mergeRenterRowsIntoFloor } from "./renter-helpers";
import { createApiError } from "./error-helpers";
import {
    type FloorAPIResponse,
} from '@/types/floor-details.types';

/**
 * Internal helper to fetch PDN details
 */
export async function getPdnDetails(pdn: string): Promise<unknown | null> {
    try {
        const response = await apiClient.get<unknown>(`/Info/Pdn_Search?Pdn=${encodeURIComponent(pdn)}`, { cache: 'no-store' });
        return response.success ? response.data ?? null : null;
    } catch { return null; }
}

/**
 * Searches for a property by ward, property, and partition numbers
 */
export async function getPropertyByDetails(wardNo: string, propertyNo: string, partitionNo: string): Promise<Record<string, unknown> | null> {
    try {
        const pdn1 = `${wardNo}-${propertyNo}-${partitionNo}`;
        const result1 = await getPdnDetails(pdn1) as Record<string, unknown> | null;
        if (result1) return result1;

        const numericWard = wardNo.replace(/\D/g, '');
        if (numericWard && numericWard !== wardNo) {
            const pdn2 = `${numericWard}-${propertyNo}-${partitionNo}`;
            const result2 = await getPdnDetails(pdn2) as Record<string, unknown> | null;
            if (result2) return result2;
        }
        return null;
    } catch (_error) {
        return null;
    }
}

/**
 * Fetches submission details by ID
 */
export async function getSubmissionDetails(submissionId: number | string): Promise<Record<string, unknown> | null> {
    try {
        const floorIdNum = Number(submissionId);
        if (isNaN(floorIdNum) || floorIdNum <= 0) {
            return null;
        }
        const floorRes = await apiClient.get<FloorAPIResponse>(
            `/DataEntry/${encodeURIComponent(String(submissionId))}`,
            { cache: 'no-store' }
        );

        if (floorRes.success && floorRes.data) {
            const normalized = normalizeApiFloorData(mergeRenterRowsIntoFloor(floorRes.data));
            return normalized;
        }
        return null;
    } catch (_error) {
        return null;
    }
}

const floorSubmissionsCache = new Map<string, { data: unknown[]; timestamp: number }>();
const inFlightFloorSubmissions = new Map<string, Promise<unknown[]>>();
const FLOOR_SUBMISSIONS_TTL = 30 * 1000; // 30 seconds

export function invalidateFloorSubmissionsCache(ownerId?: number | string): void {
    if (!ownerId) {
        floorSubmissionsCache.clear();
        inFlightFloorSubmissions.clear();
        return;
    }
    const key = String(ownerId);
    floorSubmissionsCache.delete(key);
    inFlightFloorSubmissions.delete(key);
}

/**
 * Fetches all floor submissions belonging to a specific owner/property ID
 */
export async function getFloorSubmissionsByOwner(ownerId: number | string): Promise<unknown[]> {
    const key = String(ownerId);
    const cached = floorSubmissionsCache.get(key);
    if (cached && Date.now() - cached.timestamp < FLOOR_SUBMISSIONS_TTL) {
        return cached.data;
    }

    const existingPromise = inFlightFloorSubmissions.get(key);
    if (existingPromise) {
        return existingPromise;
    }

    const fetchPromise = (async () => {
        try {
            const params = new URLSearchParams({ PropertyId: key, PageSize: '100' });
            const url = `/DataEntry?${params.toString()}`;
            const response = await apiClient.get<unknown>(url, { cache: 'no-store' });

            if (!response.success || !response.data) return [];

            const data = response.data;
            let result: unknown[] = [];

            if (Array.isArray(data)) {
                result = data.map((item) => normalizeApiFloorData(item as unknown as Record<string, unknown>));
            } else if (typeof data === 'object' && data !== null) {
                const maybePaginated = data as Record<string, unknown>;
                if (Array.isArray(maybePaginated.items)) {
                    result = maybePaginated.items.map((item) => normalizeApiFloorData(item as unknown as Record<string, unknown>));
                } else if (maybePaginated.id) {
                    result = [normalizeApiFloorData(data as unknown as Record<string, unknown>)];
                }
            }
            floorSubmissionsCache.set(key, { data: result, timestamp: Date.now() });
            return result;
        } catch (_error) {
            return [];
        }
    })();

    inFlightFloorSubmissions.set(key, fetchPromise);
    try {
        return await fetchPromise;
    } finally {
        inFlightFloorSubmissions.delete(key);
    }
}

/**
 * Fetches a single floor submission by its ID
 */
export async function getFloorById(floorId: number | string): Promise<Record<string, unknown>> {
    try {
        const floorIdNum = Number(floorId);
        if (isNaN(floorIdNum) || floorIdNum <= 0) {
            return {};
        }
        const floorRes = await apiClient.get<FloorAPIResponse>(
            `/DataEntry/${encodeURIComponent(String(floorId))}`,
            { cache: 'no-store' }
        );

        if (!floorRes.success || !floorRes.data) {
            throw createApiError(floorRes.statusCode, floorRes.error, `Failed to fetch floor data ${floorId}`);
        }

        const normalized = normalizeApiFloorData(mergeRenterRowsIntoFloor(floorRes.data));
        return normalized;
    } catch (error) {
        throw error;
    }
}

/**
 * Gets raw floor data without mapping (for internal use)
 */
export async function getFloorByIdRaw(floorId: number | string): Promise<FloorAPIResponse | null> {
    try {
        const response = await apiClient.get<FloorAPIResponse>(`/DataEntry/${encodeURIComponent(String(floorId))}`, { cache: 'no-store' });
        if (!response.success || !response.data) {
            return null;
        }
        return response.data;
    } catch (_error) {
        return null;
    }
}
