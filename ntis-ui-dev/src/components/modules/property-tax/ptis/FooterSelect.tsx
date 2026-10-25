'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronUpIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { FooterSelectListbox } from './FooterSelectListbox';

export interface Option {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface FooterSelectProps {
  options: Option[];
  value?: string;
  name?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  label?: string;
  selectedLabelOverride?: string;
  onOpen?: () => void;
}

export function FooterSelect({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  className = '',
  disabled = false,
  label,
  selectedLabelOverride,
  onOpen,
}: FooterSelectProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number } | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);

  const updateCoords = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.top,
        left: rect.left,
        width: rect.width,
      });
    }
  };

  const toggleOpen = () => {
    if (disabled) return;
    if (!open) {
      updateCoords();
      if (onOpen) onOpen();
      const activeIdx = options.findIndex((opt) => opt.value === value);
      setFocusedIndex(activeIdx >= 0 ? activeIdx : 0);
      setOpen(true);
    } else {
      setOpen(false);
      setFocusedIndex(-1);
    }
  };

  // Keep coordinates updated when open
  useEffect(() => {
    if (!open) return;
    window.addEventListener('resize', updateCoords);
    window.addEventListener('scroll', updateCoords, { capture: true });
    return () => {
      window.removeEventListener('resize', updateCoords);
      window.removeEventListener('scroll', updateCoords, { capture: true });
    };
  }, [open]);

  const handleSelect = (val: string) => {
    setOpen(false);
    setFocusedIndex(-1);
    triggerRef.current?.focus();
    if (onChange) {
      if (value === val) {
        onChange('');
      } else {
        onChange(val);
      }
    }
  };

  // Handle auto-focus of option list item when focusedIndex changes
  useEffect(() => {
    if (focusedIndex >= 0 && listboxRef.current) {
      const items = listboxRef.current.querySelectorAll('li');
      if (items[focusedIndex]) {
        (items[focusedIndex] as HTMLElement).focus();
      }
    }
  }, [focusedIndex]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      const isInsideTrigger = triggerRef.current?.contains(target);
      const isInsideListbox = listboxRef.current?.contains(target);

      if (!isInsideTrigger && !isInsideListbox) {
        setOpen(false);
        setFocusedIndex(-1);
      }
    };
    
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!open) {
        toggleOpen();
      }
    }
  };

  const handleListboxKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev > 0 ? prev - 1 : options.length - 1));
    } else if (e.key === 'Tab') {
      setOpen(false);
    }
  };

  const selectedLabel = selectedLabelOverride || options.find((opt) => opt.value === value)?.label;

  return (
    <div className={cn("relative group", className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggleOpen}
        onKeyDown={handleTriggerKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? "footer-select-listbox" : undefined}
        aria-label={label ? `${label} selector` : "Selection menu"}
        role="combobox"
        className={cn(
          "flex items-center justify-between w-full h-8.5 md:h-9 px-2.5 rounded-lg border border-slate-200/60 bg-white shadow-sm hover:border-blue-400 transition-all focus:outline-none focus:ring-4 focus:ring-blue-50/50 cursor-pointer",
          open && "border-blue-500 ring-4 ring-blue-50/50",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <div className="flex flex-col items-start overflow-hidden py-0.5">
          {label && (
            <span className="hidden sm:inline-block text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">
              {label}
            </span>
          )}
          <span className={cn(
            "text-[10px] font-black uppercase tracking-tight truncate leading-tight",
            selectedLabel ? "text-blue-900" : "text-slate-400"
          )}>
            {selectedLabel || placeholder}
          </span>
        </div>
        <ChevronUpIcon 
          className={cn(
            "ml-1.5 w-3 h-3 text-blue-500 transition-transform duration-300",
            open ? "rotate-0" : "rotate-180"
          )} 
        />
      </button>

      {open && (
        <FooterSelectListbox
          options={options}
          value={value}
          focusedIndex={focusedIndex}
          coords={coords}
          label={label}
          listboxRef={listboxRef}
          onKeyDown={handleListboxKeyDown}
          onSelect={handleSelect}
        />
      )}
    </div>
  );
}
