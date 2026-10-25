 
/**
 * Shared utility for checking the active status of asset master records.
 *
 * The backend inconsistently returns active-status as camelCase (`isActive`),
 * PascalCase (`IsActive`), numeric 0/1, or a `status` string. This utility
 * centralises that logic to a single location.
 *
 * @module is-active
 */

export interface ActiveRecord {
  isActive?: boolean | number;
  IsActive?: boolean | number;
  status?: string;
}

/**
 * Returns `true` if the record is considered active.
 *
 * Handles the following API inconsistencies:
 * - Both camelCase `isActive` and PascalCase `IsActive` fields.
 * - Numeric `0` used as `false` by some backend endpoints.
 * - String `"inactive"` in a `status` field.
 *
 * @param item - Any record with optional isActive / IsActive / status fields
 */
export function isActiveRecord(item: ActiveRecord): boolean {
  const isInactive = 
    item.isActive === false ||
    item.isActive === 0 ||
    String(item.isActive).toLowerCase() === 'false' ||
    String(item.isActive) === '0' ||
    item.IsActive === false ||
    item.IsActive === 0 ||
    String(item.IsActive).toLowerCase() === 'false' ||
    String(item.IsActive) === '0' ||
    item.status?.toLowerCase() === 'inactive';

  return !isInactive;
}
