'use client';

import React, { useState, useRef, useId } from 'react';
import { ChevronDownIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface Option {
  label: string;
  value: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export interface SelectProps {
  options: Option[];
  value?: string;
  name?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>, value: string) => void;
  onBlur?: (e: React.FocusEvent<HTMLSelectElement>) => void;
  placeholder?: string;
  className?: string;
  selectSize?: 'sm' | 'md';
  disabled?: boolean;
  ariaLabel?: string;

  /* Added */
  label?: string;
  required?: boolean;
  error?: string;
}

export function Select({
  options,
  value,
  name,
  onChange,
  onBlur,
  placeholder = 'Select...',
  className = '',
  selectSize = 'md',
  disabled = false,
  ariaLabel,
  label,
  required,
  error,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [internalValueState, setInternalValueState] = useState(value || '');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // Professional Perspective:
  // We derive the current value from props (controlled) or state (uncontrolled).
  // This avoids cascading renders and 'set-state-in-effect' lint errors.
  const internalValue = value !== undefined ? value : internalValueState;
  const [openUpward, setOpenUpward] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listboxId = useId();
  const optionIdPrefix = useId();

  /**
   * Find the nearest scrollable ancestor so that dropdown open-direction
   * is calculated against the container's visible boundary, not just the
   * raw viewport height.  This is important when the Select lives inside an
   * element that has `overflow-y: auto/scroll` (e.g. PageContainer).
   */
  const getScrollableContainer = (el: HTMLElement): HTMLElement => {
    let parent = el.parentElement;
    while (parent && parent !== document.documentElement) {
      const { overflow, overflowY } = window.getComputedStyle(parent);
      if (/auto|scroll/.test(overflow) || /auto|scroll/.test(overflowY)) {
        return parent;
      }
      parent = parent.parentElement;
    }
    return document.documentElement;
  };

  const toggleOpen = () => {
    if (disabled) return;
    const nextOpen = !open;

    // ── Calculate open direction SYNCHRONOUSLY before the render ──────────
    // Doing this here (instead of useEffect) removes the one-frame flicker
    // where the dropdown briefly shows downward then flips upward.
    if (nextOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const dropdownHeight = 240; // max-h-60 = 240px

      // Measure against the nearest scrollable container, not the raw viewport,
      // so that overflow-y:auto parents clip the dropdown correctly.
      const container = getScrollableContainer(buttonRef.current);
      const containerRect = container.getBoundingClientRect();
      const spaceBelow = containerRect.bottom - buttonRect.bottom;
      const spaceAbove = buttonRect.top - containerRect.top;

      setOpenUpward(spaceBelow < dropdownHeight && spaceAbove > spaceBelow);
    } else {
      setOpenUpward(false);
    }

    setOpen(nextOpen);

    if (nextOpen) {
      const index = options.findIndex((opt) => opt.value === internalValue);
      setHighlightedIndex(index >= 0 ? index : 0);
    } else {
      setHighlightedIndex(-1);
    }
  };

  // Scroll highlighted item into view
  React.useEffect(() => {
    if (open && highlightedIndex >= 0 && listRef.current) {
      const highlightedElement = listRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedElement && typeof highlightedElement.scrollIntoView === 'function') {
        highlightedElement.scrollIntoView({
          block: 'nearest',
          inline: 'start',
        });
      }
    }
  }, [highlightedIndex, open]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    if (!open) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('click', handleOutsideClick);
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [open]);

  const handleSelect = (val: string) => {
    if (value === undefined) {
      setInternalValueState(val);
    }
    setOpen(false);

    if (onChange) {
      // Simulate a ChangeEvent
      const event = {
        target: {
          name: name || '',
          value: val,
        },
      } as React.ChangeEvent<HTMLSelectElement>;
      onChange(event, val);
    }
  };

  const selectedLabel = options.find((opt) => opt.value === internalValue)?.label;
  const selectedOption = options.find(
    (opt) => opt.value === internalValue
  );

  const sizeClasses = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-base',
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleOpen();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (options.length > 0) {
          setHighlightedIndex((prev) => Math.min(prev + 1, options.length - 1));
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (options.length > 0) {
          setHighlightedIndex((prev) => Math.max(prev - 1, 0));
        }
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (
          highlightedIndex >= 0 &&
          highlightedIndex < options.length &&
          options[highlightedIndex] &&
          !options[highlightedIndex].disabled
        ) {
          handleSelect(options[highlightedIndex].value);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        break;
      case 'Tab':
        setOpen(false);
        break;
    }
  };

  const SelectContent = (
    <div
      ref={selectRef}
      className={cn('relative w-full', disabled && 'cursor-not-allowed', className)}
    >
      <button
        ref={buttonRef}
        type="button"
        role="combobox"
        className={cn(
          'flex items-center justify-between w-full border text-sm rounded-md bg-white focus:outline-none focus:ring-2 transition-all',
          sizeClasses[selectSize],
          error ? 'border-red-500 focus:ring-red-400' : 'border-gray-300 focus:ring-blue-300',
          disabled && 'bg-gray-100 border-gray-200 cursor-not-allowed'
        )}
        onClick={toggleOpen}
        onKeyDown={handleKeyDown}
        onChange={(e) => {
          const val = (e.target as unknown as { value?: string })?.value ?? '';
          handleSelect(val);
        }}
        onBlur={(e) => {
          const nextTarget = e.relatedTarget;

          // If focus leaves the window or there is no related target,
          // close the dropdown safely without calling contains(null).
          if (!nextTarget || !(nextTarget instanceof Node)) {
            setOpen(false);
            return;
          }

          if (!selectRef.current?.contains(nextTarget)) {
            setOpen(false);
            if (onBlur) {
              const event = {
                target: {
                  name: name || '',
                  value: internalValue,
                },
              } as React.FocusEvent<HTMLSelectElement>;
              onBlur(event);
            }
          }
        }}
        disabled={disabled}
        aria-label={ariaLabel ?? (!label ? placeholder : undefined)}
        aria-labelledby={!ariaLabel && label ? `${listboxId}-label` : undefined}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-activedescendant={
          open && highlightedIndex >= 0 ? `${optionIdPrefix}-${highlightedIndex}` : undefined
        }
      >
        <div className="flex min-w-0 flex-1 items-center">
          {
            selectedOption?.icon && (
              <span className="mr-2 flex-shrink-0">
                {selectedOption.icon}
              </span>
            )
          }
          <span
            className={cn(
              'truncate text-left flex-1 text-sm',
              !selectedLabel ? 'text-gray-400' : (disabled ? 'text-gray-500' : 'text-gray-800')
            )}
          >
            {selectedLabel || placeholder}
          </span>
        </div>

        <ChevronDownIcon className="ml-2 w-4 h-4 text-gray-400" />
      </button>

      {open && (
        <ul
          ref={listRef}
          id={listboxId}
          className={cn(
            'absolute z-[10000] w-full text-gray-800 text-sm bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto',
            openUpward ? 'bottom-full mb-1' : 'top-full mt-1'
          )}
          role="listbox"
          onMouseDown={(e) => e.preventDefault()}
        >
          {options.map((opt, index) => (
            <li
              key={opt.value}
              id={`${optionIdPrefix}-${index}`}
              className={cn(
                'px-4 py-2 transition-colors',
                !opt.disabled && 'cursor-pointer',
                !opt.disabled &&
                (index === highlightedIndex ? 'bg-blue-100' : 'hover:bg-blue-50'),
                internalValue === opt.value && 'text-blue-700 font-semibold bg-blue-50',
                opt.disabled && 'opacity-50 cursor-not-allowed'
              )}
              onClick={() => !opt.disabled && handleSelect(opt.value)}
              onMouseEnter={() => !opt.disabled && setHighlightedIndex(index)}
              aria-selected={internalValue === opt.value}
              aria-disabled={opt.disabled || undefined}
              role="option"
              tabIndex={-1}
            >
              <div className="flex items-center gap-2">
                {opt.icon && (
                  <span className="inline-flex shrink-0 items-center">
                    {opt.icon}
                  </span>
                )}
                <span>{opt.label}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  if (!label && !error) {
    return SelectContent;
  }

  return (
    <div className="flex flex-col gap-1 w-full">
      {/* Label */}
      {label && (
        <span id={`${listboxId}-label`} className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </span>
      )}

      {SelectContent}

      {/* Error Message */}
      {error && <span className="text-sm text-red-600">{error}</span>}
    </div>
  );
}