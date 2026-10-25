 
/**
 * active-filter.utils.ts
 *
 * Helper utility to determine whether an entity (such as AssetCategory or AssetType)
 * is active. Handles boolean, numeric (1/0), string ("1"/"0"/"true"/"false"),
 * and status ("Active"/"Inactive").
 *
 * Ensures only active entities (where isactive = 1 / true) are displayed.
 */

export function isEntityActive(item: unknown): boolean {
  if (!item || typeof item !== "object") return false;
  const record = item as Record<string, unknown>;

  const activeVal = record.isActive ?? record.IsActive ?? record.is_active;
  if (activeVal !== undefined && activeVal !== null) {
    if (typeof activeVal === "boolean") return activeVal;
    if (typeof activeVal === "number") return activeVal === 1;
    if (typeof activeVal === "string") {
      const lower = activeVal.trim().toLowerCase();
      if (lower === "1" || lower === "true" || lower === "active") return true;
      if (lower === "0" || lower === "false" || lower === "inactive") return false;
    }
    return false;
  }

  if (typeof record.status === "string") {
    const statusLower = record.status.trim().toLowerCase();
    if (statusLower === "active") return true;
    if (statusLower === "inactive") return false;
  }

  // If isActive / status is omitted (e.g. test mocks without status fields), default to true
  return true;
}
