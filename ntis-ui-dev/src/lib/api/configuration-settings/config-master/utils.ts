/**
 * API Response Normalization Utilities
 */

/**
 * Normalizes inconsistent backend response structures into a standard array of items.
 * Handles cases where data is nested in .items, .Items, .data.items, etc.
 */
export function normalizeApiResponse<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  
  if (!data || typeof data !== 'object') return [];
  
  const obj = data as Record<string, unknown>;
  
  // Try common nesting patterns
  const items = obj.items ?? 
                obj.Items ?? 
                (obj.data as Record<string, unknown>)?.items ?? 
                (obj.data as Record<string, unknown>)?.Items ?? 
                obj.data;
                
  return Array.isArray(items) ? (items as T[]) : [];
}
