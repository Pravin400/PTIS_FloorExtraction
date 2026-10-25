import { BADGE_THEMES } from '@/components/modules/property-tax/ptis/shared/TaxBadge';

/**
 * Styles for assessment summary badges in the Dual Method section
 */
export const DUAL_METHOD_BADGE_STYLES = {
  outline: BADGE_THEMES.outline,
  purple: BADGE_THEMES.purple,
  teal: BADGE_THEMES.teal,
} as const;

export type DualMethodBadgeColor = keyof typeof DUAL_METHOD_BADGE_STYLES;

/**
 * Tax keys to exclude from dynamic columns in the comparison table
 * (they are typically shown as aggregates like TaxTotal)
 */
export const EXCLUDED_TAX_KEYS = ['TaxTotal'] as const;

export const DUAL_METHOD_QUERY_PARAMS = {
  SHOW_DETAILS: 'true',
} as const;
