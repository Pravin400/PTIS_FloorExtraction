/**
 * Application route constants
 */

export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    FORGOT_PASSWORD: '/auth/forgot-password',
  },
  PROPERTY_TAX: {
    SEARCH_PROPERTY: '/property-tax/search-property',
    PTIS: '/property-tax/ptis',
    APARTMENT: '/property-tax/ptis/apartment',
    REPORTS: '/property-tax/reports',
    PROPERTY_MEDIA: '/property-tax/property-media',
    PROPERTY_MEDIA_UPLOAD_DOWNLOAD: '/property-tax/property-media/upload-download',
  },
  PROFILE: '/profile',
  SETTINGS: '/settings',
  SCREEN_ACCESS: '/configuration-settings/screenAccess',
  WATER_BILL: {
    PENALTY_RULE_MASTER: '/water-bill/penalty-rule-master',
    GEOGRAPHY_UNIT_MASTER: '/water-bill/geography-unit-master',
  },
  FIRE_AUDIT: {
    ROOT: '/fire-audit',
    AUDITOR: '/fire-audit/auditor',
    CLERK: '/fire-audit/clerk',
    SURVEYOR: '/fire-audit/surveyor',
    CERTIFICATES: '/fire-audit/certificates',
    CITIZEN: '/fire-audit/citizen',
  },
} as const;
