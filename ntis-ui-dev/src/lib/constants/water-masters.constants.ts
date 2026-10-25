import type { LookupOption } from '@/types/water-bill/lookups.types';

export const FORMULA_CODE_OPTIONS: LookupOption[] = [
  { value: 'SLAB', label: 'Slab (Tiered consumption)' },
  { value: 'FLAT', label: 'Flat (Fixed total)' },
  { value: 'UNIT_RATE', label: 'Unit Rate (Standard per-unit)' },
  { value: 'PER_CONNECTION', label: 'Per Connection (Fixed charge per tap)' },
  { value: 'TELESCOPIC', label: 'Telescopic (Cumulative blocks)' },
  { value: 'FIXED', label: 'Fixed (Fixed amount)' },
  { value: 'ANNUAL', label: 'Annual (Fixed yearly)' },
];

export const isFlatFormula = (formulaCode?: string | null): boolean => {
  const code = (formulaCode || '').toUpperCase().trim();
  return ['FLAT', 'FIXED', 'PER_CONNECTION', 'ANNUAL'].includes(code);
};

export const PENALTY_TYPE_OPTIONS: LookupOption[] = [
  { value: 'Percentage', label: 'Percentage (%)' },
  { value: 'MonthlyPercentage', label: 'Monthly Percentage (% per month)' },
  { value: 'Flat', label: 'Flat Amount (₹)' },
];

export const STATIC_TARIFFS: LookupOption[] = [
  { value: '1', label: 'Residential Regular 2026-27 (RES-REG-2026)' },
  { value: '2', label: 'Residential Annual 2026-27 (RES-ANN-2026)' },
  { value: '3', label: 'Commercial Slab 2026-27 (COM-SLAB-2026)' },
];

export const STATIC_TAP_SIZES: LookupOption[] = [
  { value: '1', label: '1/2" (0.5 inch)' },
  { value: '2', label: '3/4" (0.75 inch)' },
  { value: '3', label: '1" (1.0 inch)' },
  { value: '4', label: '1 1/2" (1.5 inch)' },
  { value: '5', label: '2" (2.0 inch)' },
  { value: '6', label: '3" (3.0 inch)' },
  { value: '7', label: '4" (4.0 inch)' },
];

export const STATIC_GEOGRAPHY_UNITS: LookupOption[] = [
  { value: '1', label: 'Zone 1 (Z01)' },
  { value: '2', label: 'Zone 2 (Z02)' },
  { value: '3', label: 'Ward 1 (W01)' },
  { value: '4', label: 'Ward 2 (W02)' },
  { value: '5', label: 'Ward 3 (W03)' },
  { value: '6', label: 'Ward 4 (W04)' },
];

export const STATIC_FINANCIAL_YEARS: LookupOption[] = [
  { value: '1003', label: '2026-27 (Current)' },
  { value: '4', label: '2025-26' },
  { value: '3', label: '2024-25' },
  { value: '2', label: '2023-24' },
  { value: '1', label: '2022-23' },
  { value: '5', label: '2021-22' },
  { value: '6', label: '2020-21' },
];

export const STATIC_CONNECTION_CATEGORIES: LookupOption[] = [
  { value: '1', label: 'Regular (Metered)' },
  { value: '2', label: 'Annual (Non-metered)' },
  { value: '3', label: 'Flat Rate' },
  { value: '4', label: 'Slab Metered' },
];

export const STATIC_CHARGE_HEADS: LookupOption[] = [
  { value: '1', label: 'Deposit Amount' },
  { value: '2', label: 'New Installation Fee' },
  { value: '3', label: 'Road Maintenance Tax' },
  { value: '4', label: 'Maintenance Fee' },
  { value: '5', label: 'Boring Fee' },
  { value: '6', label: 'Employee Fee' },
  { value: '7', label: 'Water Charge' },
  { value: '8', label: 'Late Payment Penalty' },
];
