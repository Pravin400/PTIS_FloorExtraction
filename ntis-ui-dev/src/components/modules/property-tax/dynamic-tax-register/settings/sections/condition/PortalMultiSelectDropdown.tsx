'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils/cn';
import { Input } from '@/components/common';
import { SelectAllButton, ClearButton } from '@/components/common/ActionButtons';

export interface PortalMultiSelectOption {
  label: string;
  value: string;
}

export interface PortalMultiSelectDropdownProps {
  options: PortalMultiSelectOption[];
  value: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
}

/**
 * A `MultiSelectDropdown` (src/components/common/Dropdown.tsx) look-alike, scoped to this
 * feature folder only. The shared component renders its panel inline (`absolute`), so when its
 * trigger sits inside a scrollable ancestor — this drawer's Configuration tab body — the panel
 * gets clipped once the trigger is near the bottom of the visible/scrollable area. This variant
 * portals the panel to `document.body`, fixed-positioned against the trigger's own rect (and
 * flips upward when there isn't room below), the same technique `FilterDropdown.tsx` already
 * uses elsewhere in `common` — reimplemented locally here rather than changing the shared
 * `MultiSelectDropdown` component and its other consumers.
 */
export function PortalMultiSelectDropdown({
  options,
  value,
  onChange,
  placeholder,
  className,
}: PortalMultiSelectDropdownProps) {
  const tCommon = useTranslations('common');

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<{ top?: number; bottom?: number; left: number; width: number } | null>(null);

  const updatePosition = useCallback(() => {
    if (!containerRef.current) return;
    const box = containerRef.current.getBoundingClientRect();
    // Rough panel height budget: action bar + search + a few option rows.
    const estimatedPanelHeight = 320;
    const spaceBelow = window.innerHeight - box.bottom;
    const openUpward = spaceBelow < estimatedPanelHeight && box.top > spaceBelow;
    // Never narrower than the trigger's own column, but wide enough that "Select All"/"Clear
    // All" and the option labels aren't cramped when the trigger sits in a narrow grid column.
    const width = Math.max(box.width, 288);
    setRect(
      openUpward
        ? { bottom: window.innerHeight - box.top + 4, left: box.left, width }
        : { top: box.bottom + 4, left: box.left, width }
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

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!containerRef.current?.contains(target) && !panelRef.current?.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filteredOptions = options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()));
  const allFilteredSelected = filteredOptions.length > 0 && filteredOptions.every((o) => value.includes(o.value));

  const toggleValue = (val: string) => {
    onChange(value.includes(val) ? value.filter((v) => v !== val) : [...value, val]);
  };

  const handleSelectAll = () => {
    const filteredValues = filteredOptions.map((o) => o.value);
    onChange(Array.from(new Set([...value, ...filteredValues])));
  };

  const handleClearAll = () => {
    const filteredValues = filteredOptions.map((o) => o.value);
    onChange(value.filter((v) => !filteredValues.includes(v)));
    setSearch('');
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between text-gray-700 px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <span className="truncate text-left">
          {value.length > 0
            ? value.map((v) => options.find((o) => o.value === v)?.label ?? v).join(', ')
            : placeholder || tCommon('multiSelect.placeholder')}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-500" />
      </button>

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
            className="bg-white border border-gray-200 rounded-lg shadow-lg"
          >
            <div className="flex items-center justify-between px-3 py-2 border-b bg-gray-50 text-sm">
              <SelectAllButton
                label={tCommon('multiSelect.selectAll')}
                size="xs"
                onClick={handleSelectAll}
                disabled={allFilteredSelected}
              />
              <ClearButton
                label={tCommon('multiSelect.clearAll')}
                size="xs"
                onClick={handleClearAll}
                disabled={value.length === 0}
              />
            </div>

            <div className="p-2 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
                <Input
                  naked
                  type="text"
                  placeholder={tCommon('multiSelect.search')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-2 py-1.5 text-sm text-gray-700 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="max-h-56 overflow-auto p-2">
              {filteredOptions.length === 0 && (
                <p className="text-sm text-gray-500 px-2 py-1">{tCommon('multiSelect.noOptions')}</p>
              )}
              {filteredOptions.map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-blue-50"
                >
                  <input
                    type="checkbox"
                    checked={value.includes(opt.value)}
                    onChange={() => toggleValue(opt.value)}
                    className="w-4 h-4 accent-blue-600"
                  />
                  <span className="text-sm text-gray-700">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
