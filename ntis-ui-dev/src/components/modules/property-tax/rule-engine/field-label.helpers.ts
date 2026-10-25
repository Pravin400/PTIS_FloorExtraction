/**
 * field-label.helpers.ts
 * Standalone utilities for formatting field names and resolving
 * user-friendly labels for rule engine condition fields and operators.
 * Extracted from useRuleBuilderHelpers.ts to comply with the 200-line component limit.
 */

/**
 * Formats camelCase/PascalCase database column IDs or field names to user-friendly titles,
 * stripping out suffixes like "Id", "ID", or "Code" if applicable, and title-casing.
 */
export function formatFieldName(fieldId: string): string {
  let name = fieldId;

  // Strip trailing "Id" / "_id" / " id" suffix (case-insensitive)
  if (name.toLowerCase().endsWith('id')) {
    const len = name.length;
    if (name.toLowerCase().endsWith(' id') || name.toLowerCase().endsWith('_id')) {
      name = name.slice(0, len - 3);
    } else {
      name = name.slice(0, len - 2);
    }
  }

  // If the whole string is UPPER_CASE (optionally with underscores), split on underscores
  if (/^[A-Z][A-Z0-9_]*$/.test(name)) {
    return name
      .replace(/_/g, ' ')
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ')
      .trim();
  }

  // Handle camelCase / PascalCase: insert space before uppercase letters preceded by lowercase
  // Also handles transitions like "CLUBHouse" → "CLUB House"
  name = name
    .replace(/([a-z])([A-Z])/g, '$1 $2')        // camelCase split
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')  // ACRONYMWord split
    .replace(/_/g, ' ')                          // underscore to space
    .trim();

  // Title-case every word
  return name
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Gets a user-friendly label for a condition field, attempting to use localized translation
 * if available, falling back to the configured name or a formatted version of the field ID.
 */
export function getFieldLabel(
  fieldId: string,
  rawLabel: string,
  t: { (key: string): string; has: (key: string) => boolean }
): string {
  const key = `fields.${fieldId}`;
  if (t && typeof t.has === 'function' && t.has(key)) {
    return t(key);
  }
  return formatFieldName(rawLabel || fieldId);
}

/**
 * Resolves mathematical/logical operators to standard user-friendly English equivalents.
 */
export function getFriendlyOperatorLabel(op: string): string {
  const clean = op.trim();
  const lower = clean.toLowerCase();
  switch (clean) {
    case '=':
    case 'EQUALS':
      return 'Equal to';
    case '?':
    case '!=':
    case 'NOT_EQUALS':
      return 'Not equal to';
    case '>':
    case 'GREATER_THAN':
      return 'Greater than';
    case '<':
    case 'LESS_THAN':
      return 'Less than';
    case '>=':
    case 'GREATER_THAN_OR_EQUALS':
      return 'Greater than or equal to';
    case '<=':
    case 'LESS_THAN_OR_EQUALS':
      return 'Less than or equal to';
    default:
      if (lower === 'in') return 'In';
      if (lower === 'not in') return 'Not in';
      if (lower === 'contains any') return 'Contains any';
      if (lower === 'contains all') return 'Contains all';
      return clean.charAt(0).toUpperCase() + clean.slice(1);
  }
}
