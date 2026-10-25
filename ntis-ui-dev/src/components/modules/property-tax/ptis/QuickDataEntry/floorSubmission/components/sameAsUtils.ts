import type { SelectableProperty } from '@/types/floor-details.types';

export const DATA_ENTRY_SAME_AS_FILTER_TYPES: Record<string, string> = {
  'type-wise': 'TYPEWISE',
  'property-wise': 'PROPERTYWISE',
  parking: 'PARKING',
};

export function normalizePartitionNo(value: string | number | null | undefined): string {
  return String(value ?? '').trim().toUpperCase();
}

export function normalizeDataEntrySameAsType(value: string | number | null | undefined): string {
  return String(value ?? '').trim().toUpperCase();
}

export function getDataEntrySameAsType(value: string | number | null | undefined): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = Number(String(value ?? '').trim());
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function getNumericDataEntrySameAsId(...values: Array<string | number | null | undefined>): number | undefined {
  for (const value of values) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return undefined;
}

export function getDataEntrySameAsTypeLabel(property: SelectableProperty | undefined): string {
  const label = String(property?.typeLabel ?? '').trim();
  if (label) return label;

  const rawType = String(property?.type ?? '').trim();
  if (!rawType || rawType === '-') return '-';
  return rawType;
}
