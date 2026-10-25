'use client';

import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils/cn';
import type { Option } from './FooterSelect';

interface FooterSelectListboxProps {
  options: Option[];
  value?: string;
  focusedIndex: number;
  coords: { top: number; left: number; width: number } | null;
  label?: string;
  listboxRef: React.RefObject<HTMLDivElement | null>;
  onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => void;
  onSelect: (val: string) => void;
}

export function FooterSelectListbox({
  options,
  value,
  focusedIndex,
  coords,
  label,
  listboxRef,
  onKeyDown,
  onSelect,
}: FooterSelectListboxProps) {
  if (typeof document === 'undefined' || !coords) return null;

  return createPortal(
    <div
      ref={listboxRef}
      onKeyDown={onKeyDown}
      className="fixed z-[9999] bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200"
      style={{
        bottom: `${window.innerHeight - coords.top + 8}px`,
        left: `${coords.left}px`,
        width: `${coords.width}px`,
        maxHeight: '240px',
      }}
    >
      <ul
        id="footer-select-listbox"
        className="py-1 overflow-auto max-h-[240px] custom-scrollbar"
        role="listbox"
        aria-label={label || 'Options'}
      >
        {options.map((opt, idx) => (
          <li
            key={opt.value}
            role="option"
            aria-selected={value === opt.value}
            onClick={() => {
              if (!opt.disabled) onSelect(opt.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (!opt.disabled) onSelect(opt.value);
              }
            }}
            tabIndex={0}
            className={cn(
              'px-4 py-2 text-[11px] md:text-xs cursor-pointer transition-colors outline-none focus:bg-blue-50',
              value === opt.value ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700 hover:bg-blue-50/50',
              focusedIndex === idx && 'bg-blue-50 text-blue-900 font-semibold',
              opt.disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {opt.label}
          </li>
        ))}
      </ul>
    </div>,
    document.body
  );
}
