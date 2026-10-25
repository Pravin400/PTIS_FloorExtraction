'use client';

import React, { useRef, useId } from 'react';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface DateInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  required?: boolean;
  /**
   * The date value in ISO (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss), Date object, or DD/MM/YYYY string.
   */
  value?: string | Date | null;
  /**
   * Standard React change event handler (target.value contains YYYY-MM-DD)
   */
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /**
   * Direct string value change handler receiving YYYY-MM-DD or empty string
   */
  onValueChange?: (value: string) => void;
  /**
   * When true, disables manual keyboard typing and opens calendar on click.
   * Optional / non-compulsory (defaults to false).
   */
  disableManualEntry?: boolean;
  /**
   * When true, clicking anywhere on the input opens the date picker.
   * Defaults to true if disableManualEntry is true.
   */
  openOnFieldClick?: boolean;
  /**
   * Display format for the date. Defaults to 'DD/MM/YYYY'.
   */
  displayFormat?: 'DD/MM/YYYY' | 'DD-MM-YYYY' | 'YYYY-MM-DD';
  /**
   * Minimum date allowed (YYYY-MM-DD). Defaults to '1900-01-01'.
   */
  min?: string;
  /**
   * Maximum date allowed (YYYY-MM-DD). Defaults to '2099-12-31'.
   */
  max?: string;
  'data-testid'?: string;
}

/**
 * Format any date string or Date object into DD/MM/YYYY format without timezone shift.
 */
export const formatDateDDMMYYYY = (
  dateStr?: string | Date | null,
  emptyFallback = ''
): string => {
  if (!dateStr) return emptyFallback;

  if (dateStr instanceof Date) {
    if (isNaN(dateStr.getTime())) return emptyFallback;
    const d = String(dateStr.getDate()).padStart(2, '0');
    const m = String(dateStr.getMonth() + 1).padStart(2, '0');
    const y = dateStr.getFullYear();
    return `${d}/${m}/${y}`;
  }

  const str = String(dateStr).trim();
  if (
    !str ||
    str === 'null' ||
    str === 'undefined' ||
    str === '—' ||
    str === '-' ||
    str === 'INVALID' ||
    str.startsWith('0001-01-01')
  ) {
    return emptyFallback;
  }

  // Already DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${day}/${month}/${year}`;
  }

  // ISO YYYY-MM-DD or YYYY/MM/DD
  const ymdMatch = str.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const month = ymdMatch[2].padStart(2, '0');
    const day = ymdMatch[3].padStart(2, '0');
    return `${day}/${month}/${year}`;
  }

  const d = new Date(str);
  if (isNaN(d.getTime())) return str;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Normalizes any date value to ISO YYYY-MM-DD format for native date input.
 */
export const toISODateString = (val?: string | Date | null): string => {
  if (!val) return '';
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return '';
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const str = String(val).trim();
  if (!str || str === 'INVALID') return '';

  const ymdMatch = str.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (ymdMatch) {
    const y = ymdMatch[1];
    const m = ymdMatch[2].padStart(2, '0');
    const d = ymdMatch[3].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const dmyMatch = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (dmyMatch) {
    const d = dmyMatch[1].padStart(2, '0');
    const m = dmyMatch[2].padStart(2, '0');
    const y = dmyMatch[3];
    return `${y}-${m}-${d}`;
  }

  return '';
};

/**
 * Common DateInput component with customizable formatting (DD/MM/YYYY),
 * optional manual entry restriction, click-to-open calendar, and native accessibility.
 */
export const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      fullWidth = false,
      id,
      name,
      disabled = false,
      required = false,
      value,
      onChange,
      onValueChange,
      disableManualEntry = false,
      openOnFieldClick,
      displayFormat = 'DD/MM/YYYY',
      placeholder,
      min = '1900-01-01',
      max = '2099-12-31',
      onFocus,
      onBlur,
      'data-testid': dataTestId,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || `date-input-${generatedId}`;
    const internalDateRef = useRef<HTMLInputElement>(null);
    const nativeDateRef = (ref as React.RefObject<HTMLInputElement>) || internalDateRef;

    const shouldOpenOnClick = openOnFieldClick ?? disableManualEntry;

    // Convert value to display string and ISO string
    const isoValue = toISODateString(value);
    const displayValue =
      value && value !== 'INVALID'
        ? displayFormat === 'DD/MM/YYYY'
          ? formatDateDDMMYYYY(value, '')
          : isoValue
        : '';

    const effectivePlaceholder = placeholder || displayFormat;

    const handleOpenPicker = () => {
      if (disabled) return;
      try {
        if (typeof nativeDateRef.current?.showPicker === 'function') {
          nativeDateRef.current.showPicker();
        } else {
          nativeDateRef.current?.click();
        }
      } catch {
        nativeDateRef.current?.click();
      }
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.validity?.badInput ? 'INVALID' : e.target.value;
      onValueChange?.(val);
      if (onChange) {
        onChange(e);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (disableManualEntry) {
        if (e.key === 'Tab' || e.key === 'Escape') return;
        e.preventDefault();
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
          handleOpenPicker();
        }
      }
    };

    return (
      <div className={cn('flex flex-col', fullWidth && 'w-full')}>
        {label && (
          <label htmlFor={inputId} className="mb-1.5 text-sm font-medium text-gray-700 select-none">
            {label}
            {required && <span className="text-red-500"> *</span>}
          </label>
        )}
        <div
          className={cn('relative flex items-center', shouldOpenOnClick && 'cursor-pointer')}
          onClick={shouldOpenOnClick ? handleOpenPicker : undefined}
        >
          {/* Hidden native date input that controls the browser calendar */}
          <input
            ref={nativeDateRef}
            type="date"
            name={name}
            tabIndex={-1}
            aria-hidden="true"
            min={min}
            max={max}
            value={isoValue}
            disabled={disabled}
            onChange={handleDateChange}
            className="absolute inset-0 opacity-0 pointer-events-none -z-10"
          />

          {/* Visible text input displaying DD/MM/YYYY */}
          <input
            id={inputId}
            type="text"
            readOnly={disableManualEntry}
            disabled={disabled}
            value={displayValue}
            placeholder={effectivePlaceholder}
            onFocus={onFocus}
            onBlur={onBlur}
            onKeyDown={handleKeyDown}
            onChange={(e) => {
              if (!disableManualEntry) {
                const text = e.target.value;
                const iso = toISODateString(text);
                onValueChange?.(iso || text);
                if (onChange) {
                  onChange(e);
                }
              }
            }}
            data-testid={dataTestId}
            className={cn(
              'w-full px-3 py-2 pr-10 border rounded-lg text-sm text-gray-800 transition-colors placeholder:text-gray-400',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              error ? 'border-red-500 focus:ring-red-500 !border-red-500' : 'border-gray-300 hover:border-gray-400',
              disabled && 'bg-gray-100 cursor-not-allowed opacity-50',
              shouldOpenOnClick && 'cursor-pointer select-none',
              className
            )}
            {...props}
          />

          {/* Calendar icon on right */}
          <button
            type="button"
            tabIndex={-1}
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation();
              handleOpenPicker();
            }}
            aria-label="Open calendar"
            className={cn(
              'absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-slate-100 transition-colors',
              disabled ? 'cursor-not-allowed text-gray-300' : 'cursor-pointer text-gray-400 hover:text-gray-600'
            )}
          >
            <Calendar className={cn('w-4 h-4', error && 'text-red-400')} />
          </button>
        </div>
        {error && (
          <span id={`${inputId}-error`} className="mt-1 text-sm text-red-600">
            {error}
          </span>
        )}
        {helperText && !error && (
          <span id={`${inputId}-helper`} className="mt-1 text-sm text-gray-500">
            {helperText}
          </span>
        )}
      </div>
    );
  }
);

DateInput.displayName = 'DateInput';
