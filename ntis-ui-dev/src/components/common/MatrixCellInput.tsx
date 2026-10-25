 
"use client";
 
import { cn } from "@/lib/utils/cn";
import React from "react";
 
export interface MatrixCellInputProps {
  value?: number;
  rowId: string;
  columnId: string;
  metaLabel?: string;
  colorClass?: string;
  className?: string;
  readOnly?: boolean;
  /** Allow decimal input (default: true for backward compatibility) */
  allowDecimals?: boolean;
  /** Maximum value allowed (default: 9999) */
  maxValue?: number;
  /** Number of decimal places (default: 2) */
  decimalPlaces?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onCellChange?: (rowId: string, columnId: string, value: any) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  /** Optional callback when user tries to type a value exceeding max digits */
  onMaxExceeded?: () => void;
  allowZero?: boolean;
}
 
export const MatrixCellInput = ({
  value,
  rowId,
  columnId,
  metaLabel,
  colorClass,
  className,
  readOnly = false,
  allowDecimals = true,
  maxValue = 9999,
  decimalPlaces = 2,
  onCellChange,
  onKeyDown,
  onMaxExceeded,
  allowZero = false,
}: MatrixCellInputProps): React.ReactElement => {
  // Helper to format value for display
  const formatValue = React.useCallback((val: number | undefined): string => {
    if (val === undefined) {
      return "";
    }
    if (val === 0) {
      if (allowZero) {
        return allowDecimals ? (0).toFixed(decimalPlaces) : "0";
      }
      return readOnly ? "0" : "";
    }
    if (allowDecimals) {
      // Format with decimal places, removing trailing zeros
      const formatted = val.toFixed(decimalPlaces);
      return formatted;
    }
    return String(Math.floor(val));
  }, [readOnly, allowDecimals, decimalPlaces, allowZero]);

  // Safely convert value to number to handle undefined, null, or string values
  const safeValue = typeof value === 'number' && !Number.isNaN(value) ? value : (allowZero ? undefined : 0);
  
  const [localValue, setLocalValue] = React.useState<string>(
    formatValue(safeValue)
  );
  const [isFocused, setIsFocused] = React.useState(false);
  const previousValueRef = React.useRef<number | undefined>(safeValue);
  // Update local value when prop value changes from external source (not from our own edits)
  React.useEffect(() => {
    const currentSafeValue = typeof value === 'number' && !Number.isNaN(value) ? value : (allowZero ? undefined : 0);
    // Only sync if value actually changed AND we're not focused
    if (!isFocused && currentSafeValue !== previousValueRef.current) {
      setLocalValue(formatValue(currentSafeValue));
    }
    previousValueRef.current = currentSafeValue;
  }, [value, isFocused, formatValue, allowZero]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    if (!allowDecimals) {
      // Block decimal points - only allow integers
      if (inputValue.includes(".")) {
        e.target.value = localValue;
        return;
      }
      // Calculate max digits based on maxValue
      const maxDigits = String(maxValue).length;
      if (inputValue.length > maxDigits) {
        onMaxExceeded?.();
        e.target.value = localValue;
        return;
      }
    } else {
      // Allow decimals - validate format
      // Check for more than allowed decimal places
      if (inputValue.includes(".")) {
        const parts = inputValue.split(".");
        if (parts[1] && parts[1].length > decimalPlaces) {
          e.target.value = localValue;
          return;
        }
      }
      // Check integer part doesn't exceed maxValue digits
      const intPart = inputValue.split(".")[0];
      const maxDigits = String(Math.floor(maxValue)).length;
      if (intPart.length > maxDigits) {
        onMaxExceeded?.();
        e.target.value = localValue;
        return;
      }
    }

    // Reject values that numerically exceed maxValue even when the digit
    // count matches (e.g. maxValue=100, typed value 101-999 has the same
    // digit length as "100" and would otherwise pass the checks above).
    const parsedForMaxCheck = inputValue === "" ? undefined : Number(inputValue);
    if (
      parsedForMaxCheck !== undefined &&
      !Number.isNaN(parsedForMaxCheck) &&
      parsedForMaxCheck > maxValue
    ) {
      onMaxExceeded?.();
      e.target.value = localValue;
      return;
    }

    setLocalValue(inputValue);
    
    // Convert to number for onCellChange call
    const numValue = inputValue === "" ? undefined : Number(inputValue);
    
    // Ensure we send a valid number to onCellChange
    const safeNumValue = numValue === undefined || Number.isNaN(numValue) || numValue < 0 
      ? undefined 
      : Math.min(numValue, maxValue);
    
    onCellChange?.(rowId, columnId, allowZero ? safeNumValue : (safeNumValue ?? 0));
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    const numValue = localValue === "" ? undefined : Number(localValue);
    if (numValue === undefined || Number.isNaN(numValue)) {
      setLocalValue("");
      onCellChange?.(rowId, columnId, allowZero ? undefined : 0);
    } else if (numValue === 0 && !allowZero) {
      setLocalValue("");
      onCellChange?.(rowId, columnId, 0);
    } else {
      if (numValue > maxValue) {
        onMaxExceeded?.();
      }
      const clamped = Math.min(allowDecimals ? (numValue ?? 0) : Math.floor(numValue ?? 0), maxValue);
      setLocalValue(allowDecimals ? clamped.toFixed(decimalPlaces) : String(clamped));
      if (clamped !== value) onCellChange?.(rowId, columnId, clamped);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Block characters that create invalid numeric states: -, e, E, +
    const blockedKeys = ["-", "e", "E", "+"];
    // Also block decimal point if decimals not allowed
    if (!allowDecimals) {
      blockedKeys.push(".");
    }
    if (blockedKeys.includes(e.key)) {
      e.preventDefault();
    }
    // Call the parent's onKeyDown if provided
    onKeyDown?.(e);
  };

  // Determine cell styling based on current input value
  const currentNumValue = localValue === "" ? undefined : Number(localValue);
  const isFilled = currentNumValue !== undefined && (currentNumValue > 0 || (currentNumValue === 0 && allowZero));
  const valueBasedClass = isFilled
    ? "bg-blue-50 text-blue-800 border-blue-300"
    : "bg-gray-50 text-gray-500 border-gray-200";

  const stepValue = allowDecimals ? Math.pow(10, -decimalPlaces) : 1;
  const placeholderValue = "0";
 
  return (
    <input
      type="number"
      min="0"
      max={maxValue}
      step={stepValue}
      id={`cell-${rowId}-${columnId}`}
      name={`cell-${rowId}-${columnId}`}
      value={localValue}
      aria-label={metaLabel}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={placeholderValue}
      readOnly={readOnly}
      disabled={readOnly}
      className={cn(
        "px-1 md:px-2 py-1 md:py-1 rounded-md md:rounded-lg font-bold text-xs md:text-sm text-center border w-full outline-none placeholder:text-gray-400",
        readOnly ? "cursor-default" : "focus:ring-2 focus:ring-blue-400",
        valueBasedClass,
        colorClass,
        className
      )}
    />
  );
};
 
 