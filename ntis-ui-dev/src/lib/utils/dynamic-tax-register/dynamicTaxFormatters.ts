import { ConditionItem, ResultBase, ResultMode } from '@/types/dynamic-tax-register.types';
import { FieldConfig, StaticValue } from '@/types/rule-engine';

export const GROUP_BADGE: Record<string, string> = {
  'R-Residential': 'bg-blue-100 text-blue-700 border-blue-200',
  'C-Commercial': 'bg-orange-100 text-orange-700 border-orange-200',
  'I-Industrial': 'bg-purple-100 text-purple-700 border-purple-200',
};

export const MASTER_SOURCE_VALUES = ['PropertyType', 'OwnerType', 'TypeOfUse'] as const;

/**
 * Strips any leading minus sign(s) from a numeric input's raw string value, so a
 * percentage/amount field can never hold a negative number — the "-" is simply
 * dropped as it's typed rather than accepted and rejected later. Non-negative
 * input (including "", decimals, and in-progress typing like "12.") passes through
 * unchanged.
 */
export function clampNonNegativeInput(raw: string): string {
  return raw.replace(/^-+/, '');
}

/**
 * Like clampNonNegativeInput, but also caps at `max` — for percentage fields, matching
 * whatever upper bound the backend enforces via [Range(0, max)]. Caps rather than
 * rejecting so typing isn't interrupted mid-entry (e.g. typing "1" then "10" then "100"
 * stays valid the whole way through). Defaults to 100 (Master/Condition Result Value);
 * the Value-based Tax % column and its Bulk Apply input pass 999, matching
 * `ValueBasedTaxRowDto`/`BulkApplyValueBasedTaxRequest`'s `[Range(0, 999)]`.
 */
export function clampPercentInput(raw: string, max = 100): string {
  const nonNegative = clampNonNegativeInput(raw);
  if (nonNegative === '' || nonNegative.endsWith('.')) return nonNegative;
  const num = Number(nonNegative);
  if (!Number.isFinite(num)) return nonNegative;
  return num > max ? String(max) : nonNegative;
}

/**
 * Master/Data and Condition tabs' Result Value clamp. PERCENT and FIXED share the 3-digit 999
 * ceiling (matching `[Range(0, 999)]` on the Master DTOs); PER_UNIT allows 99999, since a per-unit
 * RATE is a currency amount multiplied by a count rather than a percentage. Mirrors the per-mode
 * limits enforced in TaxConditionRuleService.ValidateAndNormalizeResult — keep the two in step.
 */
export function clampResultValueInput(raw: string, resultMode: string): string {
  return clampPercentInput(raw, resultMode === 'PER_UNIT' ? 99999 : 999);
}

function operatorLabel(field: FieldConfig | undefined, operatorCode: string): string {
  const op = field?.supportedOperators?.find((o) => o.code === operatorCode);
  return op?.label ?? operatorCode;
}

export const RANGE_OPERATOR_CODES = ['BETWEEN', 'VALUE_BETWEEN_RANGE'];
export const isRangeOperator = (operatorCode: string): boolean =>
  RANGE_OPERATOR_CODES.includes(operatorCode.trim().replace(/\s+/g, '_').toUpperCase());

/** Validates if a range operator's "To" value is less than its "From" value.
 *  Returns true if invalid (i.e. to < from), false if valid or incomplete. */
export function isInvalidRange(from: string, to: string, dataType?: string): boolean {
  if (from === '' || to === '') return false;
  const boundType = dataType === 'DATE' ? 'date' : 'number';
  if (boundType === 'number') {
    const numFrom = parseFloat(from);
    const numTo = parseFloat(to);
    return !isNaN(numFrom) && !isNaN(numTo) && numTo < numFrom;
  }
  const dateFrom = new Date(from).getTime();
  const dateTo = new Date(to).getTime();
  if (!isNaN(dateFrom) && !isNaN(dateTo)) {
    return dateTo < dateFrom;
  }
  return to < from;
}

function fieldLabel(field: FieldConfig | undefined, fieldId: string): string {
  return field?.fieldName || fieldId;
}

/** Resolves a stored raw value ("1") to its static-list display label ("First Floor"), for
 *  fields whose options come from `staticValuesJson` (a JSON array of {value, label}). */
function resolveStaticValueLabel(field: FieldConfig | undefined, rawValue: string): string {
  if (!field?.staticValuesJson) return rawValue;
  try {
    const options = JSON.parse(field.staticValuesJson) as StaticValue[];
    const match = options.find((o) => String(o.value) === String(rawValue));
    return match?.label ?? rawValue;
  } catch {
    return rawValue;
  }
}

/** Resolves a stored raw value to its display label regardless of the field's source —
 *  static-list fields resolve synchronously via `staticValuesJson`; API-sourced fields
 *  (e.g. "Owner Type") need their fetched option list passed in via `resolveApiValueLabel`
 *  (see `useDynamicTaxConditionValueLabels`), since that requires an async call this
 *  synchronous formatter can't make itself. Falls back to the raw value if unresolved. */
function resolveValueLabel(
  field: FieldConfig | undefined,
  rawValue: string,
  resolveApiValueLabel?: (fieldId: string, rawValue: string) => string | undefined
): string {
  if (field?.sourceType === 'API') {
    return (field.fieldId && resolveApiValueLabel?.(field.fieldId, rawValue)) || rawValue;
  }
  return resolveStaticValueLabel(field, rawValue);
}

/**
 * Renders a condition list as a readable summary, joining each item (after the first) with
 * its own AND/OR — evaluated strictly left-to-right, no parentheses/precedence — e.g.
 * "Floor Greater than 5 OR TypeOfUse Equal to Commercial". Empty list renders a catch-all
 * marker (a valid, "always matches" fallback row).
 */
export function formatConditionSummary(
  conditions: ConditionItem[],
  fields: FieldConfig[],
  alwaysMatchesLabel = '— always matches —',
  resolveApiValueLabel?: (fieldId: string, rawValue: string) => string | undefined
): string {
  if (conditions.length === 0) return alwaysMatchesLabel;
  return conditions
    .map((c, i) => {
      const field = fields.find((f) => f.fieldId === c.fieldId);
      const value = Array.isArray(c.value)
        ? isRangeOperator(c.operator) && c.value.length === 2
          ? `${resolveValueLabel(field, c.value[0], resolveApiValueLabel)} – ${resolveValueLabel(field, c.value[1], resolveApiValueLabel)}`
          : c.value.map((v) => resolveValueLabel(field, v, resolveApiValueLabel)).join(', ')
        : resolveValueLabel(field, c.value, resolveApiValueLabel);
      const clause = `${fieldLabel(field, c.fieldId)} ${operatorLabel(field, c.operator)} ${value}`;
      return i === 0 ? clause : `${c.logicalOperator} ${clause}`;
    })
    .join(' ');
}

/** Renders a condition rule row's effect as a short human label, e.g. "Percent 12% on RV",
 *  "Percent 10% of General Tax" for an OTHER_TAX row, or "150 per Toilet Count" for a PER_UNIT row.
 *  This formatter only takes primitives, so callers resolve the referenced tax name / unit field
 *  name themselves from whatever list they already have in scope. */
export function formatConditionEffect(
  resultMode: ResultMode,
  resultBase: ResultBase,
  resultValue: number,
  referenceTaxLabel?: string,
  unitFieldLabel?: string
): string {
  if (resultMode === 'PERCENT') {
    if (resultBase === 'OTHER_TAX') {
      return `Percent ${resultValue}% of ${referenceTaxLabel ?? 'another tax'}`;
    }
    return resultBase !== 'NONE' ? `Percent ${resultValue}% on ${resultBase}` : `Percent ${resultValue}%`;
  }
  // Must come before the FIXED fallthrough: without it a per-unit rate renders as a flat
  // "Fixed 150", which is a different (and wrong) charge — and no exhaustive switch exists here,
  // so TypeScript would not catch the omission.
  if (resultMode === 'PER_UNIT') {
    return `${resultValue} per ${unitFieldLabel ?? 'unit'}`;
  }
  return `Fixed ${resultValue}`;
}
