'use client';

/* eslint-disable i18next/no-literal-string */

import React, { useState, useEffect, useRef, useId, useCallback } from 'react';
import { cn } from '@/lib/utils/cn';

export interface PTISTransliteratedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  required?: boolean;
  naked?: boolean;
}

function getActiveWordInfo(text: string, cursorIndex: number) {
  if (cursorIndex < 0) cursorIndex = 0;

  // Find start of the active word
  let start = cursorIndex;
  while (start > 0 && !/\s/.test(text[start - 1])) {
    start--;
  }

  // Find end of the active word
  let end = cursorIndex;
  while (end < text.length && !/\s/.test(text[end])) {
    end++;
  }

  const word = text.slice(start, end);
  return { word, start, end };
}

export const PTISTransliteratedInput = React.forwardRef<
  HTMLInputElement,
  PTISTransliteratedInputProps
>(
  (
    {
      className,
      label,
      error,
      helperText,
      fullWidth = false,
      naked = false,
      id,
      disabled,
      required,
      value,
      onChange,
      onKeyDown,
      onBlur,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || `transliterated-input-${generatedId}`;

    const localInputRef = useRef<HTMLInputElement>(null);
    const inputRef = (ref as React.RefObject<HTMLInputElement>) || localInputRef;

    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [activeWord, setActiveWord] = useState('');
    const [cursorPos, setCursorPos] = useState(0);

    const requestCounter = useRef(0);
    const didSelectRef = useRef(false);

    const triggerChange = useCallback(
      (newValue: string) => {
        if (onChange) {
          const event = {
            target: {
              value: newValue,
              name: props.name || id,
              id: inputId,
            },
            currentTarget: {
              value: newValue,
              name: props.name || id,
              id: inputId,
            },
          } as unknown as React.ChangeEvent<HTMLInputElement>;
          onChange(event);
        }
      },
      [onChange, props.name, id, inputId]
    );

    const selectSuggestion = useCallback(
      (selectedWord: string) => {
        const input = inputRef.current;
        if (!input) return;

        const currentVal = String(value ?? '');
        const { start, end } = getActiveWordInfo(currentVal, cursorPos);

        const before = currentVal.slice(0, start);
        const after = currentVal.slice(end);

        const newVal = before + selectedWord + ' ' + after;

        didSelectRef.current = true;
        triggerChange(newVal);
        setSuggestions([]);
        setHighlightedIndex(-1);

        // Restore focus and cursor position after state sync
        setTimeout(() => {
          input.focus();
          const newCursorPos = start + selectedWord.length + 1;
          input.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
      },
      [value, cursorPos, triggerChange, inputRef]
    );

    const fetchSuggestions = async (word: string) => {
      // Only transliterate if it contains English alphabet characters
      if (!word || !/[a-zA-Z]/.test(word)) {
        setSuggestions([]);
        return;
      }

      const reqId = ++requestCounter.current;
      try {
        const url = `https://inputtools.google.com/request?text=${encodeURIComponent(word)}&itc=mr-t-i0-und&num=5&cp=0&cs=1&ie=utf-8&oe=utf-8&app=demopage`;
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();

        if (reqId !== requestCounter.current) return;

        const results: string[] = data[1]?.[0]?.[1] || [];

        // Append raw input word to the end of suggestions so user can keep English text if desired
        if (results.length > 0 && !results.includes(word)) {
          results.push(word);
        }

        setSuggestions(results);
        setHighlightedIndex(-1);
      } catch (err) {
        console.error('[Transliteration] Fetch suggestions error:', err);
      }
    };

    // Track cursor and update active word on input changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target;
      const start = input.selectionStart || 0;
      setCursorPos(start);

      const currentVal = input.value;
      const { word } = getActiveWordInfo(currentVal, start);
      setActiveWord(word);

      onChange?.(e);
    };

    // Track cursor position on click/selection changes
    const handleSelect = (e: React.SyntheticEvent<HTMLInputElement>) => {
      const input = e.currentTarget;
      const start = input.selectionStart || 0;
      setCursorPos(start);

      const { word } = getActiveWordInfo(input.value, start);
      setActiveWord(word);
    };

    // Debounce active word changes
    useEffect(() => {
      const timer = setTimeout(() => {
        fetchSuggestions(activeWord);
      }, 180);
      return () => clearTimeout(timer);
    }, [activeWord]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (suggestions.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setHighlightedIndex((prev) => (prev + 1) % suggestions.length);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setHighlightedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
        } else if (e.key === 'Enter') {
          if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
            e.preventDefault();
            selectSuggestion(suggestions[highlightedIndex]);
          }
        } else if (e.key === ' ') {
          // Only commit suggestions on Space bar if user actively highlighted an item with arrow keys
          if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
            e.preventDefault();
            selectSuggestion(suggestions[highlightedIndex]);
          }
        } else if (e.key === 'Escape') {
          setSuggestions([]);
          setHighlightedIndex(-1);
        }
      }
      onKeyDown?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      // Give a tiny delay to allow clicking suggestions list items
      setTimeout(() => {
        if (!didSelectRef.current) {
          setSuggestions([]);
          setHighlightedIndex(-1);
        }
        didSelectRef.current = false;
      }, 150);
      onBlur?.(e);
    };

    const isControlled = value !== undefined;
    const normalizedValue = isControlled ? (value ?? '') : undefined;

    const inputElement = (
      <input
        id={inputId}
        ref={inputRef}
        required={required}
        disabled={disabled}
        className={cn(
          !naked &&
            'px-3 py-2 border rounded-lg text-sm text-gray-800 transition-colors placeholder:text-gray-400 w-full',
          !naked && 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
          !naked &&
            (error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 hover:border-gray-400'),
          !naked && disabled && 'bg-gray-100 cursor-not-allowed opacity-50',
          className
        )}
        onSelect={handleSelect}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onChange={handleInputChange}
        {...(isControlled ? { value: normalizedValue } : {})}
        {...props}
      />
    );

    if (naked) {
      return (
        <div className="relative w-full">
          {inputElement}
          {suggestions.length > 0 && (
            <ul className="absolute left-0 right-0 z-[9999] max-h-48 overflow-auto rounded-md border-2 border-slate-300 bg-white shadow-xl shadow-slate-300/60 ring-1 ring-slate-200 mt-1">
              {suggestions.map((opt, index) => (
                <li
                  key={`${opt}-${index}`}
                  onMouseDown={() => selectSuggestion(opt)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={cn(
                    'relative flex items-center justify-between px-3 py-1.5 text-xs sm:text-sm cursor-pointer transition-colors duration-100',
                    index === highlightedIndex
                      ? 'bg-blue-600 text-white font-medium'
                      : 'hover:bg-slate-100 text-slate-700'
                  )}
                >
                  <span>{opt}</span>
                  {index === suggestions.length - 1 && (
                    <span className="text-[10px] text-gray-400 italic">keep english</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      );
    }

    return (
      <div className={cn('flex flex-col relative', fullWidth && 'w-full')}>
        {label && (
          <label htmlFor={inputId} className="mb-1.5 text-sm font-medium text-gray-700">
            {label}
            {required && <span className="text-red-500"> *</span>}
          </label>
        )}
        <div className="relative w-full">
          {inputElement}
          {suggestions.length > 0 && (
            <ul className="absolute left-0 right-0 z-[9999] max-h-48 overflow-auto rounded-md border-2 border-slate-300 bg-white shadow-xl shadow-slate-300/60 ring-1 ring-slate-200 mt-1">
              {suggestions.map((opt, index) => (
                <li
                  key={`${opt}-${index}`}
                  onMouseDown={() => selectSuggestion(opt)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={cn(
                    'relative flex items-center justify-between px-3 py-2 text-sm cursor-pointer transition-colors duration-100',
                    index === highlightedIndex
                      ? 'bg-blue-600 text-white font-medium'
                      : 'hover:bg-slate-100 text-slate-700'
                  )}
                >
                  <span>{opt}</span>
                  {index === suggestions.length - 1 && (
                    <span
                      className={cn(
                        'text-[10px] italic',
                        index === highlightedIndex ? 'text-blue-200' : 'text-gray-400'
                      )}
                    >
                      keep english
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
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

PTISTransliteratedInput.displayName = 'PTISTransliteratedInput';
