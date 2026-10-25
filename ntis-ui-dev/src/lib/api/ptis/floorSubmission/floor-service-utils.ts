import { apiClient } from "@/services/api.service";
import { ApiError } from "@/lib/utils/api";
import { PaginatedResponse } from '@/types/common-details.types';

/**
 * Type guard to safely check if an object has a specific property
 * @internal
 */
export function hasProperty<T extends string>(
    obj: unknown,
    prop: T
): obj is Record<T, unknown> {
    return typeof obj === 'object' && obj !== null && prop in obj;
}

/**
 * Safely extracts a property value from an object
 * @internal
 */
export function getPropertySafely(obj: unknown, keys: string[]): string {
    if (typeof obj !== 'object' || obj === null) return '';
    for (const key of keys) {
        if (hasProperty(obj, key)) {
            const value = obj[key];
            if (value !== null && value !== undefined) {
                return String(value);
            }
        }
    }
    return '';
}

/**
 * Internal helper for fetching items with standardized error handling
 */
export async function fetchItems<T>(url: string, errorMessage: string, options: RequestInit = { cache: 'no-store' }): Promise<T[]> {
    try {
        const response = await apiClient.get<T[] | PaginatedResponse<T>>(url, options);
        if (!response.success) {
            throw new ApiError(response.statusCode ?? 500, response.error || errorMessage, errorMessage);
        }
        const data = response.data;
        if (!data) return [];
        if (Array.isArray(data)) return data;
        
        // Handle different pagination wrappers
        const maybePaginated = data as unknown as Record<string, T[]>;
        return maybePaginated.data || maybePaginated.items || [];
    } catch (error) {
        // Error already thrown with proper ApiError - will be handled by caller
        throw error;
    }
}

/**
 * Internal helper for mapping data to dropdown options
 */
export async function getOptionsFromData<T>(
    fetchFn: () => Promise<T[]>,
    sortFn: (a: T, b: T) => number,
    mapFn: (item: T) => string
): Promise<string[]> {
    try {
        const items = await fetchFn();
        return items.sort(sortFn).map(mapFn);
    } catch (_error) {
        // Error generating options - return empty array as fallback
        return [];
    }
}
