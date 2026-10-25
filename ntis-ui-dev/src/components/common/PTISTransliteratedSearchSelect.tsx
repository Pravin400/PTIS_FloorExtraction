'use client';

import { useTranslations } from 'next-intl';
import React, { useState, useMemo, useEffect, useRef, useCallback, memo } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';
import { SearchSelectOption } from './SearchSelect';
import { getMarathiMatchScore } from '@/lib/utils/marathiPhonetics';

export interface PTISTransliteratedSearchSelectProps {
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
  required?: boolean;
  disabled?: boolean;
  label?: string;
  menuPlacement?: 'top' | 'bottom';
  tabIndex?: number;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onEnter?: () => void;
  error?: string;
  autoFocus?: boolean;
  onBlur?: () => void;
  emptyMessage?: string;
  strictMode?: boolean;
}

interface NormalizedOption extends SearchSelectOption {
  normLabel: string;
}

/** In-memory cache for transliteration requests to avoid duplicate network calls */
const transliterationCache = new Map<string, string[]>();

/** Helper to normalize string for forgiving/flexible option matching. */
function normalizeSearchText(str: string): string {
  return str.toLowerCase().replace(/[\s-]/g, '');
}

const PTISTransliteratedSearchSelectComponent = ({
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
  menuPlacement,
  tabIndex,
  onKeyDown,
  onEnter,
  autoFocus = false,
  onBlur,
  strictMode = true,
  emptyMessage,
}: PTISTransliteratedSearchSelectProps): React.ReactElement => {
  const fallbackId = id || name || 'transliterated-search-select';
  const fallbackName = name || id || 'transliterated-search-select';
  const accessibleId = name || id || 'transliterated-search-select';

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [hasTyped, setHasTyped] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [placement, setPlacement] = useState<'top' | 'bottom'>('bottom');
  const activePlacement = menuPlacement || placement;

  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const dropdownRef = useRef<HTMLUListElement>(null);
  const isFocused = useRef<boolean>(false);
  const didSelectRef = useRef<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [transliteratedSuggestions, setTransliteratedSuggestions] = useState<string[]>([]);

  // Memoize valid & normalized options once per options prop change
  const normalizedOptions = useMemo<NormalizedOption[]>(() => {
    if (!Array.isArray(options)) return [];
    return options
      .filter(
        (opt): opt is SearchSelectOption =>
          Boolean(opt) &&
          typeof opt === 'object' &&
          typeof opt.label === 'string' &&
          opt.value !== undefined &&
          opt.value !== null
      )
      .map((opt) => ({
        ...opt,
        normLabel: normalizeSearchText(opt.label),
      }));
  }, [options]);

  const selectedLabel = useMemo(() => {
    if (value === undefined || value === null || value === '') return '';
    const valStr = String(value);
    const found = normalizedOptions.find(
      (opt) => opt.value === valStr || String(opt.value).toLowerCase() === valStr.toLowerCase()
    );
    return found ? found.label : value;
  }, [normalizedOptions, value]);

  const displayValue = useMemo(() => {
    if (forceSearchText !== undefined) return forceSearchText;
    if (hasTyped) return search;
    return selectedLabel;
  }, [forceSearchText, hasTyped, search, selectedLabel]);

  const fetchTransliteration = useCallback(async (text: string) => {
    if (!text || !/[a-zA-Z]/.test(text)) {
      setTransliteratedSuggestions([]);
      return;
    }
    const words = text.trim().split(/\s+/);
    const activeWord = words[words.length - 1] || '';
    if (!activeWord || !/[a-zA-Z]/.test(activeWord)) {
      setTransliteratedSuggestions([]);
      return;
    }

    const cacheKey = activeWord.toLowerCase();
    if (transliterationCache.has(cacheKey)) {
      setTransliteratedSuggestions(transliterationCache.get(cacheKey) || []);
      return;
    }

    // Cancel previous pending network request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const url = `https://inputtools.google.com/request?text=${encodeURIComponent(activeWord)}&itc=mr-t-i0-und&num=5&cp=0&cs=1&ie=utf-8&oe=utf-8&app=demopage`;
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) return;
      const data = await res.json();
      const results: string[] = data[1]?.[0]?.[1] || [];
      transliterationCache.set(cacheKey, results);
      setTransliteratedSuggestions(results);
    } catch (err: unknown) {
      if ((err as Error)?.name !== 'AbortError') {
        console.error('[PTISTransliteratedSearchSelect] Transliteration error:', err);
      }
    }
  }, []);

  useEffect(() => {
    if (!hasTyped || !search) {
      const timer = setTimeout(() => {
        setTransliteratedSuggestions([]);
      }, 0);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => {
      fetchTransliteration(search);
    }, 180);
    return () => {
      clearTimeout(timer);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [search, hasTyped, fetchTransliteration]);

  const filteredOptions = useMemo<NormalizedOption[]>(() => {
    if (disableSearch) return normalizedOptions;

    if (!hasTyped) {
      if (!value) return normalizedOptions;
      const idx = normalizedOptions.findIndex((opt) => opt.value === value);
      if (idx >= 0) {
        const selectedOpt = normalizedOptions[idx];
        const rest = normalizedOptions.filter((_, i) => i !== idx);
        return [selectedOpt, ...rest];
      }
      return normalizedOptions;
    }

    const cleanSearch = normalizeSearchText(search);
    const normSuggestions = transliteratedSuggestions.map(normalizeSearchText);

    const scored = normalizedOptions
      .map((opt) => {
        let score = getMarathiMatchScore(opt.label, search);
        if (score === 0) {
          if (opt.normLabel.includes(cleanSearch)) score = 40;
          else if (normSuggestions.length > 0 && normSuggestions.some((sug) => opt.normLabel.includes(sug))) {
            score = 30;
          }
        }
        return { opt, score };
      })
      .filter((item) => item.score > 0);

    scored.sort((a, b) => b.score - a.score);
    return scored.map((item) => item.opt);
  }, [search, hasTyped, normalizedOptions, disableSearch, value, transliteratedSuggestions]);

  // Auto-scroll highlighted option into view
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listRef.current) {
      const highlightedElement = listRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedElement && typeof highlightedElement.scrollIntoView === 'function') {
        highlightedElement.scrollIntoView({ block: 'nearest', inline: 'start' });
      }
    }
  }, [highlightedIndex, isOpen]);

  // Adjust dropdown position relative to viewport space
  useEffect(() => {
    if (menuPlacement) return;
    if (!isOpen) return;

    const updatePlacement = () => {
      if (!wrapperRef.current) return;
      const rect = wrapperRef.current.getBoundingClientRect();
      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;
      const dropdownHeight = Math.min(dropdownRef.current?.scrollHeight ?? 240, 240);

      if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
        setPlacement('top');
      } else {
        setPlacement('bottom');
      }
    };

    const frame = window.requestAnimationFrame(updatePlacement);
    window.addEventListener('resize', updatePlacement);
    window.addEventListener('scroll', updatePlacement, true);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', updatePlacement);
      window.removeEventListener('scroll', updatePlacement, true);
    };
  }, [isOpen, menuPlacement]);

  const handleSelect = useCallback(
    (selectedValue: string) => {
      didSelectRef.current = true;
      const matched = normalizedOptions.find((opt) => opt.value === selectedValue);
      setSearch(matched ? matched.label : '');
      setHasTyped(false);
      setIsOpen(false);
      setHighlightedIndex(-1);
      onChange(fallbackName, selectedValue);
    },
    [normalizedOptions, fallbackName, onChange]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const val = e.target.value;
    setSearch(val);
    setHasTyped(true);
    if (!isOpen) setIsOpen(true);
    setHighlightedIndex(0);
    onSearchChange?.(val);
  };

  const handleBlur = useCallback(() => {
    if (didSelectRef.current) {
      didSelectRef.current = false;
      setIsOpen(false);
      return;
    }
    setIsOpen(false);
    const cleanSearch = normalizeSearchText(search);
    const matched = normalizedOptions.find((opt) => opt.normLabel === cleanSearch);
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
        setHasTyped(false);
        onChange(fallbackName, search);
      }
    }
    onBlur?.();
  }, [search, normalizedOptions, hasTyped, onChange, fallbackName, strictMode, onBlur]);

  const handleKeyDownInternal = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
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
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

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
          placeholder={isLoading ? t('actions.loading') || 'Loading...' : placeholder}
          required={required}
          autoComplete="off"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={isOpen ? `${accessibleId}-listbox` : undefined}
          disabled={disabled}
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
            handleKeyDownInternal(e);
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
        <ul
          ref={(node) => {
            listRef.current = node;
            dropdownRef.current = node;
          }}
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
              {emptyMessage || t('multiSelect.noOptionsAvailable')}
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
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`
                    px-3 py-2 text-sm cursor-pointer select-none transition-colors
                    ${isSelected ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-700'}
                    ${isHighlighted ? 'bg-slate-100' : ''}
                  `}
                >
                  {opt.label}
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
};

export const PTISTransliteratedSearchSelect = memo(PTISTransliteratedSearchSelectComponent);
