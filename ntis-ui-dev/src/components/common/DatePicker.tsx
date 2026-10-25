'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface DatePickerProps {
  selected?: Date;
  onChange?: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

export const DatePicker: React.FC<DatePickerProps> = ({
  selected,
  onChange,
  minDate,
  maxDate,
  className
}) => {
  const [currentDate, setCurrentDate] = React.useState<Date>(selected ?? new Date());

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentDate(selected ?? new Date());
  }, [selected]);

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const handleMonthChange = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentYear, currentMonth + (direction === 'prev' ? -1 : 1), 1);
    setCurrentDate(newDate);
  };

  const handleYearChange = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentYear + (direction === 'prev' ? -1 : 1), currentMonth, 1);
    setCurrentDate(newDate);
  };

  // Generate days grid
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    // getDay() returns 0 for Sunday, 1 for Monday, etc.
    const day = new Date(year, month, 1).getDay();
    // Adjust so Monday is 0, Sunday is 6
    return day === 0 ? 6 : day - 1;
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayIndex = getFirstDayOfMonth(currentYear, currentMonth);

  const days: { date: Date; isCurrentMonth: boolean; isDisabled: boolean; isSelected: boolean }[] = [];

  // Previous month trailing days
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);

  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const dayDate = new Date(prevYear, prevMonth, daysInPrevMonth - i);
    days.push({
      date: dayDate,
      isCurrentMonth: false,
      isDisabled: checkIsDisabled(dayDate),
      isSelected: checkIsSelected(dayDate)
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    const dayDate = new Date(currentYear, currentMonth, i);
    days.push({
      date: dayDate,
      isCurrentMonth: true,
      isDisabled: checkIsDisabled(dayDate),
      isSelected: checkIsSelected(dayDate)
    });
  }

  // Next month leading days to complete grid (42 cells)
  const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
  const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
  const remainingCells = 42 - days.length;
  for (let i = 1; i <= remainingCells; i++) {
    const dayDate = new Date(nextYear, nextMonth, i);
    days.push({
      date: dayDate,
      isCurrentMonth: false,
      isDisabled: checkIsDisabled(dayDate),
      isSelected: checkIsSelected(dayDate)
    });
  }

  function checkIsDisabled(date: Date): boolean {
    const compare = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

    if (minDate) {
      const min = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate()).getTime();
      if (compare < min) return true;
    }
    if (maxDate) {
      const max = new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate()).getTime();
      if (compare > max) return true;
    }
    return false;
  }

  function checkIsSelected(date: Date): boolean {
    if (!selected) return false;
    return (
      date.getDate() === selected.getDate() &&
      date.getMonth() === selected.getMonth() &&
      date.getFullYear() === selected.getFullYear()
    );
  }

  const handleDateSelect = (date: Date, isDisabled: boolean) => {
    if (isDisabled) return;
    if (onChange) {
      onChange(date);
    }
  };

  return (
    <div className={cn('w-full max-w-[320px] bg-white border border-slate-100 rounded-2xl shadow-sm p-4 select-none', className)}>
      {/* Calendar Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex gap-1">
          <button
            onClick={() => handleYearChange('prev')}
            type="button"
            className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-lg transition"
            aria-label="Previous Year"
          >
            <ChevronsLeft className="size-4" />
          </button>
          <button
            onClick={() => handleMonthChange('prev')}
            type="button"
            className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-lg transition"
            aria-label="Previous Month"
          >
            <ChevronLeft className="size-4" />
          </button>
        </div>

        <span className="text-sm font-semibold text-slate-800">
          {MONTH_NAMES[currentMonth]} {currentYear}
        </span>

        <div className="flex gap-1">
          <button
            onClick={() => handleMonthChange('next')}
            type="button"
            className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-lg transition"
            aria-label="Next Month"
          >
            <ChevronRight className="size-4" />
          </button>
          <button
            onClick={() => handleYearChange('next')}
            type="button"
            className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-lg transition"
            aria-label="Next Year"
          >
            <ChevronsRight className="size-4" />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-y-1 text-center py-2">
        {WEEKDAYS.map((day) => (
          <span key={day} className="text-xs font-semibold text-slate-400 uppercase tracking-wider py-1">
            {day}
          </span>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-y-1 text-center">
        {days.map((day, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleDateSelect(day.date, day.isDisabled)}
            className={cn(
              'size-8 mx-auto flex items-center justify-center rounded-xl text-sm font-medium transition-all relative',
              !day.isCurrentMonth && 'text-slate-300',
              day.isCurrentMonth && !day.isDisabled && !day.isSelected && 'text-slate-700 hover:bg-slate-50',
              day.isDisabled && 'text-slate-200 cursor-not-allowed opacity-40',
              day.isSelected && 'bg-indigo-600 text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 scale-105'
            )}
            disabled={day.isDisabled}
          >
            {day.date.getDate()}
          </button>
        ))}
      </div>
    </div>
  );
};
