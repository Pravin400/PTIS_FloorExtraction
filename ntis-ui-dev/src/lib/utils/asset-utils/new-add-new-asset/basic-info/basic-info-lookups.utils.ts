 
/**
 * basic-info-lookups.utils.ts — shared helpers for the Basic Info lookup
 * server actions (subzones, wards, sub-types, designations, parent assets).
 */

import type { GenericLookupEnvelope, ActivatableItem } from "@/types/asset/municipal-Asset/new-add-new-asset";

export type { GenericLookupEnvelope, ActivatableItem };

export function extractItemsArray<T>(data: T[] | GenericLookupEnvelope<T> | null | undefined): T[] {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [];
  const items = data.items || data.Items || data.data;
  return Array.isArray(items) ? items : [];
}

export function filterActiveItems<T extends ActivatableItem>(items: T[]): T[] {
  return items.filter((item) => {
    return (
      item.isActive !== false &&
      item.isActive !== 0 &&
      item.IsActive !== false &&
      item.IsActive !== 0 &&
      (typeof item.status !== "string" || item.status.toLowerCase() !== "inactive")
    );
  });
}
