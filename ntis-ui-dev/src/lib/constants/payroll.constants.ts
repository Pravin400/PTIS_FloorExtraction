/**
 * Payroll Module Constants
 * Shared length constraints, pagination limits, and route paths
 */

export const PAYROLL_LIMITS = {
  CODE_MIN_LENGTH: 3,
  CODE_MAX_LENGTH: 20,
  NAME_MIN_LENGTH: 3,
  NAME_MAX_LENGTH: 100,
  NAME_REGIONAL_MIN_LENGTH: 2,
  ADDRESS_MIN_LENGTH: 5,
  ADDRESS_MAX_LENGTH: 250,
  DESCRIPTION_MAX_LENGTH: 250,
  TRUNCATE_PREVIEW_LENGTH: 60,
  MAX_PAGE_SIZE: 500,
  MAX_PAGE_NUMBER: 10000,
} as const;

export const PAYROLL_ROUTES = {
  ORGANISATION_MASTERS: '/payroll/organisation-masters',
  EMP_CLASS_MASTER: '/payroll/organisation-masters/emp-class-master',
  ZONE_DIVISION_MASTER: '/payroll/organisation-masters/zone-division-master',
  LOGIN: '/login',
} as const;
