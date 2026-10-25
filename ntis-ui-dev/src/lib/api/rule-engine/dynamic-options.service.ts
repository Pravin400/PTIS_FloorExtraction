import { cookies } from 'next/headers';
import { apiClient } from '@/services/api.service';
import { mapApiResponseWithMapping, mapApiResponseToOptions } from './mappers';

// ─── In-memory cache ──────────────────────────────────────────────────────────
// Prevents identical endpoint+params combinations from making duplicate API calls
// during the same page session (e.g. multiple ConditionRows with the same field).
const optionsCache = new Map<string, { label: string; value: string }[]>();

function makeCacheKey(endpoint: string, method: string, params?: string, mapping?: string): string {
  return `${method.toUpperCase()}:${endpoint}:${params ?? ''}:${mapping ?? ''}`;
}

/**
 * Dynamically fetches options from any PTIS backend endpoint and maps them
 * to standard { label, value }[] for use in rule-builder condition inputs.
 *
 * - GET: params appended as query string; POST: params sent as JSON body.
 * - When `mapping` is provided (serialized ApiResponseMapping JSON), uses the
 *   structured mapper (responsePath navigation + displayTemplate substitution).
 * - Falls back to the generic heuristic mapper when mapping is absent/malformed.
 * - Results are cached in-memory for the duration of the page session.
 */
export async function getDynamicFieldOptions(
  endpoint: string,
  method: string = 'GET',
  params?: string,
  mapping?: string
): Promise<{ label: string; value: string }[]> {
  try {
    let authContext = '';
    try {
      const store = await cookies();
      authContext = store.get('auth_token')?.value || store.get('user_id')?.value || '';
    } catch {}

    const cleanEndpoint = endpoint.replace(/^\/?(?:api\/)?/i, '').replace(/\/$/, '');
    const cacheKey = `${authContext}:${makeCacheKey(cleanEndpoint, method, params, mapping)}`;

    if (optionsCache.has(cacheKey)) {
      return optionsCache.get(cacheKey)!;
    }

    let paramObj: Record<string, unknown> = {};
    if (params?.trim()) {
      try { paramObj = JSON.parse(params); } catch { /* malformed — ignore */ }
    }

    // Default PageSize to -1 to fetch all records for dropdown selections
    if (!Object.keys(paramObj).some((k) => k.toLowerCase() === 'pagesize')) {
      paramObj['PageSize'] = -1;
    }

    const upperMethod = (method || 'GET').toUpperCase();
    let response;

    if (upperMethod === 'POST') {
      response = await apiClient.post<unknown>(`/${cleanEndpoint}`, paramObj);
    } else {
      const stringifiedParams: Record<string, string> = {};
      Object.entries(paramObj).forEach(([k, v]) => { stringifiedParams[k] = String(v); });
      const qs = new URLSearchParams(stringifiedParams).toString();
      const url = qs ? `/${cleanEndpoint}?${qs}` : `/${cleanEndpoint}`;
      response = await apiClient.get<unknown>(url);
    }

    if (!response.success || !response.data) return [];

    const result = mapping
      ? mapApiResponseWithMapping(response.data, mapping)
      : mapApiResponseToOptions(response.data);

    optionsCache.set(cacheKey, result);
    return result;
  } catch {
    return [];
  }
}

/** Clears the options cache (useful when navigating away or on logout). */
export function clearDynamicOptionsCache(): void {
  optionsCache.clear();
}
