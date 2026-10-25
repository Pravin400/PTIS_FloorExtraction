/**
 * Action Response Normalization Utility
 * 
 * Provides unified handling for server action responses
 * Reduces code duplication across page components
 */

interface ActionErrorResult {
    success: false;
    error?: string;
}

interface ActionSuccessResult<T> {
    success: true;
    data?: T;
}

export type ActionResult<T> = ActionErrorResult | ActionSuccessResult<T> | T[] | T | null | undefined;

/**
 * Normalizes action results to a consistent format
 * Handles various response shapes from server actions
 * 
 * @param raw - Raw action response
 * @param onError - Optional error callback
 * @returns Normalized object or null
 */
export function normalizeActionResult(
    raw: unknown,
    onError?: (msg: string) => void
): Record<string, unknown> | null {
    if (!raw || typeof raw !== 'object') return null;

    // Error sentinel returned by the action's catch block
    if ('success' in (raw as Record<string, unknown>) &&
        !(raw as Record<string, unknown>).success) {
        if (onError) onError((raw as { error?: string }).error || 'Action failed');
        return null;
    }

    // Paginated array — use first item
    if (Array.isArray(raw)) {
        const first = raw[0];
        return first && typeof first === 'object'
            ? (first as Record<string, unknown>)
            : null;
    }

    return raw as Record<string, unknown>;
}

/**
 * Normalizes floor detail responses with success wrapper
 * 
 * @param raw - Raw floor detail response
 * @param onError - Optional error callback
 * @returns Normalized floor data or null
 */
export function normalizeFloorByIdResult(
    raw: unknown,
    onError?: (msg: string) => void
): unknown | null {
    if (!raw || typeof raw !== 'object') return null;

    const obj = raw as Record<string, unknown>;

    if ('success' in obj) {
        if (!obj.success) {
            if (onError) onError((obj.error as string) || 'Failed to fetch record');
            return null;
        }
        return obj.data ?? null;
    }

    // Plain object (not wrapped) — return as-is
    return obj;
}

/**
 * Normalizes floor list responses
 * Handles arrays, wrapped responses, and error states
 * 
 * @param raw - Raw floor list response
 * @param onError - Optional error callback
 * @returns Array of floors (empty if error)
 */
export function normalizeFloorList(
    raw: unknown,
    onError?: (msg: string) => void
): unknown[] {
    if (!raw) return [];

    if (Array.isArray(raw)) return raw;

    if (typeof raw === 'object') {
        const obj = raw as Record<string, unknown>;
        if ('success' in obj && !obj.success) {
            if (onError) onError((obj.error as string) || 'Failed to fetch list');
            return [];
        }
        if (Array.isArray(obj.data)) return obj.data;
    }

    return [];
}

/**
 * Validates and extracts results from action responses
 * Generic type-safe wrapper for checking result arrays
 * 
 * @param res - Action response to validate
 * @param name - Human-readable name for error messages
 * @param onError - Optional error callback
 * @returns Type-safe array or empty array on error
 */
export function checkActionResult<T>(
    res: unknown,
    name: string,
    onError?: (msg: string) => void
): T[] {
    if (res && typeof res === 'object' && 'success' in res && !res.success) {
        if (onError) {
            onError((res as { error?: string }).error || `Failed to fetch ${name}`);
        }
        return [];
    }
    return Array.isArray(res) ? res as T[] : [];
}
