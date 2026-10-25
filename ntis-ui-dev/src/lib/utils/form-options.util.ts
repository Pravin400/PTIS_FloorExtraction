/**
 * Form Options Utility
 * 
 * Provides utilities for mapping lookup data to Select/SearchSelect compatible options
 * 
 * @module form-options
 */

import { LookupData } from '@/types/common-details.types';

/**
 * Convert lookup data to Select/SearchSelect compatible options
 * 
 * Maps string labels to {label, value} objects by looking up their IDs in reference data.
 * Ensures the current value is always included in options even if not in the items array.
 * 
 * @param items - Array of display labels/descriptions from the dataset
 * @param lookup - Reference lookup data containing IDs and descriptions
 * @param idKey - Property name for the ID field in lookup data
 * @param descKey - Property name for the description field (default: 'description')
 * @param codeKey - Optional property name for code prefix (e.g., 'floorCode')
 * @param currentValue - Current selected value to ensure it's in the options
 * @param descriptionMapper - Optional custom function to map ID to description
 * @returns Array of {label, value} objects for Select/SearchSelect components
 * 
 * @example
 * const floorOptions = getSelectOptions(
 *   floorLabels,
 *   floorLookup,
 *   'floorId',
 *   'description',
 *   'floorCode',
 *   currentFloorId,
 *   getFloorDescription
 * );
 */
export const getSelectOptions = (
  items: string[],
  lookup: LookupData[],
  idKey: keyof LookupData | 'id' | 'ID',
  descKey: keyof LookupData = 'description',
  codeKey?: keyof LookupData,
  currentValue?: string | number,
  descriptionMapper?: (id: string, lookup: LookupData[]) => string
) => {
  const optionsMap = new Map<string, { label: string; value: string }>();

  // 1. Create a lookup map for faster access
  const lookupMap = new Map<string, LookupData>();
  lookup.forEach(item => {
    const desc = String(item[descKey] || '').trim();
    const code = codeKey ? String(item[codeKey] || '').trim() : '';
    const id = String(item[idKey as keyof LookupData] || item.id || item.ID || '').trim();

    // Index by description
    if (desc) lookupMap.set(desc, item);
    // Index by code - description
    if (code && desc) lookupMap.set(`${code} - ${desc}`, item);
    // Index by id - description (for cases where code is missing but ID is used as prefix)
    if (id && desc) lookupMap.set(`${id} - ${desc}`, item);
  });

  // 2. Map existing lookup items that are present in the 'items' array
  items.forEach((opt) => {
    const found = lookupMap.get(opt.trim());

    const value = found
      ? String(found[idKey as keyof LookupData] || found.id || found.ID || '')
      : opt;

    optionsMap.set(String(value), { label: opt, value: String(value) });
  });

  // 3. Ensure current value is in the map
  const currentStr = String(currentValue || '');
  if (currentStr && currentStr !== '0' && !optionsMap.has(currentStr)) {
    const label = descriptionMapper
      ? descriptionMapper(currentStr, lookup)
      : currentStr;

    optionsMap.set(currentStr, {
      label: label || currentStr,
      value: currentStr
    });
  }

  return Array.from(optionsMap.values());
};
