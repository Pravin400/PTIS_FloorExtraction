'use client';

import { useTranslations } from 'next-intl';
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { ChevronDown, Check, Loader2 } from 'lucide-react';

export interface PTISSearchSelectOption {
  label: string;
  value: string;
}

export interface PTISSearchSelectProps {
  /**
   * Optional custom placeholder text when loading.
   */
  loadingPlaceholder?: string;

  /**
   * Optional custom placeholder text when no options are available.
   */
  noOptionsPlaceholder?: string;
  /**
   * Optional id for the input. If not provided, a default will be used.
   */
  id?: string;
  /**
   * Optional name for the input. If not provided, a default will be used.
   */
  name?: string;
  options: PTISSearchSelectOption[];
  value: string;
  onChange: (name: string, value: string) => void;
  placeholder?: string;
  className?: string;

  /* ---------------- Optional configuration ---------------- */

  /**
   * If true, typing is disabled. The component acts as a conventional select
   * but with the improved aesthetics.
   */
  disableSearch?: boolean;

  /**
   * Optional callback triggered when the user types in the input.
   * Useful for triggering external API searches.
   */
  onInputFocus?: () => void;

  /**
   * Optional callback triggered when the search query changes (for remote suggestions).
   */
  onSearchChange?: (searchText: string) => void;

  /**
   * Optional force display text. Overrides label search logic.
   * Useful when the selected label is not yet in the options list.
   */
  forceSearchText?: string;

  /**
   * If true, shows a spinner.
   */
  isLoading?: boolean;

  /**
   * If true, clears the input when it looses focus and no direct match is found.
   */
  strictMode?: boolean;

  /**
   * If true, marks the input as required.
   */
  required?: boolean;

  /**
   * If true, disables the input.
   */
  disabled?: boolean;

  /**
   * Optional icon to show inside the input.
   */
  icon?: React.ReactNode;

  /**
   * Accessibility label.
   */
  label?: string;

  /**
   * Optional callback for sanitizing the search input.
   */
  sanitizeInput?: (val: string) => string;

  /**
   * Mobile input mode hint.
   */
  inputMode?: 'text' | 'search' | 'none' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal';

  /**
   * Direction/placement of the menu dropdown. Defaults to 'bottom'.
   */
  menuPlacement?: 'top' | 'bottom';
  tabIndex?: number;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onEnter?: () => void;
  /**
   * Optional validation error message.
   */
  error?: string;
  /**
   * Optional autoFocus prop to focus the input on mount.
   */
  autoFocus?: boolean;
  onBlur?: () => void;
  /**
   * Optional custom label when the list is empty inside the dropdown.
   */
  emptyMessage?: string;
  /**
   * Optional custom label when the search yields no results.
   */
  noResultsMessage?: string;
  /**
   * Optional prop to hide default options until the user has typed a query.
   */
  showOptionsOnlyOnType?: boolean;
}

/** Helper to normalize string for forgiving/flexible option matching. */
function normalizeSearchText(str: string): string {
  return str.toLowerCase().replace(/[\s-]/g, '');
}

export function PTISSearchSelect({
  id,
  name,
  options = [],
  value,
  onChange,
  placeholder = '',
  className,
  disableSearch = false,
  onInputFocus,
  onSearchChange,
  forceSearchText,
  isLoading = false,
  required = false,
  disabled = false,
  label,
  sanitizeInput,
  inputMode = 'text',
  loadingPlaceholder,
  noOptionsPlaceholder,
  error,
  tabIndex,
  onKeyDown,
  onEnter,
  autoFocus = false,
  menuPlacement,
  onBlur,
  strictMode = true,
  emptyMessage,
  noResultsMessage,
  showOptionsOnlyOnType = false,
}: PTISSearchSelectProps): React.ReactElement {
  // Fallback id and name for backward compatibility
  const fallbackId = id || name || 'search-select';
  const fallbackName = name || id || 'search-select';

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [hasTyped, setHasTyped] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [placement, setPlacement] = useState<'top' | 'bottom'>('bottom');
  const activePlacement = menuPlacement || placement;
  // Accessible id for aria attributes and listbox
  const accessibleId = name || id || 'search-select';

  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  // Tracks whether the input is currently focused so the auto-open effect works correctly
  const isFocused = useRef<boolean>(false);
  // Tracks whether a selection was just made to prevent blur from clearing
  const didSelectRef = useRef<boolean>(false);

  useEffect(() => {
    if (menuPlacement) return;

    if (isOpen && wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow < 250 && rect.top > 250) {
        setPlacement('top');
      } else {
        setPlacement('bottom');
      }
    } else {
      setPlacement('bottom');
    }
  }, [isOpen, menuPlacement]);

  /* ---------------- Safety checks ---------------- */

  const validOptions = useMemo(() => (Array.isArray(options) ? options : []), [options]);
  const hasOptions = validOptions.length > 0;

  /* ---------------- Derived display value ---------------- */

  const displayValue = useMemo<string>(() => {
    if (hasTyped) return search;
    if (forceSearchText !== undefined) return forceSearchText;
    if (!hasOptions) return '';
    const valStr = value !== undefined && value !== null ? String(value) : '';
    const match = validOptions.find(
      (o) => String(o.value) === valStr || String(o.value).toLowerCase() === valStr.toLowerCase()
    );
    return match?.label ?? '';
  }, [hasOptions, hasTyped, search, forceSearchText, value, validOptions]);

  /* ---------------- Close on outside click ---------------- */

  useEffect((): (() => void) => {
    const handleClickOutside = (e: MouseEvent): void => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* ---------------- Scroll highlighted into view ---------------- */

  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listRef.current) {
      const highlightedElement = listRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedElement && typeof highlightedElement.scrollIntoView === 'function') {
        highlightedElement.scrollIntoView({
          block: 'nearest',
          inline: 'start',
        });
      }
    }
  }, [highlightedIndex, isOpen]);

  /* ---------------- Filter options ---------------- */

  const filteredOptions = useMemo<PTISSearchSelectOption[]>(() => {
    // If search is disabled, always show all options
    if (disableSearch) return validOptions;

    if (!hasTyped && !search.trim()) {
      if (showOptionsOnlyOnType) {
        if (!value) return [];
        const idx = validOptions.findIndex((opt) => opt.value === value);
        if (idx >= 0) {
          const selectedOpt = validOptions[idx];
          return [selectedOpt];
        }
        return [];
      }

      if (!value) return validOptions;
      const idx = validOptions.findIndex((opt) => opt.value === value);
      if (idx >= 0) {
        const selectedOpt = validOptions[idx];
        const rest = validOptions.filter((_, i) => i !== idx);
        return [selectedOpt, ...rest];
      }
      return validOptions;
    }

    const cleanSearch = normalizeSearchText(search);

    const matches = validOptions.filter((opt) =>
      normalizeSearchText(opt.label).includes(cleanSearch)
    );

    // Sort: exact matches first, then starts-with, then substring matches
    return [...matches].sort((a, b) => {
      const normA = normalizeSearchText(a.label);
      const normB = normalizeSearchText(b.label);

      const exactA = normA === cleanSearch;
      const exactB = normB === cleanSearch;
      if (exactA && !exactB) return -1;
      if (!exactA && exactB) return 1;

      const startsA = normA.startsWith(cleanSearch);
      const startsB = normB.startsWith(cleanSearch);
      if (startsA && !startsB) return -1;
      if (!startsA && startsB) return 1;

      return 0;
    });
  }, [search, hasTyped, validOptions, disableSearch, value, showOptionsOnlyOnType]);

  const prevIsOpen = useRef(isOpen);
  useEffect(() => {
    if (isOpen && !prevIsOpen.current) {
      const index = filteredOptions.findIndex((opt) => opt.value === value);
      setHighlightedIndex(index >= 0 ? index : 0);
    }
    prevIsOpen.current = isOpen;
  }, [isOpen, value, filteredOptions]);

  /* ---------------- Validate and clear on blur ---------------- */

  const handleBlur = useCallback((): void => {
    try {
      // If a selection was just made, skip the blur clearing logic
      if (didSelectRef.current) {
        didSelectRef.current = false;
        setIsOpen(false);
        return;
      }
      setIsOpen(false);
      // Removed hasOptions early return to allow committing/clearing raw text in non-strict mode even if validOptions is empty.
      const cleanSearch = normalizeSearchText(search);
      const matched = validOptions.find((opt) => normalizeSearchText(opt.label) === cleanSearch);
      if (matched) {
        // If user typed a match and blurred, commit it
        if (hasTyped) {
          onChange(fallbackName, matched.value);
          setHasTyped(false);
        }
      } else {
        if (strictMode) {
          // Restore previous selected value in the input if search did not match
          setSearch('');
          setHasTyped(false);
        } else if (hasTyped) {
          // If not strict mode and user typed, commit the raw search value!
          onChange(fallbackName, search);
          setHasTyped(false);
        }
      }
    } finally {
      onBlur?.();
    }
  }, [validOptions, search, fallbackName, onChange, hasTyped, onBlur, strictMode]);

  /* ---------------- Select option ---------------- */

  const handleSelect = (val: string): void => {
    const valStr = String(val);
    const selected = validOptions.find(
      (o) => String(o.value) === valStr || String(o.value).toLowerCase() === valStr.toLowerCase()
    );
    if (!selected) return;
    didSelectRef.current = true; // Mark that selection happened
    setSearch(selected.label);
    setHasTyped(false);
    setIsOpen(false);
    setHighlightedIndex(-1);
    onChange(fallbackName, String(selected.value));
  };

  /* ---------------- Input change ---------------- */

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    // If search is disabled, don't allow typing (read-only behavior)
    if (disableSearch) return;
    let val = e.target.value;
    if (sanitizeInput) val = sanitizeInput(val);
    setSearch(val);
    setHasTyped(true);
    setIsOpen(true);
    setHighlightedIndex(-1);
    onSearchChange?.(val);
  };

  /* ---------------- Keyboard navigation ---------------- */

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (!hasOptions) return;
    if (!isOpen && e.key !== 'Escape') {
      setIsOpen(true);
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => Math.min(prev + 1, filteredOptions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        const selectedOption =
          highlightedIndex >= 0 ? filteredOptions[highlightedIndex] : filteredOptions[0];
        if (selectedOption) {
          handleSelect(selectedOption.value);
          onEnter?.();
          return;
        }

        if (hasTyped) {
          const exactMatch = validOptions.find(
            (opt) => normalizeSearchText(opt.label) === normalizeSearchText(search)
          );
          if (exactMatch) {
            handleSelect(exactMatch.value);
            onEnter?.();
            return;
          }

          if (!strictMode) {
            didSelectRef.current = true;
            setHasTyped(false);
            setIsOpen(false);
            setHighlightedIndex(-1);
            onChange(fallbackName, search);
            onEnter?.();
            return;
          }
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  /* ---------------- Render ---------------- */

  const t = useTranslations('common');

  return (
    <div ref={wrapperRef} className={`relative w-full ${isOpen ? 'z-50' : ''}`}>
      {label && (
        <label htmlFor={fallbackId} className="block text-sm font-medium mb-1.5 text-slate-700">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      <div className="relative group">
        <input
          id={fallbackId}
          type="text"
          name={fallbackName}
          value={displayValue}
          autoFocus={autoFocus}
          placeholder={
            isLoading
              ? loadingPlaceholder || t('actions.loading') || 'Loading...'
              : !hasOptions && !value && !forceSearchText
                ? noOptionsPlaceholder || t('multiSelect.noOptionsAvailable')
                : placeholder
          }
          required={required}
          autoComplete="off"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={isOpen ? `${accessibleId}-listbox` : undefined}
          aria-activedescendant={
            isOpen && highlightedIndex >= 0 && highlightedIndex < filteredOptions.length
              ? `${accessibleId}-option-${highlightedIndex}`
              : undefined
          }
          disabled={disabled}
          inputMode={inputMode}
          onFocus={() => {
            isFocused.current = true;
            onInputFocus?.();
            if (!disabled) {
              setIsOpen(true);
              onSearchChange?.(search);
            }
          }}
          onClick={(e) => {
            if (!isOpen && !disabled) {
              setIsOpen(true);
            }
            (e.target as HTMLInputElement).select();
          }}
          onBlur={handleBlur}
          onChange={handleInputChange}
          onKeyDown={(e) => {
            handleKeyDown(e);
            onKeyDown?.(e);
          }}
          tabIndex={tabIndex}
          className={`
            w-full h-9 rounded-md border bg-white px-3 pr-9 text-sm text-slate-900
            placeholder:text-slate-400
            transition-all duration-150 ease-in-out
            border-slate-200
            hover:border-slate-300
            focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none
            disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed disabled:border-slate-200
            ${isOpen ? 'border-blue-500 ring-2 ring-blue-500/20' : ''}
            ${className ?? ''}
          `}
        />

        {/* Right side icon area */}
        <div className="absolute right-0 top-0 h-full flex items-center pr-2.5 pointer-events-none">
          {isLoading ? (
            <Loader2 className="h-4 w-4 text-slate-400 animate-spin" />
          ) : (
            <ChevronDown
              className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            />
          )}
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <ul
          ref={listRef}
          id={`${accessibleId}-listbox`}
          role="listbox"
          className={`
            absolute left-0 right-0 z-[9999] 
            max-h-56 overflow-auto overscroll-contain
            rounded-md border-2 border-slate-300 bg-white 
            shadow-xl shadow-slate-300/60
            ring-1 ring-slate-200
            animate-in fade-in-0 zoom-in-95 duration-150
            ${activePlacement === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'}
          `}
        >
          {filteredOptions.length === 0 && !isLoading ? (
            <li className="px-3 py-2.5 text-sm text-slate-500 text-center">
              {search.trim() !== ''
                ? (noResultsMessage || noOptionsPlaceholder || t('multiSelect.noOptionsAvailable'))
                : (emptyMessage || t('multiSelect.noOptionsAvailable'))}
            </li>
          ) : (
            filteredOptions.map((opt, index) => {
              const valStr = value !== undefined && value !== null ? String(value) : '';
              const isSelected =
                String(opt.value) === valStr ||
                String(opt.value).toLowerCase() === valStr.toLowerCase();
              const isHighlighted = index === highlightedIndex;

              return (
                <li
                  key={`${opt.value}-${index}`}
                  id={`${accessibleId}-option-${index}`}
                  role="option"
                  aria-selected={isSelected}
                  onMouseDown={() => handleSelect(opt.value)}
                  className={`
                    relative flex items-center justify-between
                    px-3 py-2 text-sm cursor-pointer
                    transition-colors duration-100
                    ${isHighlighted ? 'bg-blue-600 text-white' : ''}
                    ${isSelected && !isHighlighted ? 'bg-blue-50 text-blue-600' : ''}
                    ${!isHighlighted && !isSelected ? 'hover:bg-slate-100 text-slate-700' : ''}
                  `}
                >
                  <span
                    className={`truncate ${isSelected && !isHighlighted ? 'font-semibold text-blue-600' : isHighlighted ? 'text-white font-medium' : 'text-slate-700'}`}
                  >
                    {opt.label}
                  </span>
                  {isSelected && (
                    <Check
                      className={`h-4 w-4 flex-shrink-0 ml-2 ${isHighlighted ? 'text-white' : 'text-blue-600'}`}
                    />
                  )}
                </li>
              );
            })
          )}
        </ul>
      )}
      {error && <span className="text-[13px] text-red-600 mt-1 block">{error}</span>}
    </div>
  );
}

PTISSearchSelect.displayName = 'PTISSearchSelect';
