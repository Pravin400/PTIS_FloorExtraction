/**
 * Dropdown Helpers
 * 
 * Shared utilities for normalizing dropdown options from various data sources.
 * Handles API responses that may return string arrays, lookup arrays, or error objects.
 */

/**
 * Generic lookup record with common field patterns
 */
export interface LookupRecord {
  floorCode?: string;
  subFloorCode?: string;
  typeOfUseCode?: string;
  constructionTypeCode?: string;
  description?: string;
  [key: string]: unknown;
}

/**
 * Normalizes various option formats to a string array for dropdown consumption
 * 
 * @param options - Can be string array, lookup array, or error object
 * @returns Normalized string array for dropdown options
 * 
 * @example
 * ```ts
 * // String array (already normalized)
 * const options1 = normalizeToStringArray(['Option 1', 'Option 2']);
 * 
 * // Lookup array
 * const options2 = normalizeToStringArray([
 *   { floorCode: 'G', description: 'Ground Floor' },
 *   { floorCode: '1', description: 'First Floor' }
 * ]);
 * // Returns: ['G - Ground Floor', '1 - First Floor']
 * 
 * // Error object (fallback to empty array)
 * const options3 = normalizeToStringArray({ success: false, error: 'Failed' });
 * // Returns: []
 * ```
 */
export function normalizeToStringArray<T extends LookupRecord>(
  options: string[] | T[] | { success: boolean; error: string }
): string[] {
  // Handle error objects
  if (!Array.isArray(options)) {
    return [];
  }

  // Handle empty arrays
  if (options.length === 0) {
    return [];
  }

  // Already a string array - return as is
  if (typeof options[0] === 'string') {
    return options as string[];
  }

  // Lookup array - extract string options
  return (options as T[])
    .filter(item => item.isActive !== false && item.IsActive !== false)
    .map(item => {
    const code = item.floorCode || 
                 item.typeOfUseCode || 
                 item.constructionCode ||      // For ConstructionTypeResponse
                 item.constructionTypeCode ||  // For LookupRecord interface
                 item.subFloorCode || 
                 '';
    const desc = item.description || '';
    
    // Format: "CODE - Description" or just description if no code
    return code && desc ? `${code} - ${desc}` : (desc || String(code));
  });
}

/**
 * Checks if options are in error state
 */
export function isOptionsError(
  options: string[] | LookupRecord[] | { success: boolean; error: string }
): options is { success: boolean; error: string } {
  return !Array.isArray(options) && 'success' in options && !options.success;
}

/**
 * Gets error message from options if in error state
 */
export function getOptionsError(
  options: string[] | LookupRecord[] | { success: boolean; error: string }
): string | null {
  return isOptionsError(options) ? options.error : null;
}
