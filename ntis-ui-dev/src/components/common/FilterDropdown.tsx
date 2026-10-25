"use client";

import { useState, useRef, useEffect, useCallback, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { Funnel, X, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface FilterOption {
  value: string;
  label: string;
}

export type FilterMode = 'single' | 'multi';

interface FilterDropdownProps {
  selectedValues: string[];
  onFilterChange: (values: string[]) => void;
  onFetchOptions: () => Promise<FilterOption[]>;
  isActive?: boolean;
  disabled?: boolean;
  mode?: FilterMode;
  placeholder?: string;
  noOptionsText?: string;
  clearAllText?: string;
  applyText?: string;
}

/**
 * Generic filter dropdown component supporting single and multi-select modes.
 * - Single mode: Immediate API call on selection, no checkboxes, no Apply button
 * - Multi mode: Checkboxes, Clear All and Apply buttons
 */
export function FilterDropdown({
  selectedValues,
  onFilterChange,
  onFetchOptions,
  isActive = false,
  disabled = false,
  mode = 'single',
  placeholder = 'Filter column',
  noOptionsText = 'No options available',
  clearAllText = 'Clear All',
  applyText = 'Apply',
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<FilterOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  // For multi-select mode, track local selection before applying
  const [localSelected, setLocalSelected] = useState<string[]>(selectedValues);
  // Dropdown position state for portal
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: globalThis.MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Fetch options when dropdown opens
  const handleOpen = useCallback(async () => {
    if (disabled) return;

    // Calculate position IMMEDIATELY before setting isOpen
    if (buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: buttonRect.bottom + 4,
        left: buttonRect.left,
      });
    }

    // Sync local selection with props when opening in multi mode
    if (mode === 'multi') {
      setLocalSelected(selectedValues);
    }

    setIsOpen(true);
    setIsLoading(true);

    try {
      const fetchedOptions = await onFetchOptions();
      setOptions(fetchedOptions);
    } catch (error) {
      console.error(`[FilterDropdown] Failed to fetch options:`, error);
      setOptions([]);
    } finally {
      setIsLoading(false);
    }
  }, [disabled, mode, onFetchOptions, selectedValues]);

  // Calculate and update dropdown position
  const updateDropdownPosition = useCallback(() => {
    if (buttonRef.current && isOpen) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: buttonRect.bottom + 4,
        left: buttonRect.left,
      });
    }
  }, [isOpen]);

  // Update position when dropdown opens or on scroll/resize
  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition();
      window.addEventListener('scroll', updateDropdownPosition, true);
      window.addEventListener('resize', updateDropdownPosition);
      
      return () => {
        window.removeEventListener('scroll', updateDropdownPosition, true);
        window.removeEventListener('resize', updateDropdownPosition);
      };
    }
  }, [isOpen, updateDropdownPosition]);

  // Handle single select - immediate API call
  const handleSingleSelect = (value: string) => {
    const newValue = selectedValues.includes(value) ? [] : [value];
    onFilterChange(newValue);
    setIsOpen(false);
  };

  // Handle multi select - toggle local selection
  const toggleMultiSelect = (value: string) => {
    setLocalSelected((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value]
    );
  };

  // Apply multi-select filters
  const handleApply = () => {
    onFilterChange(localSelected);
    setIsOpen(false);
  };

  // Clear all filters
  const handleClearAll = () => {
    if (mode === 'single') {
      onFilterChange([]);
      setIsOpen(false);
    } else {
      setLocalSelected([]);
      onFilterChange([]);
      setIsOpen(false);
    }
  };

  const handleIconClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (isOpen) {
      setIsOpen(false);
    } else {
      handleOpen();
    }
  };

  const isSingleMode = mode === 'single';
  const currentSelection = isSingleMode ? selectedValues : localSelected;

  // Render dropdown via portal to escape table overflow constraints
  const renderDropdown = () => {
    if (!isOpen || !dropdownPosition) return null;
    
    const dropdownContent = (
      <div
        ref={dropdownRef}
        style={{
          position: 'fixed',
          top: `${dropdownPosition.top}px`,
          left: `${dropdownPosition.left}px`,
          zIndex: 9999,
        }}
        className="min-w-[200px] bg-white border border-gray-300 rounded-lg shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 bg-gray-50 rounded-t-lg">
          <button
            type="button"
            onClick={handleClearAll}
            className="text-sm font-semibold text-red-600 hover:text-red-700 transition-colors"
          >
            {clearAllText}
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-1 rounded hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Options */}
        <div className="max-h-60 overflow-y-auto p-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            </div>
          ) : options.length === 0 ? (
            <div className="px-3 py-4 text-sm text-gray-500 text-center">
              {noOptionsText}
            </div>
          ) : (
            options.map((option) => {
              const isSelected = currentSelection.includes(option.value);
              
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => isSingleMode ? handleSingleSelect(option.value) : toggleMultiSelect(option.value)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left rounded-md transition-all",
                    isSelected
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "hover:bg-gray-100 text-gray-700"
                  )}
                >
                  {/* Checkbox for multi-select mode */}
                  {!isSingleMode && (
                    <span
                      className={cn(
                        "w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0",
                        isSelected
                          ? "bg-blue-600 border-blue-600"
                          : "border-gray-400"
                      )}
                    >
                      {isSelected && (
                        <Check className="w-3 h-3 text-white stroke-[3]" />
                      )}
                    </span>
                  )}
                  <span className="truncate">{option.label}</span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer - only for multi-select mode */}
        {!isSingleMode && (
          <div className="flex items-center gap-2 px-3 py-2.5 border-t border-gray-200 bg-gray-50 rounded-b-lg">
            <button
              type="button"
              onClick={handleClearAll}
              className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
            >
              {clearAllText}
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={isLoading}
              className="flex-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {applyText}
            </button>
          </div>
        )}
      </div>
    );

    // Use portal to render dropdown at document body level
    if (typeof document !== 'undefined') {
      return createPortal(dropdownContent, document.body);
    }
    return null;
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleIconClick}
        disabled={disabled}
        aria-label={placeholder}
        className={cn(
          "p-0.5 rounded transition-colors focus:outline-none",
          isActive
            ? "text-blue-600 hover:text-blue-700"
            : "text-gray-500 hover:text-blue-600",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        title={placeholder}
      >
        <Funnel className="w-3.5 h-3.5" />
      </button>

      {renderDropdown()}
    </>
  );
}

export default FilterDropdown;
