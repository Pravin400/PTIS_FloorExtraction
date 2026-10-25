"use client";

import { Input, Select, ValidationMessage, Badge } from "@/components/common";
import { cn } from "@/lib/utils/cn";
import { RefreshCw } from "lucide-react";
import { memo, useState } from "react";

/* -------------------------------------------------------------------------- */
/*                           EDITABLE INPUT COMPONENT                          */
/* -------------------------------------------------------------------------- */

interface EditableInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  type?: string;
  required?: boolean;
  maxLength?: number;
  error?: string;
  onBlur?: () => void;
  placeholder?: string;
}

/**
 * Editable input using the common Input component
 */
export const EditableInput = memo(({
  label,
  value,
  onChange,
  className = "",
  type = "text",
  required = false,
  maxLength,
  error,
  onBlur,
  placeholder,
}: EditableInputProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;
    if (maxLength && newValue.length > maxLength) {
      newValue = newValue.slice(0, maxLength);
    }
    onChange(newValue);
  };

  return (
    <div className={cn("flex flex-col", className)}>
      <Input
        naked={false}
        label={label}
        required={required}
        type={type}
        value={value}
        onChange={handleChange}
        onBlur={onBlur}
        placeholder={placeholder}
        maxLength={maxLength}
        className={cn(
          "h-7 px-2 text-xs",
          error && "border-red-500"
        )}
      />
      <ValidationMessage message={error} visible={!!error} type="error" />
    </div>
  );
}, (prev, next) =>
  prev.label === next.label &&
  prev.value === next.value &&
  prev.error === next.error &&
  prev.required === next.required &&
  prev.type === next.type &&
  prev.maxLength === next.maxLength &&
  prev.placeholder === next.placeholder &&
  prev.className === next.className
);
EditableInput.displayName = "EditableInput";

/* -------------------------------------------------------------------------- */
/*                  EDITABLE INPUT WITH REFRESH COMPONENT                     */
/* -------------------------------------------------------------------------- */

interface EditableInputWithRefreshProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onClick?: () => Promise<void>;
  onRefresh?: () => Promise<void>;
  className?: string;
  type?: string;
  required?: boolean;
  maxLength?: number;
  error?: string;
  onBlur?: () => void;
  placeholder?: string;
}

/**
 * Editable input with refresh icon that calls an async function
 */
export const EditableInputWithRefresh = memo(({
  label,
  value,
  onChange,
  onClick,
  onRefresh,
  className = "",
  type = "text",
  required = false,
  maxLength,
  error,
  onBlur,
  placeholder,
}: EditableInputWithRefreshProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const clickHandler = onClick ?? onRefresh;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;
    if (maxLength && newValue.length > maxLength) {
      newValue = newValue.slice(0, maxLength);
    }
    onChange(newValue);
  };

  const handleRefresh = async () => {
    if (!value || isRefreshing || !clickHandler) return;
    
    setIsRefreshing(true);
    try {
      await clickHandler();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="relative">
        <Input
          naked={false}
          label={label}
          required={required}
          type={type}
          value={value}
          onChange={handleChange}
          onBlur={onBlur}
          placeholder={placeholder}
          maxLength={maxLength}
          className={cn(
            "pr-9",
            error && "border-red-500"
          )}
        />
        <button
          type="button"
          onClick={handleRefresh}
          disabled={!value || isRefreshing || !clickHandler}
          data-enter-navigable="true"
          className={cn(
            "absolute right-1 bottom-1 h-[30px] w-8 flex items-center justify-center rounded text-gray-600",
            "hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white focus:outline-none transition-colors",
            (!value || isRefreshing || !clickHandler) && "opacity-40 cursor-not-allowed"
          )}
          title="Refresh old property data"
        >
          <RefreshCw
            size={14}
            className={cn(
              isRefreshing && "animate-spin"
            )}
          />
        </button>
      </div>
      <ValidationMessage message={error} visible={!!error} type="error" />
    </div>
  );
}, (prev, next) =>
  prev.label === next.label &&
  prev.value === next.value &&
  prev.error === next.error &&
  prev.required === next.required &&
  prev.type === next.type &&
  prev.maxLength === next.maxLength &&
  prev.placeholder === next.placeholder &&
  prev.className === next.className
);
EditableInputWithRefresh.displayName = "EditableInputWithRefresh";

/* -------------------------------------------------------------------------- */
/*                           EDITABLE SELECT COMPONENT                         */
/* -------------------------------------------------------------------------- */

interface EditableSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
  required?: boolean;
  isLoading?: boolean;
  error?: string;
}

/**
 * Editable select using the common Select component
 */
export const EditableSelect = memo(({
  label,
  value,
  onChange,
  options,
  placeholder = "Select",
  className = "",
  required = false,
  isLoading = false,
  error,
}: EditableSelectProps) => (
  <div className={cn("flex flex-col", className)}>
    <Select
      label={label}
      required={required}
      value={value}
      onChange={(_e, val) => onChange(val)}
      options={options}
      placeholder={isLoading ? "Loading..." : placeholder}
      disabled={isLoading}
      selectSize="sm"
      className={cn("text-xs", error && "[&>div]:border-red-500")}
    />
    <ValidationMessage message={error} visible={!!error} type="error" />
  </div>
), (prev, next) =>
  prev.label === next.label &&
  prev.value === next.value &&
  prev.required === next.required &&
  prev.placeholder === next.placeholder &&
  prev.isLoading === next.isLoading &&
  prev.className === next.className &&
  prev.options === next.options &&
  prev.error === next.error
);
EditableSelect.displayName = "EditableSelect";

/* -------------------------------------------------------------------------- */
/*                           READ-ONLY INPUT COMPONENT                         */
/* -------------------------------------------------------------------------- */

interface ReadOnlyInputProps {
  label: string;
  value: string;
  className?: string;
  type?: string;
}

/**
 * Read-only input display
 */
export const ReadOnlyInput = memo(({
  label,
  value,
  className = "",
  type = "text",
}: ReadOnlyInputProps) => (
  <div className={cn("flex flex-col", className)}>
    <label className="text-[10px] font-medium text-gray-600 mb-0.5">
      {label}
    </label>
    <input
      type={type}
      value={value}
      readOnly
      aria-label={label}
      title={label}
      className="h-7 px-2 text-xs border border-gray-200 rounded bg-gray-100 text-gray-600 cursor-not-allowed outline-none"
    />
  </div>
));
ReadOnlyInput.displayName = "ReadOnlyInput";

/* -------------------------------------------------------------------------- */
/*                           PROPERTY INFO BADGES                              */
/* -------------------------------------------------------------------------- */

interface PropertyInfoBadgesProps {
  wardId?: string | number;
  zoneNo?: string | number;
  propertyNo?: string | number;
  type?: string;
  copy: {
    ward: string;
    zone: string;
    prop: string;
    type: string;
  };
}

/**
 * Property information badges using the common Badge component
 */
export const PropertyInfoBadges = ({
  wardId,
  zoneNo,
  propertyNo,
  type,
  copy,
}: PropertyInfoBadgesProps) => (
  <div className="flex items-center gap-2">
    <Badge variant="default" size="sm">
      {`${copy.ward}: ${wardId || "-"}`}
    </Badge>
    <Badge variant="secondary" size="sm">
      {`${copy.zone}: ${zoneNo || "-"}`}
    </Badge>
    <Badge variant="success" size="sm">
      {`${copy.prop}: ${propertyNo || "-"}`}
    </Badge>
    <Badge variant="default" size="sm" className="bg-purple-100 text-purple-700">
      {`${copy.type}: ${type || "-"}`}
    </Badge>
  </div>
);
PropertyInfoBadges.displayName = "PropertyInfoBadges";

/* -------------------------------------------------------------------------- */
/*                           COMPACT SELECT FOR TABLE CELLS                    */
/* -------------------------------------------------------------------------- */

interface CompactSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
  onDropdownClick?: () => void;
  isLoading?: boolean;
}

/**
 * Compact select for table cells with on-click loading support
 */
export const CompactSelect = ({
  value,
  onChange,
  options,
  placeholder = "Select",
  disabled = false,
  onDropdownClick,
  isLoading = false,
}: CompactSelectProps) => {
  const handleFocus = () => {
    if (onDropdownClick && !isLoading) {
      onDropdownClick();
    }
  };

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={handleFocus}
      onClick={(e) => e.stopPropagation()}
      disabled={disabled || isLoading}
      className="h-6 px-1 text-[10px] border border-gray-300 rounded bg-white hover:border-blue-400 focus:border-blue-500 focus:outline-none transition w-full min-w-[80px] cursor-pointer disabled:bg-gray-50 disabled:cursor-not-allowed"
    >
      <option value="">{isLoading ? "Loading..." : placeholder}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
};
CompactSelect.displayName = "CompactSelect";

/* -------------------------------------------------------------------------- */
/*                           COMPACT CELL INPUT                                */
/* -------------------------------------------------------------------------- */

interface CompactCellInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  maxLength?: number;
  error?: string;
  numericOnly?: boolean;
}

/**
 * Compact cell input for table cells
 */
export const CompactCellInput = ({
  value,
  onChange,
  placeholder = "Enter",
  maxLength,
  error,
  numericOnly = false,
}: CompactCellInputProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;
    if (numericOnly) {
      newValue = newValue.replace(/\D/g, "");
    }
    if (maxLength && newValue.length > maxLength) {
      newValue = newValue.slice(0, maxLength);
    }
    onChange(newValue);
  };

  return (
    <div className="flex flex-col">
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        maxLength={maxLength}
        className={cn(
          "h-6 px-1 text-[10px] border rounded bg-white hover:border-blue-400 focus:border-blue-500 focus:outline-none transition w-full min-w-[60px]",
          error ? "border-red-500" : "border-gray-300"
        )}
      />
      {error && <span className="text-[8px] text-red-500">{error}</span>}
    </div>
  );
};
CompactCellInput.displayName = "CompactCellInput";
