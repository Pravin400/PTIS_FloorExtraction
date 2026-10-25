'use client';
/* eslint-disable react-hooks/refs */
import { useTranslations } from 'next-intl';
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { ChevronDown, Check, Loader2 } from 'lucide-react';

export interface SearchSelectOption {
  label: string;
  value: string;
}

export interface SearchSelectPaginatedProps {
  loadingPlaceholder?: string;
  noOptionsPlaceholder?: string;
  id?: string;
  name?: string;
  options: SearchSelectOption[];
  value: string;
  onChange: (name: string, value: string) => void;
  placeholder?: string;
  className?: string;
  disableSearch?: boolean;
  onInputFocus?: () => void;
  onSearchChange?: (searchText: string) => void;
  forceSearchText?: string;
  isLoading?: boolean;
  strictMode?: boolean;
  required?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  label?: string;
  sanitizeInput?: (val: string) => string;
  inputMode?: 'text' | 'search' | 'none' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal';
  menuPlacement?: 'top' | 'bottom';
  tabIndex?: number;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onEnter?: () => void;
  error?: string;
  autoFocus?: boolean;
  onBlur?: () => void;
  hasMore?: boolean;
  onLoadMore?: (searchQuery?: string) => void;
  isLoadingMore?: boolean;
}

function normalizeSearchText(str: string): string {
  return str.toLowerCase().replace(/[\s-]/g, '');
}

export function SearchSelectPaginated({
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
  hasMore = false,
  onLoadMore,
  isLoadingMore = false,
}: SearchSelectPaginatedProps): React.ReactElement {
  const fallbackId = id || name || 'search-select';
  const fallbackName = name || id || 'search-select';

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [hasTyped, setHasTyped] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [placement, setPlacement] = useState<'top' | 'bottom'>('bottom');
  const activePlacement = menuPlacement || placement;
  const accessibleId = name || id || 'search-select';

  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isFocused = useRef<boolean>(false);
  const didSelectRef = useRef<boolean>(false);
  const isClickingInsideRef = useRef<boolean>(false);

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

  const validOptions = useMemo(() => Array.isArray(options) ? options : [], [options]);
  const hasOptions = validOptions.length > 0;

  const displayValue = useMemo<string>(() => {
    if (hasTyped && isFocused.current) return search;
    const valStr = value !== undefined && value !== null ? String(value) : '';
    if (valStr !== '') {
      const match = validOptions.find(
        (o) => String(o.value) === valStr || String(o.value).toLowerCase() === valStr.toLowerCase()
      );
      return match?.label ?? valStr;
    }
    if (forceSearchText !== undefined && forceSearchText.trim() !== '') return forceSearchText;
    return search;
  }, [hasTyped, search, forceSearchText, value, validOptions]);

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

  const prevValueRef = useRef(value);
  useEffect(() => {
    if (value !== prevValueRef.current) {
      prevValueRef.current = value;
      if (!value) {
        queueMicrotask(() => {
          setSearch('');
          setHasTyped(false);
        });
      }
    }
  }, [value]);

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

  const filteredOptions = useMemo<SearchSelectOption[]>(() => {
    if (disableSearch) return validOptions;

    const activeQuery = hasTyped ? search : (forceSearchText || '');
    if (!activeQuery) {
      if (!value) return validOptions;
      const idx = validOptions.findIndex((opt) => opt.value === value);
      if (idx >= 0) {
        const selectedOpt = validOptions[idx];
        const rest = validOptions.filter((_, i) => i !== idx);
        return [selectedOpt, ...rest];
      }
      return validOptions;
    }

    const cleanSearch = normalizeSearchText(activeQuery);
    const matches = validOptions.filter((opt) =>
      normalizeSearchText(opt.label).includes(cleanSearch)
    );

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
  }, [search, hasTyped, validOptions, disableSearch, value, forceSearchText]);

  // Auto-fetch next pages when searching and local options return 0 matches but hasMore is true
  useEffect(() => {
    const activeQuery = hasTyped ? search : (forceSearchText || '');
    if (hasTyped && activeQuery && activeQuery.trim() !== '' && filteredOptions.length === 0 && hasMore && !isLoadingMore && !isLoading && onLoadMore) {
      const timer = setTimeout(() => {
        onLoadMore(activeQuery);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [hasTyped, search, forceSearchText, filteredOptions.length, hasMore, isLoadingMore, isLoading, onLoadMore]);

  const prevIsOpen = useRef(isOpen);
  useEffect(() => {
    if (isOpen && !prevIsOpen.current) {
      const index = filteredOptions.findIndex((opt) => opt.value === value);
      setHighlightedIndex(index >= 0 ? index : 0);
    }
    prevIsOpen.current = isOpen;
  }, [isOpen, value, filteredOptions]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>): void => {
    try {
      if (isClickingInsideRef.current) {
        return;
      }
      if (e.relatedTarget && wrapperRef.current?.contains(e.relatedTarget as Node)) {
        return;
      }
      if (didSelectRef.current) {
        didSelectRef.current = false;
        setIsOpen(false);
        return;
      }
      setIsOpen(false);
      if (!hasOptions) return;
      const cleanSearch = normalizeSearchText(search);
      const matched = validOptions.find((opt) => normalizeSearchText(opt.label) === cleanSearch);
      if (matched) {
        if (hasTyped) {
          onChange(fallbackName, matched.value);
          setHasTyped(false);
        }
      } else {
        if (strictMode) {
          setSearch('');
          setHasTyped(false);
        } else if (hasTyped) {
          onChange(fallbackName, search);
          setHasTyped(false);
        }
      }
    } finally {
      onBlur?.();
    }
  }, [hasOptions, validOptions, search, fallbackName, onChange, hasTyped, onBlur, strictMode]);

  const handleSelect = (val: string): void => {
    const valStr = String(val);
    const selected = validOptions.find(
      (o) => String(o.value) === valStr || String(o.value).toLowerCase() === valStr.toLowerCase()
    );
    if (!selected) return;
    didSelectRef.current = true;
    setSearch(selected.label);
    setHasTyped(false);
    setIsOpen(false);
    setHighlightedIndex(-1);
    onChange(fallbackName, String(selected.value));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    if (disableSearch) return;
    let val = e.target.value;
    if (sanitizeInput) val = sanitizeInput(val);
    setSearch(val);
    setHasTyped(true);
    setIsOpen(true);
    setHighlightedIndex(-1);
    onSearchChange?.(val);
  };

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
          highlightedIndex >= 0
            ? filteredOptions[highlightedIndex]
            : filteredOptions[0];
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

  const t = useTranslations("common");

  return (
    <div
      ref={wrapperRef}
      className={`relative w-full ${isOpen ? 'z-50' : ''}`}
      onMouseDown={() => {
        isClickingInsideRef.current = true;
      }}
      onMouseUp={() => {
        setTimeout(() => {
          isClickingInsideRef.current = false;
        }, 0);
      }}
    >
      {label && (
        <label
          htmlFor={fallbackId}
          className="block text-sm font-medium mb-1.5 text-slate-700"
        >
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      <div className="relative group">
        <input
          ref={inputRef}
          id={fallbackId}
          type="text"
          name={fallbackName}
          value={displayValue}
          autoFocus={autoFocus}
          placeholder={
            isLoading
              ? loadingPlaceholder || t('actions.loading') || 'Loading...'
              : !hasOptions && !value && !forceSearchText
                ? noOptionsPlaceholder ||
                t('multiSelect.noOptionsAvailable')
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

      {isOpen && (
        <div
          id={`${accessibleId}-listbox`}
          role="listbox"
          className={`
            absolute left-0 right-0 z-[9999] 
            rounded-md border-2 border-slate-300 bg-white 
            shadow-xl shadow-slate-300/60
            ring-1 ring-slate-200
            animate-in fade-in-0 zoom-in-95 duration-150
            flex flex-col overflow-hidden
            ${activePlacement === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'}
          `}
        >
          <ul
            ref={listRef}
            onMouseDown={() => {
              isClickingInsideRef.current = true;
            }}
            onMouseUp={() => {
              setTimeout(() => {
                isClickingInsideRef.current = false;
              }, 0);
            }}
            onScroll={(e) => {
              if (hasMore && !isLoadingMore && onLoadMore) {
                const target = e.currentTarget;
                if (target.scrollHeight - target.scrollTop - target.clientHeight < 30) {
                  onLoadMore();
                }
              }
            }}
            className="max-h-56 overflow-auto overscroll-contain"
          >
            {filteredOptions.length === 0 ? (
              isLoading || isLoadingMore ? (
                <li className="px-3 py-3 text-sm text-blue-600 text-center flex items-center justify-center gap-2 font-medium">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <span>{t('multiSelect.fetchingMatchingOptions') || 'Fetching matching options...'}</span>
                </li>
              ) : (
                <li className="px-3 py-2.5 text-sm text-slate-500 text-center">
                  {t('multiSelect.noOptionsAvailable')}
                </li>
              )
            ) : (
              filteredOptions.map((opt, index) => {
                const valStr = value !== undefined && value !== null ? String(value) : '';
                const isSelected = String(opt.value) === valStr || String(opt.value).toLowerCase() === valStr.toLowerCase();
                const isHighlighted = index === highlightedIndex;

                return (
                  <li
                    key={opt.value}
                    id={`${accessibleId}-option-${index}`}
                    role="option"
                    aria-selected={isSelected}
                    onMouseDown={() => handleSelect(opt.value)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`
                      relative flex items-center justify-between
                      px-3 py-2 text-sm cursor-pointer
                      transition-colors duration-100
                      ${isHighlighted ? 'bg-blue-600 text-white' : ''}
                      ${isSelected && !isHighlighted ? 'bg-blue-50 text-blue-600' : ''}
                      ${!isHighlighted && !isSelected ? 'hover:bg-slate-100 text-slate-700' : ''}
                    `}
                  >
                    <span className={`truncate ${isSelected && !isHighlighted ? 'font-semibold text-blue-600' : isHighlighted ? 'text-white font-medium' : 'text-slate-700'}`}>
                      {opt.label}
                    </span>
                    {isSelected && (
                      <Check className={`h-4 w-4 flex-shrink-0 ml-2 ${isHighlighted ? 'text-white' : 'text-blue-600'}`} />
                    )}
                  </li>
                );
              })
            )}
          </ul>
          {hasMore && (
            <div
              className="px-3 py-2.5 text-sm text-center border-t border-slate-100 bg-slate-50 flex items-center justify-center cursor-pointer select-none"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                isClickingInsideRef.current = true;
                inputRef.current?.focus();
                if (!isLoadingMore && onLoadMore) {
                  const activeQuery = hasTyped ? search : (forceSearchText || '');
                  onLoadMore(activeQuery);
                }
                setTimeout(() => {
                  isClickingInsideRef.current = false;
                }, 200);
              }}
            >
              {isLoadingMore ? (
                <div className="flex items-center justify-center gap-2 text-blue-600 py-0.5">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <span className="text-xs font-medium text-slate-600">{t('multiSelect.loadingOptions') || 'Loading options...'}</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-1.5 text-blue-600 hover:text-blue-700 py-0.5">
                  <Loader2 className="h-3.5 w-3.5 text-blue-500" />
                  <span className="text-xs font-semibold text-blue-600 hover:underline">{t('multiSelect.loadMoreOptions') || 'Load More Options'}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {error && <span className="text-[13px] text-red-600 mt-1 block">{error}</span>}
    </div>
  );
}

SearchSelectPaginated.displayName = 'SearchSelectPaginated';
