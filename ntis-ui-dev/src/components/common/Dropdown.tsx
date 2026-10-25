"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useTranslations } from "next-intl";

import { Tooltip } from "./Tooltip";

/* ---------------- TYPES ---------------- */
interface Option {
  label: string;
  value: string;
  tooltip?: string;
}

interface MultiSelectDropdownStyles {
  container?: string;
  trigger?: string;
  dropdown?: string;
  option?: string;
  checkbox?: string;
  searchInput?: string;
  actionBar?: string;
}

interface MultiSelectDropdownProps {
  label?: string;
  options: Option[];
  value: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
  styles?: MultiSelectDropdownStyles;
  style?: React.CSSProperties;
  triggerStyle?: React.CSSProperties;
  /** HTML id for the trigger button */
  id?: string;
  /** aria-labelledby for accessibility */
  'aria-labelledby'?: string;
}

/* ---------------- COMPONENT ---------------- */
export function MultiSelectDropdown({
  label,
  options,
  value,
  onChange,
  placeholder,
  className,
  styles,
  style,
  triggerStyle,
  id,
  'aria-labelledby': ariaLabelledby,
}: MultiSelectDropdownProps) {
  const tCommon = useTranslations("common");

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [openUp, setOpenUp] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  /* ---------------- CLOSE ON OUTSIDE CLICK ---------------- */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ---------------- FILTER OPTIONS ---------------- */
  const filteredOptions = useMemo(() => {
    return options.filter((o) =>
      o.label.toLowerCase().includes(search.toLowerCase())
    );
  }, [options, search]);

  useEffect(() => {
    if (!open || !ref.current || !dropdownRef.current) return;

    const updateDirection = () => {
      if (!ref.current || !dropdownRef.current) {
        return;
      }

      const triggerRect = ref.current.getBoundingClientRect();
      const dropdownHeight = dropdownRef.current.offsetHeight || 0;
      const spaceBelow = window.innerHeight - triggerRect.bottom;
      const spaceAbove = triggerRect.top;

      if (dropdownHeight > spaceBelow && spaceAbove > spaceBelow) {
        setOpenUp(true);
      } else {
        setOpenUp(false);
      }
    };

    updateDirection();
    window.addEventListener("resize", updateDirection);
    window.addEventListener("scroll", updateDirection, true);

    return () => {
      window.removeEventListener("resize", updateDirection);
      window.removeEventListener("scroll", updateDirection, true);
    };
  }, [open, filteredOptions]);

  /* ---------------- TOGGLE SINGLE ---------------- */
  const toggleValue = (val: string) => {
    if (value.includes(val)) {
      onChange(value.filter((v) => v !== val));
    } else {
      onChange([...value, val]);
    }
  };

  /* ---------------- SELECT ALL (FILTERED) ---------------- */
  const handleSelectAll = () => {
    const filteredValues = filteredOptions.map((o) => o.value);
    const merged = Array.from(new Set([...value, ...filteredValues]));
    onChange(merged);
  };

  /* ---------------- CLEAR ALL (FILTERED) ---------------- */
  const handleClearAll = () => {
    const filteredValues = filteredOptions.map((o) => o.value);
    onChange(value.filter((v) => !filteredValues.includes(v)));
    setSearch("");
  };

  const allFilteredSelected =
    filteredOptions.length > 0 &&
    filteredOptions.every((o) => value.includes(o.value));

  /* ---------------- RENDER ---------------- */
  return (
    <div
      ref={ref}
      className={cn("relative", styles?.container, className)}
      style={style}
    >
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      {/* -------- TRIGGER -------- */}
      <button
        type="button"
        id={id}
        aria-labelledby={ariaLabelledby}
        onClick={() => setOpen((p) => !p)}
        className={cn(
          `w-full flex items-center justify-between text-gray-700
           px-3 py-2 border border-gray-300 rounded-lg
           bg-white text-sm
           focus:outline-none focus:ring-2 focus:ring-blue-500`,
          styles?.trigger
        )}
        style={triggerStyle}
      >
        <span className="truncate text-left">
          {value.length > 0
            ? value
                .map((v) => {
                  const opt = options.find((o) => o.value === v);
                  return opt ? opt.label : v;
                })
                .join(", ")
            : placeholder || tCommon("multiSelect.placeholder")}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-500" />
      </button>

      {/* -------- DROPDOWN -------- */}
      {open && (
        <div
          ref={dropdownRef}
          className={cn(
            `absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg ${openUp ? "bottom-full mb-1" : "mt-1"}`,
            styles?.dropdown
          )}
        >
          {/* -------- ACTION BAR -------- */}
          <div
            className={cn(
              "flex items-center justify-between px-3 py-2 border-b bg-gray-50 text-sm",
              styles?.actionBar
            )}
          >
            <button
              onClick={handleSelectAll}
              disabled={allFilteredSelected}
              className="
                text-blue-600 hover:underline
                disabled:text-gray-400 disabled:cursor-not-allowed
              "
            >
              {tCommon("multiSelect.selectAll")}
            </button>

            <button
              onClick={handleClearAll}
              disabled={value.length === 0}
              className="
                text-red-600 hover:underline
                disabled:text-gray-400 disabled:cursor-not-allowed
              "
            >
              {tCommon("multiSelect.clearAll")}
            </button>
          </div>

          {/* -------- SEARCH -------- */}
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={tCommon("multiSelect.search")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={cn(
                  `w-full pl-8 pr-2 py-1.5 text-sm text-gray-700
                   border border-gray-300 rounded-md
                   focus:outline-none focus:ring-2 focus:ring-blue-500`,
                  styles?.searchInput
                )}
              />
            </div>
          </div>

          {/* -------- OPTIONS -------- */}
          <div className="max-h-56 overflow-auto p-2">
            {filteredOptions.length === 0 && (
              <p className="text-sm text-gray-500 px-2 py-1">
                {tCommon("multiSelect.noOptions")}
              </p>
            )}

            {filteredOptions.map((opt) => {
              const labelContent = (
                <label
                  key={opt.value}
                  className={cn(
                    `flex items-center gap-2 px-2 py-1.5
                     rounded cursor-pointer hover:bg-blue-50`,
                    styles?.option
                  )}
                >
                  <input
                    type="checkbox"
                    checked={value.includes(opt.value)}
                    onChange={() => toggleValue(opt.value)}
                    className={cn(
                      "w-4 h-4 accent-blue-600",
                      styles?.checkbox
                    )}
                  />
                  <span className="text-sm text-gray-700">
                    {opt.label}
                  </span>
                </label>
              );

              if (opt.tooltip) {
                return (
                  <Tooltip key={opt.value} content={opt.tooltip} placement="right">
                    {labelContent}
                  </Tooltip>
                );
              }
              return labelContent;
            })}
          </div>
        </div>
      )}
    </div>
  );
}