export const WATER_BILL_ENUMS = {
  CHARGE_TYPES: ["Deposit", "Fee", "Tax", "Charge", "Penalty"] as const,
  BILLING_METHODS: ["Metered", "Flat Rate", "Slab Metered"] as const,
  STATUSES: ["Draft", "Published"] as const,
  FORMULA_CODES: [
    "UNIT_RATE",
    "FIXED",
    "UNIT_RATE_FIXED",
    "SLAB_RATE",
    "PER_CONNECTION",
    "MINIMUM_CHARGE",
  ] as const,
} as const;

export const ALLOWED_TARIFF_BILLING_METHODS = [
  ...WATER_BILL_ENUMS.BILLING_METHODS,
  "Flat",
  "Slab",
  "Annual",
] as const;

export const SUPPORTED_TARIFF_SLAB_FORMULA_CODES = WATER_BILL_ENUMS.FORMULA_CODES;

export type ChargeType = (typeof WATER_BILL_ENUMS.CHARGE_TYPES)[number];
export type BillingMethod = (typeof WATER_BILL_ENUMS.BILLING_METHODS)[number];
export type AllowedTariffBillingMethod = (typeof ALLOWED_TARIFF_BILLING_METHODS)[number];
export type TariffStatus = (typeof WATER_BILL_ENUMS.STATUSES)[number];
export type SupportedTariffSlabFormulaCode = (typeof SUPPORTED_TARIFF_SLAB_FORMULA_CODES)[number];

export const CHARGE_HEAD_LIMITS = {
  CODE_MAX: 40,
  NAME_MAX: 150,
  NAME_LOCAL_MAX: 150,
  DESCRIPTION_MAX: 50,
} as const;

export const CHARGE_HEAD_CODE_SANITIZE = /[^a-zA-Z0-9_\-]/g;
export const CHARGE_HEAD_CODE_REGEX = /^[a-zA-Z0-9_\-]+$/;

export const MULTILINGUAL_ALPHANUMERIC_REGEX = /[a-zA-Z0-9\u0900-\u097F]/;
export const hasMultilingualAlphanumeric = (val: string): boolean =>
  MULTILINGUAL_ALPHANUMERIC_REGEX.test(val);

export const CHARGE_HEAD_NAME_REGEX = /^[a-zA-Z0-9\u0900-\u097F\s._-]+$/;
export const CHARGE_HEAD_NAME_SANITIZE = /[^a-zA-Z0-9\u0900-\u097F\s._-]/g;

export const SEQUENCE_NO_MAX = 99999;

export const CHARGE_HEAD_PAGE_SIZE_OPTIONS: number[] = [5, 10, 20, 50];
