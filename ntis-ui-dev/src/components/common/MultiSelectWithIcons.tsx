"use client";

import { useTranslations } from "next-intl";
import { useState, useEffect, useRef, useCallback, useId, useMemo, ReactNode } from "react";

/**
 * Option type for the MultiSelectWithIcons component.
 *
 * @property value - The unique value for the option.
 * @property label - The display label for the option.
 * @property icon - Optional React node representing the icon.
 * @property searchText - Optional text used for searching.
 */
export interface IconOption {
  value: string;
  label: string;
  icon?: ReactNode;
  searchText?: string;
}

/**
 * Props for the {@link MultiSelectWithIcons} component.
 *
 * @property options - Array of selectable options with icons.
 * @property value - Array of selected option values.
 * @property onChange - Callback when selection changes.
 * @property placeholder - Placeholder text when no selection.
 * @property disabled - If true, disables the component.
 * @property className - Additional CSS classes for the wrapper.
 * @property id - Unique identifier for the component.
 * @property name - Name attribute for form integration.
 * @property error - If true, applies error styling.
 */
interface MultiSelectWithIconsProps {
  options: IconOption[];
  value: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
  error?: boolean;
  onOpen?: () => void;
}

/**
 * MultiSelectWithIcons component for selecting multiple options with icons from a dropdown list.
 *
 * Features:
 * - Keyboard accessible and screen reader friendly.
 * - Supports "Select All", custom placeholder, and disabled state.
 * - Calls `onChange` with the updated array of selected values.
 * - Displays an optional icon between the checkbox and option label in the dropdown.
 *
 * @param options - Array of selectable options.
 * @param value - Array of selected option values.
 * @param onChange - Callback when selection changes.
 * @param placeholder - Placeholder text when no selection.
 * @param disabled - If true, disables the component.
 * @param className - Additional CSS classes for the wrapper.
 */
export function MultiSelectWithIcons({
  options,
  value,
  onChange,
  placeholder,
  disabled = false,
  className = "",
  id,
  name,
  error = false,
  onOpen,
}: MultiSelectWithIconsProps) {
  const tCommon = useTranslations('common');
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  // Generate a unique and stable ID for the dropdown for aria-controls
  const reactId = useId();
  const dropdownId = id || `multiselect-with-icons-dropdown-${reactId}`;
  // Use a stable callback ref pattern for each option and 'Select All'
  const optionsRefs = useRef<{ items: Array<HTMLDivElement | null>; selectAll?: HTMLDivElement | null }>({ items: [] });

  const [placement, setPlacement] = useState<'top' | 'bottom'>('bottom');

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    setSearchTerm("");
    setPlacement('bottom');
    setFocusedIndex(null);
  }, []);

  const openDropdown = useCallback(() => {
    setIsOpen(true);
    if (onOpen) onOpen();
    if (wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow < 340 && rect.top > 340) {
        setPlacement('top');
      } else {
        setPlacement('bottom');
      }
    }
  }, [onOpen]);

  // Close dropdown on outside click
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
      closeDropdown();
    }
  }, [closeDropdown]);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => searchInputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (opt.searchText && opt.searchText.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [options, searchTerm]);

  const handleToggle = (optionValue: string) => {
    if (disabled) return;

    const newValue = value.includes(optionValue)
      ? value.filter(v => v !== optionValue)
      : [...value, optionValue];

    onChange(newValue);
  };

  const isAllSelected = useMemo(() => {
    if (filteredOptions.length === 0) return false;
    return filteredOptions.every(opt => value.includes(opt.value));
  }, [filteredOptions, value]);

  const handleSelectAll = () => {
    if (disabled) return;
    const filteredVals = filteredOptions.map(opt => opt.value);
    if (isAllSelected) {
      onChange(value.filter(v => !filteredVals.includes(v)));
    } else {
      onChange(Array.from(new Set([...value, ...filteredVals])));
    }
  };

  const getDisplayText = useMemo(() => {
    if (value.length === 0) return placeholder || tCommon("multiSelect.placeholder");
    if (value.length === options.length) return tCommon("multiSelect.allSelected");
    if (value.length === 1) {
      const selected = options.find(opt => opt.value === value[0]);
      return selected?.label || placeholder || tCommon("multiSelect.placeholder");
    }
    return tCommon("multiSelect.selectedCount", { count: value.length });
  }, [value, options, placeholder, tCommon]);

  const renderOption = (option: IconOption, idx: number) => (
    <div
      key={option.value}
      role="option"
      aria-selected={value.includes(option.value)}
      tabIndex={0}
      ref={el => { optionsRefs.current.items[idx] = el; }}
      onFocus={() => setFocusedIndex(idx)}
      onKeyDown={e => handleLabelKeyDown(e, idx)}
      onClick={() => handleToggle(option.value)}
      className={`flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer transition-colors ${focusedIndex === idx ? 'bg-blue-50' : ''}`}
      aria-label={option.label}
    >
      <input
        type="checkbox"
        checked={value.includes(option.value)}
        onChange={() => handleToggle(option.value)}
        onClick={e => e.stopPropagation()}
        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        tabIndex={-1}
        aria-hidden="true"
      />
      {option.icon && (
        <span className="flex items-center justify-center shrink-0">
          {option.icon}
        </span>
      )}
      <span className="text-sm text-gray-700">{option.label}</span>
    </div>
  );

  // Keyboard navigation for dropdown
  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement | HTMLDivElement>) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        openDropdown();
        setFocusedIndex(0);
        e.preventDefault();
      }
      return;
    }
    if (e.key === "Escape") {
      closeDropdown();
      e.preventDefault();
    } else if (e.key === "ArrowDown") {
      setFocusedIndex((prev) => {
        const next = prev === null ? 0 : Math.min(filteredOptions.length - 1, prev + 1);
        optionsRefs.current.items[next]?.focus();
        return next;
      });
      e.preventDefault();
    } else if (e.key === "ArrowUp") {
      setFocusedIndex((prev) => {
        const next = prev === null ? filteredOptions.length - 1 : Math.max(0, prev - 1);
        optionsRefs.current.items[next]?.focus();
        return next;
      });
      e.preventDefault();
    } else if (e.key === "Enter" || e.key === " ") {
      if (focusedIndex !== null && filteredOptions[focusedIndex]) {
        handleToggle(filteredOptions[focusedIndex].value);
      }
      e.preventDefault();
    }
  };

  // Keyboard navigation for label elements
  const handleLabelKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, idx: number) => {
    if (e.key === "Enter" || e.key === " ") {
      if (filteredOptions[idx]) {
        handleToggle(filteredOptions[idx].value);
      }
      e.preventDefault();
    } else if (e.key === "ArrowDown") {
      const next = Math.min(filteredOptions.length - 1, idx + 1);
      optionsRefs.current.items[next]?.focus();
      setFocusedIndex(next);
      e.preventDefault();
    } else if (e.key === "ArrowUp") {
      const prev = idx <= 0 ? 0 : idx - 1;
      optionsRefs.current.items[prev]?.focus();
      setFocusedIndex(prev);
      e.preventDefault();
    } else if (e.key === "Escape") {
      closeDropdown();
      e.preventDefault();
    }
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        id={id}
        name={name}
        onClick={() => {
          if (!disabled) {
            if (isOpen) {
              closeDropdown();
            } else {
              openDropdown();
            }
          }
        }}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={dropdownId}
        aria-label={placeholder || tCommon("multiSelect.placeholder")}
        className={`
          w-full px-3 py-2 text-left
          border rounded-lg
          bg-white
          focus:outline-none focus:ring-2 focus:ring-blue-500
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-gray-400'}
          ${isOpen ? 'border-blue-500' : error ? 'border-red-500' : 'border-gray-300'}
        `}
      >
        <div className="flex items-center justify-between">
          <span className={value.length === 0 ? 'text-gray-400' : 'text-gray-900'}>
            {getDisplayText}
          </span>
          <svg
            className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div
          id={dropdownId}
          className={`absolute z-50 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-hidden flex flex-col ${placement === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'}`}
        >
          {/* Search Bar */}
          <div className="p-2 border-b border-gray-200 bg-white">
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={tCommon("multiSelect.search") || "Search..."}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Select All Option */}
          <div className="border-b border-gray-200 bg-gray-50 shrink-0">
            <div
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 cursor-pointer"
              tabIndex={0}
              ref={el => { optionsRefs.current.selectAll = el; }}
              onFocus={() => setFocusedIndex(-1)}
              onClick={handleSelectAll}
              onKeyDown={e => {
                if (e.key === "Enter" || e.key === " ") {
                  handleSelectAll();
                  e.preventDefault();
                } else if (e.key === "ArrowDown") {
                  if (filteredOptions.length > 0) {
                    optionsRefs.current.items[0]?.focus();
                    setFocusedIndex(0);
                  }
                  e.preventDefault();
                } else if (e.key === "ArrowUp") {
                  if (filteredOptions.length > 0) {
                    optionsRefs.current.items[filteredOptions.length - 1]?.focus();
                    setFocusedIndex(filteredOptions.length - 1);
                  }
                  e.preventDefault();
                } else if (e.key === "Escape") {
                  closeDropdown();
                  e.preventDefault();
                }
              }}
              aria-selected={isAllSelected}
              aria-label={tCommon("multiSelect.selectAll")}
            >
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={handleSelectAll}
                onClick={e => e.stopPropagation()}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                tabIndex={-1}
                aria-hidden="true"
              />
              <span className="text-sm font-medium text-gray-700">{tCommon("multiSelect.selectAll")}</span>
            </div>
          </div>

          {/* Options List */}
          <div
            className="overflow-y-auto max-h-52 flex-grow"
            role="listbox"
            aria-multiselectable="true"
            tabIndex={-1}
            onKeyDown={handleKeyDown}
          >
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                {tCommon("multiSelect.noOptions") || "No options found"}
              </div>
            ) : (
              filteredOptions.map(renderOption)
            )}
          </div>

          {/* Selected Count */}
          {value.length > 0 && (
            <div className="border-t border-gray-200 bg-gray-50 px-4 py-2 shrink-0">
              <span className="text-xs text-gray-600">
                {tCommon("multiSelect.selectedCount", { count: value.length })}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

MultiSelectWithIcons.displayName = "MultiSelectWithIcons";
