import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export type BadgeVariant =
  | 'default'
  | 'secondary'
  | 'outline'
  | 'destructive'
  | 'success'
  | 'warning'
  |  'info';

export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The visual style of the badge */
  variant?: BadgeVariant;
  /** The size of the badge */
  size?: BadgeSize;
  /** Optional icon to display before the text */
  icon?: React.ElementType;
  /** If true, displays a status dot */
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-blue-100 text-blue-700 border-transparent',
  secondary: 'bg-gray-100 text-gray-700 border-transparent',
  outline: 'text-gray-900 border-gray-200',
  destructive: 'bg-red-100 text-red-700 border-transparent',
  success: 'bg-green-100 text-green-700 border-transparent',
  warning: 'bg-yellow-100 text-yellow-800 border-transparent',
  info: 'bg-purple-100 text-purple-700 border-transparent',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'text-[10px] px-2 py-0.5 h-5 gap-1',
  md: 'text-xs px-2.5 py-0.5 h-6 gap-1.5',
  lg: 'text-sm px-3 py-1 h-7 gap-2',
};

const iconSizes: Record<BadgeSize, string> = {
  sm: 'w-3 h-3',
  md: 'w-3.5 h-3.5',
  lg: 'w-4 h-4',
};

/**
 * A status badge component for labeling and state indication.
 * Supports multiple variants, sizes, icons, and status dots.
 */
export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', icon: Icon, dot, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full font-semibold border transition-colors',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {dot && (
          <span
            className={cn('rounded-full bg-current', size === 'sm' ? 'w-1 h-1' : 'w-1.5 h-1.5')}
            aria-hidden="true"
          />
        )}
        {Icon && <Icon className={iconSizes[size]} />}
        <span>{children}</span>
      </div>
    );
  }
);

Badge.displayName = 'Badge';
