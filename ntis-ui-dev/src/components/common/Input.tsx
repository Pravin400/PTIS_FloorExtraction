import React, { useId } from 'react';
import { cn } from '@/lib/utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  required?: boolean;
  /**
   * Render just the bare input element without wrapper, label, error, or default styling.
   * In naked mode, consumers have full control via className - no default padding, borders, or focus styles are applied.
   * Useful for custom-styled inputs like digit-by-digit fields (Aadhar/Mobile).
   */
  naked?: boolean;
  'data-testid'?: string;
}

/**
 * Input component with label, error, and helper text support
 * Follows accessibility best practices
 * 
 * @param naked - If true, renders only the bare input element without any default styling.
 *                Consumers must provide all styling via className for complete control.
 * 
 * @example
 * ```tsx
 * // Standard mode with label and validation
 * <Input label="Email" error="Invalid email" value={email} onChange={setEmail} />
 * 
 * // Naked mode for custom styling (digit inputs, etc.)
 * <Input naked className="w-8 h-8 text-center border" maxLength={1} />
 * ```
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, fullWidth = false, naked = false, id, disabled, required, value, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || `input-${generatedId}`;

    const isControlled = 'value' in props || value !== undefined;
    const normalizedValue = isControlled ? (value ?? '') : undefined;

    // Naked mode: render just the input element with minimal/no default styling
    // Consumers have full control over appearance via className
    if (naked) {
      return (
        <input
          id={inputId}
          ref={ref}
          required={required}
          className={className}
          disabled={disabled}
          {...(isControlled ? { value: normalizedValue } : {})}
          {...props}
        />
      );
    }

    // Standard mode: render with wrapper, label, and error text
    return (
      <div className={cn('flex flex-col', fullWidth && 'w-full')}>
        {label && (
          <label htmlFor={inputId} className="mb-1.5 text-sm font-medium text-gray-700">
            {label}
            {required && <span className="text-red-500"> *</span>}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          required={required}
          className={cn(
            'px-3 py-2 border rounded-lg text-sm text-gray-800 transition-colors placeholder:text-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 hover:border-gray-400',
            disabled && 'bg-gray-100 cursor-not-allowed opacity-50',
            fullWidth && 'w-full',
            className
          )}
          disabled={disabled}
          aria-describedby={
            error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
          }
          {...(isControlled ? { value: normalizedValue } : {})}
          {...props}
        />
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

Input.displayName = 'Input';