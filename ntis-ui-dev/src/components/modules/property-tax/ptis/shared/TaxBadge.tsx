import { Badge } from '@/components/common/Badge';
import { cn } from '@/lib/utils/cn';
import { formatIndianNumber } from '@/lib/utils/format';

/**
 * Shared badge style configurations
 */
export const BADGE_THEMES = {
  blue: {
    container: 'bg-blue-50 text-blue-600 border-blue-400',
    value: 'text-blue-700',
  },
  purple: {
    container: 'bg-purple-50 text-purple-700 border-purple-400',
    value: 'text-purple-700',
  },
  teal: {
    container: 'bg-teal-50 text-teal-800 border-teal-400',
    value: 'text-teal-700',
  },
  outline: {
    container: 'bg-gray-50 text-gray-800 border-gray-300',
    value: 'text-gray-700',
  },
} as const;

export type BadgeThemeColor = keyof typeof BADGE_THEMES;

interface TaxBadgeProps {
  label: string;
  value: number | string | null;
  color?: BadgeThemeColor;
  className?: string;
}

/**
 * Reusable badge for displaying tax amounts and values across different modules.
 * Moved to shared components to support reuse in Water Tax, Trade License, etc.
 */
export function TaxBadge({ label, value, color = 'outline', className }: TaxBadgeProps) {
  const styles = BADGE_THEMES[color] || BADGE_THEMES.outline;

  const formatValue = (val: number | string | null): string => {
    if (val == null || val === '') return '-';
    const numericValue = typeof val === 'string' ? Number(val) : val;
    if (!Number.isFinite(numericValue)) return '-';
    const decimals = Number.isInteger(numericValue) ? 0 : 2;
    return formatIndianNumber(numericValue, decimals, decimals);
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        'rounded border px-2 py-0.5 text-[13px] font-extrabold shadow-sm transition-all duration-200 hover:shadow-md',
        styles.container,
        className
      )}
    >
      <span className="opacity-95">{label} :-</span>
      <span className={cn('text-[13px] font-black ml-1', styles.value)}>
        {formatValue(value)}
      </span>
    </Badge>
  );
}
