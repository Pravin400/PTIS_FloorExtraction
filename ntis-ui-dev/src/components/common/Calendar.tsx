'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker } from 'react-day-picker';

import { cn } from '@/lib/utils/cn';

/**
 * Calendar component that wraps `react-day-picker`'s {@link DayPicker} with
 * application-specific styling and navigation icons.
 *
 * This component forwards all {@link DayPicker} props via
 * `React.ComponentProps<typeof DayPicker>`. Props like `onSelect` and `disabled`
 * have different signatures depending on the `mode` prop (single, range, multiple).
 * TypeScript will provide proper type narrowing based on the mode you specify.
 *
 * @see https://react-day-picker.js.org/ for full DayPicker documentation
 *
 * @example
 * // Single date selection
 * <Calendar mode="single" selected={date} onSelect={setDate} />
 *
 * @example
 * // Date range selection
 * <Calendar mode="range" selected={range} onSelect={setRange} />
 */

const Calendar: React.FC<React.ComponentProps<typeof DayPicker>> = ({
  className,
  classNames,
  showOutsideDays = true,
  components,
  ...props
}) => {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row gap-2',
        month: 'flex flex-col gap-4',
        caption: 'flex justify-center pt-1 relative items-center w-full',
        caption_label: 'text-sm font-medium',
        nav: 'flex items-center gap-1',
        nav_button: cn(
          'inline-flex items-center justify-center rounded-lg font-medium transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'border-2 border-input bg-transparent hover:bg-accent',
          'size-7 p-0 opacity-50 hover:opacity-100'
        ),
        nav_button_previous: 'absolute left-1',
        nav_button_next: 'absolute right-1',
        table: 'w-full border-collapse space-x-1',
        head_row: 'flex',
        head_cell:
          'text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]',
        row: 'flex w-full mt-2',
        cell: cn(
          'relative p-0 text-center text-sm focus-within:relative focus-within:z-20',
          '[&:has([aria-selected])]:bg-accent',
          props.mode === 'range'
            ? '[&:has(>.day-range-start)]:rounded-l-md [&:has(>.day-range-end)]:rounded-r-md'
            : '[&:has([aria-selected])]:rounded-md'
        ),
        day: cn(
          'inline-flex items-center justify-center rounded-lg font-medium',
          'transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'bg-transparent hover:bg-accent',
          'size-8 p-0 font-normal aria-selected:opacity-100'
        ),
        day_range_start:
          'day-range-start aria-selected:bg-primary aria-selected:text-primary-foreground',
        day_range_end:
          'day-range-end aria-selected:bg-primary aria-selected:text-primary-foreground',
        day_selected:
          'bg-primary text-primary-foreground hover:bg-primary focus:bg-primary',
        day_today: 'bg-accent text-accent-foreground',
        day_outside:
          'day-outside text-muted-foreground aria-selected:text-muted-foreground',
        day_disabled: 'text-muted-foreground opacity-50',
        day_range_middle:
          'aria-selected:bg-accent aria-selected:text-accent-foreground',
        day_hidden: 'invisible',
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className, ...iconProps }) => {
          const Icon = orientation === 'left' ? ChevronLeft : ChevronRight;
          return <Icon className={cn('size-4', className)} {...iconProps} />;
        },
        ...components, // allow consumers to extend/override intentionally
      }}
      {...props}
    />
  );
};

Calendar.displayName = 'Calendar';

export { Calendar };

