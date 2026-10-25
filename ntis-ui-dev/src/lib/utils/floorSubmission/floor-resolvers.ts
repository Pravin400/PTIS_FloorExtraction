import { LookupData } from "@/types/common-details.types";

/**
 * Type guard to check if an object has a specific property
 * @internal
 */
function hasProperty<T extends string>(
  obj: unknown,
  prop: T
): obj is Record<T, unknown> {
  return typeof obj === 'object' && obj !== null && prop in obj;
}

/**
 * Resolves a numeric ID from a value that might be an ID or a "Code - Description" string
 * Used when select components return formatted strings instead of raw IDs
 */
export const resolveIdFromDescription = (
  val: unknown,
  lookup: LookupData[],
  idKey: string,
  codeKey?: string,
  descKey: string = 'description'
): number => {
  if (!val) return 0;
  const strVal = String(val).trim();

  // If it's already a numeric ID
  if (!isNaN(Number(strVal)) && Number(strVal) > 0) return Number(strVal);

  // Try to find in lookup - use type-safe property access
  const found = lookup.find((item) => {
    const itemId = String(
      hasProperty(item, idKey) ? item[idKey] :
        (item as Record<string, unknown>).id || (item as Record<string, unknown>).ID || ''
    ).trim();

    const itemDesc = String(
      hasProperty(item, descKey) ? item[descKey] : ''
    ).trim();

    const itemCode = codeKey && hasProperty(item, codeKey)
      ? String(item[codeKey]).trim()
      : '';

    return (
      (itemId && itemId === strVal) ||
      (itemDesc && itemDesc === strVal) ||
      (itemCode && itemDesc && `${itemCode} - ${itemDesc}` === strVal)
    );
  });

  if (!found) return 0;

  // Type-safe ID extraction
  return Number(
    hasProperty(found, idKey) ? found[idKey] :
      (found as Record<string, unknown>).id || (found as Record<string, unknown>).ID || 0
  );
};

/**
 * Finds the Open Plot master floor record from floor lookup list
 */
export const findOpenPlotFloorItem = (lookup?: unknown[]): Record<string, unknown> | undefined => {
  if (!lookup || !Array.isArray(lookup)) return undefined;
  return lookup.find((f) => {
    const item = f as Record<string, unknown>;
    const code = String(item.floorCode || item.code || '').toLowerCase().trim();
    const desc = String(item.description || '').toLowerCase().trim();
    return code === 'op' || desc.includes('open plot') || desc.includes('खुला भूखंड') || desc.includes('खुली जागा');
  }) as Record<string, unknown> | undefined;
};

/**
 * Finds the Open Plot construction type record from construction lookup list
 */
export const findOpenPlotConstructionTypeItem = (lookup?: unknown[]): Record<string, unknown> | undefined => {
  if (!lookup || !Array.isArray(lookup)) return undefined;
  return lookup.find((c) => {
    const item = c as Record<string, unknown>;
    const code = String(item.constructionCode || item.code || '').toLowerCase().trim();
    const desc = String(item.description || '').toLowerCase().trim();
    return code === 'op' || desc.includes('open plot') || desc.includes('खुला भूखंड') || desc.includes('खुली जागा');
  }) as Record<string, unknown> | undefined;
};

/**
 * Finds the Open Plot type of use record from use lookup list
 */
export const findOpenPlotTypeOfUseItem = (lookup?: unknown[]): Record<string, unknown> | undefined => {
  if (!lookup || !Array.isArray(lookup)) return undefined;
  return lookup.find((u) => {
    const item = u as Record<string, unknown>;
    const code = String(item.typeOfUseCode || item.code || '').toLowerCase().trim();
    const desc = String(item.description || '').toLowerCase().trim();
    return code === 'op' || desc.includes('open plot') || desc.includes('खुला भूखंड') || desc.includes('खुली जागा');
  }) as Record<string, unknown> | undefined;
};
