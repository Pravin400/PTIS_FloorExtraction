'use client';

import React from "react";
import { createPortal } from "react-dom";
import type {
  NACompactSelectProps,
  NACompactInputProps,
  NACompactAnimatedDigitInputProps,
} from "@/types/asset/municipal-Asset/new-add-new-asset";
export type { NACompactSelectProps, NACompactInputProps, NACompactAnimatedDigitInputProps };

/** Compact select matching h-[25px] form control styling */
export function NACompactSelect({
  name,
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  required = false,
  isLoading = false,
}: NACompactSelectProps) {
  const getTextColorClass = () => {
    if (name === "encroachmentStatus") {
      if (value === "Clean") return "!text-emerald-600 !font-bold";
      if (value === "Partially Encroached") return "!text-amber-600 !font-bold";
      if (value === "Fully Encroached") return "!text-red-600 !font-bold";
    }
    return "text-slate-900";
  };

  return (
    <div className="relative w-full min-w-0">
      <select
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled || isLoading}
        required={required}
        className={`w-full min-w-0 truncate appearance-none px-2 py-0.5 pr-7 text-[10px] font-semibold border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer h-[25px] disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed ${getTextColorClass()}`}
      >
        {placeholder && (
          <option value="" className="text-slate-700">{isLoading ? "Loading..." : placeholder}</option>
        )}
        {options.map((opt) => (
          <option
            key={opt.value}
            value={opt.value}
            className={
              name === "encroachmentStatus"
                ? opt.value === "Clean"
                  ? "text-emerald-600 font-bold"
                  : opt.value === "Partially Encroached"
                    ? "text-amber-600 font-bold"
                    : opt.value === "Fully Encroached"
                      ? "text-red-600 font-bold"
                      : "text-slate-900 font-semibold"
                : "text-slate-900 font-semibold"
            }
          >
            {opt.label}
          </option>
        ))}
      </select>
      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
    </div>
  );
}

/** Compact text/number input matching h-[25px] form control styling */
export function NACompactInput({
  name,
  value,
  onChange,
  type = "text",
  placeholder = "",
  readOnly = false,
  maxLength,
  disabled = false,
  onBlur,
  onFocus,
  onMouseEnter,
  onMouseLeave,
  onKeyDown,
}: NACompactInputProps) {
  const [isFocused, setIsFocused] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);
  const [isOverflowing, setIsOverflowing] = React.useState(false);
  const [coords, setCoords] = React.useState({ top: 0, left: 0, width: 0 });
  const internalRef = React.useRef<HTMLInputElement>(null);

  const checkOverflow = (el: HTMLInputElement | null) => {
    if (el) {
      setIsOverflowing(el.scrollWidth > el.clientWidth);
    }
  };

  const updateCoords = () => {
    if (internalRef.current) {
      const rect = internalRef.current.getBoundingClientRect();
      setCoords({
        top: rect.top,
        left: rect.left,
        width: rect.width,
      });
    }
  };

  React.useEffect(() => {
    if ((isFocused || isHovered) && internalRef.current) {
      checkOverflow(internalRef.current);
      updateCoords();
    }
  }, [value, isFocused, isHovered]);

  React.useEffect(() => {
    const handleResizeOrScroll = () => {
      if (isFocused || isHovered) updateCoords();
    };
    window.addEventListener("resize", handleResizeOrScroll);
    window.addEventListener("scroll", handleResizeOrScroll, true);
    return () => {
      window.removeEventListener("resize", handleResizeOrScroll);
      window.removeEventListener("scroll", handleResizeOrScroll, true);
    };
  }, [isFocused, isHovered]);

  const showTooltip = (isFocused || isHovered) && isOverflowing && value;

  return (
    <>
      <input
        ref={internalRef}
        type={type}
        name={name}
        value={value}
        onChange={(e) => {
          checkOverflow(e.currentTarget);
          updateCoords();
          onChange?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          onBlur?.(e);
        }}
        onFocus={(e) => {
          setIsFocused(true);
          checkOverflow(e.currentTarget);
          updateCoords();
          onFocus?.(e);
        }}
        onMouseEnter={(e) => {
          setIsHovered(true);
          checkOverflow(e.currentTarget);
          updateCoords();
          onMouseEnter?.(e);
        }}
        onMouseLeave={(e) => {
          setIsHovered(false);
          onMouseLeave?.(e);
        }}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        readOnly={readOnly}
        maxLength={maxLength}
        disabled={disabled}
        className="w-full min-w-0 px-2 py-0.5 text-[10px] font-semibold text-slate-900 border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 h-[25px] read-only:bg-slate-50 read-only:text-slate-500 read-only:cursor-default disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
      />
      {showTooltip && typeof window !== "undefined" && createPortal(
        <div
          className="fixed z-[99999] w-max max-w-[400px] whitespace-normal break-words rounded bg-slate-900 px-3 py-2 text-xs font-medium leading-tight text-white shadow-xl pointer-events-none border border-slate-700"
          style={{
            top: coords.top - 6,
            left: coords.left,
            transform: 'translateY(-100%)'
          }}
        >
          {value}
        </div>,
        document.body
      )}
    </>
  );
}

/** Compact animated digit input with digit popping animation matching h-[25px] form control styling */
export function NACompactAnimatedDigitInput({
  name,
  value,
  onChange,
  placeholder = "",
  readOnly = false,
  maxLength,
  disabled = false,
  allowedPattern = /^[0-9.]$/,
  className = "",
  onBlur,
  required = false,
  uppercase = false,
}: NACompactAnimatedDigitInputProps) {
  const safeValue = value != null ? String(value) : "";
  const [lastTypedIndex, setLastTypedIndex] = React.useState<number>(-1);

  React.useEffect(() => {
    if (lastTypedIndex !== -1) {
      const timer = setTimeout(() => {
        setLastTypedIndex(-1);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [lastTypedIndex]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const prevVal = safeValue;

    let filtered = "";
    for (const char of rawVal) {
      if (allowedPattern.test(char)) {
        filtered += char;
      }
    }
    if (uppercase) {
      filtered = filtered.toUpperCase();
    }
    if (maxLength) {
      filtered = filtered.slice(0, maxLength);
    }

    if (filtered.length > prevVal.length) {
      setLastTypedIndex(filtered.length - 1);
    } else {
      setLastTypedIndex(-1);
    }

    if (onChange) {
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          name,
          value: filtered,
        },
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(syntheticEvent);
    }
  };

  return (
    <div
      className={`relative w-full rounded-md border overflow-hidden flex items-center transition-all duration-200 h-[25px] border-slate-200 bg-white focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500 ${readOnly ? "bg-slate-50 text-slate-500 cursor-default" : ""
        } ${disabled ? "bg-slate-50 text-slate-400 cursor-not-allowed" : ""} ${className}`}
    >
      <input
        type="text"
        name={name}
        value={safeValue}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={handleInputChange}
        onBlur={onBlur}
        disabled={disabled || readOnly}
        readOnly={readOnly}
        required={required}
        onKeyDown={(e) => {
          const controlKeys = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", "Enter"];
          if (!allowedPattern.test(e.key) && !controlKeys.includes(e.key) && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
          }
        }}
        className={`absolute inset-0 w-full h-full bg-transparent cursor-text z-10 focus:outline-none tabular-nums px-2 py-0.5 text-[10px] font-semibold placeholder:text-slate-300 ${lastTypedIndex !== -1 ? "text-transparent" : "text-slate-900"
          } ${readOnly ? "cursor-default text-slate-500" : ""} ${disabled ? "cursor-not-allowed text-slate-400" : ""
          }`}
      />

      {/* Visual representation of characters with popping animation */}
      <div
        className={`absolute inset-0 flex items-center px-2 pointer-events-none select-none overflow-hidden text-slate-900 ${lastTypedIndex !== -1 ? "visible" : "invisible"
          }`}
      >
        <div className="text-[10px] font-semibold tabular-nums whitespace-pre w-full">
          {safeValue.length === 0
            ? null
            : safeValue.split("").map((char, index) => {
              const shouldAnimate = index === lastTypedIndex;
              if (shouldAnimate) {
                return (
                  <span
                    key={`${index}-${char}`}
                    className="inline-block animate-digit-pop"
                  >
                    {char}
                  </span>
                );
              }
              return char;
            })}
        </div>
      </div>
    </div>
  );
}

export function NACompactRow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`flex gap-3 min-w-0 w-full ${className}`}>{children}</div>;
}

export function NACompactField({
  label,
  required,
  children,
  error,
  fullWidth = false,
  className = "",
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  error?: string;
  fullWidth?: boolean;
  className?: string;
}) {
  return (
    <div className={`${fullWidth ? "w-full" : "flex-1"} min-w-0 flex flex-col gap-0.5 ${className}`}>
      <label className="text-[9.5px] font-bold text-slate-600 truncate block" title={label}>
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <span className="text-[9px] text-red-500 mt-0.5">{error}</span>}
    </div>
  );
}
