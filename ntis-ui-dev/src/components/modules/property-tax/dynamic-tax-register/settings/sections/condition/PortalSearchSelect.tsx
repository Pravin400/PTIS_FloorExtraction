'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils/cn';
import { Input } from '@/components/common';

export interface PortalSearchSelectOption {
  label: string;
  value: string;
}

export interface PortalSearchSelectProps {
  options: PortalSearchSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * A searchable single-select in the spirit of `SearchSelect` (src/components/common), scoped to
 * this feature folder.
 *
 * The shared component renders its option list inline (`absolute`), so inside the Configuration
 * drawer's scrollable body the list is clipped — its auto-flip only measures the viewport, not the
 * clipping ancestor, so flipping does not rescue it. This variant portals the list to
 * `document.body` and fixed-positions it against the trigger's own rect (flipping up only when
 * there genuinely isn't room below), the same technique `FilterDropdown.tsx` already uses in
 * `common` — reimplemented here rather than changing the shared component and its other consumers.
 */
export function PortalSearchSelect({
  options,
  value,
  onChange,
  placeholder,
  disabled,
  className,
}: PortalSearchSelectProps) {
  const tCommon = useTranslations('common');
  const listboxId = `${useId()}-listbox`;

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [hasTyped, setHasTyped] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<{ top?: number; bottom?: number; left: number; width: number } | null>(null);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? '';
  const filtered = hasTyped
    ? options.filter((o) => o.label.toLowerCase().includes(search.trim().toLowerCase()))
    : options;

  const updatePosition = useCallback(() => {
    if (!containerRef.current) return;
    const box = containerRef.current.getBoundingClientRect();
    const estimatedPanelHeight = 240;
    const spaceBelow = window.innerHeight - box.bottom;
    const openUpward = spaceBelow < estimatedPanelHeight && box.top > spaceBelow;
    setRect(
      openUpward
        ? { bottom: window.innerHeight - box.top + 4, left: box.left, width: box.width }
        : { top: box.bottom + 4, left: box.left, width: box.width }
    );
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open, updatePosition]);

  const close = useCallback(() => {
    setOpen(false);
    setSearch('');
    setHasTyped(false);
    setHighlighted(-1);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!containerRef.current?.contains(target) && !panelRef.current?.contains(target)) {
        close();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [close]);

  const select = (val: string) => {
    onChange(val);
    close();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && e.key !== 'Escape') setOpen(true);
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlighted((p) => Math.min(p + 1, filtered.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlighted((p) => Math.max(p - 1, 0));
        break;
      case 'Enter': {
        e.preventDefault();
        const opt = highlighted >= 0 ? filtered[highlighted] : filtered[0];
        if (opt) select(opt.value);
        break;
      }
      case 'Escape':
        close();
        break;
    }
  };

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <div className="relative">
        <Input
          naked
          type="text"
          // While typing, show the query; otherwise always show the CURRENT selection, so
          // abandoning a search (Escape / click-away) can never leave a stale label behind.
          value={hasTyped ? search : selectedLabel}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          onFocus={() => !disabled && setOpen(true)}
          onClick={(e) => {
            if (!disabled) setOpen(true);
            (e.target as HTMLInputElement).select();
          }}
          onChange={(e) => {
            setSearch(e.target.value);
            setHasTyped(true);
            setOpen(true);
            setHighlighted(-1);
          }}
          onKeyDown={handleKeyDown}
          className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 pr-9 text-sm text-slate-900 placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
        />
        <div className="absolute right-0 top-0 h-full flex items-center pr-2.5 pointer-events-none">
          <ChevronDown className={cn('h-4 w-4 text-slate-400 transition-transform duration-200', open && 'rotate-180')} />
        </div>
      </div>

      {open &&
        rect &&
        createPortal(
          <div
            ref={panelRef}
            style={{
              position: 'fixed',
              top: rect.top,
              bottom: rect.bottom,
              left: rect.left,
              width: rect.width,
              zIndex: 9999,
            }}
            id={listboxId}
            role="listbox"
            className="max-h-60 overflow-auto overscroll-contain rounded-md border border-slate-300 bg-white shadow-xl"
          >
            {filtered.length === 0 ? (
              <p className="px-3 py-2.5 text-sm text-slate-500 text-center">
                {tCommon('multiSelect.noOptionsAvailable')}
              </p>
            ) : (
              filtered.map((opt, index) => {
                const isSelected = opt.value === value;
                const isHighlighted = index === highlighted;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    // Native title: option labels truncate in this narrow column, and this shows
                    // the full text on hover without pulling in a tooltip dependency.
                    title={opt.label}
                    onMouseDown={(e) => {
                      // mousedown, not click — the input's blur would otherwise close the panel
                      // before the click ever lands.
                      e.preventDefault();
                      select(opt.value);
                    }}
                    onMouseEnter={() => setHighlighted(index)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors',
                      isHighlighted && 'bg-blue-600 text-white',
                      isSelected && !isHighlighted && 'bg-blue-50 text-blue-600 font-semibold',
                      !isHighlighted && !isSelected && 'text-slate-700 hover:bg-slate-100'
                    )}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && <Check className={cn('h-4 w-4 shrink-0 ml-2', isHighlighted ? 'text-white' : 'text-blue-600')} />}
                  </button>
                );
              })
            )}
          </div>,
          document.body
        )}
    </div>
  );
}
