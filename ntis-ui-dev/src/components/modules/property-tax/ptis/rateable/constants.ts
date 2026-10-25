/**
 * Styles for assessment summary badges in the Rateable section
 */
import { BADGE_THEMES } from '@/components/modules/property-tax/ptis/shared/TaxBadge';

export const RATEABLE_BADGE_STYLES = {
  blue: BADGE_THEMES.blue,
  purple: BADGE_THEMES.purple,
} as const;

export type RateableBadgeColor = keyof typeof RATEABLE_BADGE_STYLES;