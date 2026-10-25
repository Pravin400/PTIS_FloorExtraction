'use client';
import React, { useState } from 'react';
import { ChevronDownIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface AccordionItemType {
  title: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
}

export interface AccordionProps {
  items: AccordionItemType[];
  multiple?: boolean;
  defaultOpen?: number[];
  className?: string;
}

export function Accordion({
  items,
  multiple = false,
  defaultOpen = [],
  className = '',
}: AccordionProps) {
  const [openIndexes, setOpenIndexes] = useState<number[]>(defaultOpen);

  const handleToggle = (idx: number) => {
    if (items[idx].disabled) return;
    if (multiple) {
      setOpenIndexes((prev) =>
        prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
      );
    } else {
      setOpenIndexes((prev) => (prev.includes(idx) ? [] : [idx]));
    }
  };

  return (
    <div className={cn('border rounded-md divide-y', className)}>
      {items.map((item, idx) => {
        const isOpen = openIndexes.includes(idx);
        return (
          <div key={idx} className={cn('bg-white', item.disabled && 'opacity-50')}>
            <div
              role="button"
              tabIndex={item.disabled ? -1 : 0}
              className={cn(
                'w-full flex items-center justify-between py-4 px-4 text-left text-sm font-medium transition-all outline-none hover:bg-gray-50 focus-visible:bg-gray-50 focus-visible:ring-2 focus-visible:ring-blue-300',
                isOpen && 'font-semibold',
                item.disabled && 'cursor-not-allowed'
              )}
              onClick={() => handleToggle(idx)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleToggle(idx);
                }
              }}
              id={`accordion-trigger-${idx}`}
              aria-controls={`accordion-content-${idx}`}
              aria-disabled={item.disabled}
              aria-expanded={isOpen}
            >
              {item.title}
              <ChevronDownIcon
                className={cn(
                  'ml-2 w-4 h-4 transition-transform duration-200',
                  isOpen && 'rotate-180'
                )}
              />
            </div>
            <div
              className={cn(
                'transition-all text-sm px-4',
                isOpen ? 'max-h-[75vh] overflow-y-auto py-2' : 'max-h-0 overflow-hidden py-0'
              )}
              style={{ transitionProperty: 'max-height, padding' }}
              id={`accordion-content-${idx}`}
              aria-labelledby={`accordion-trigger-${idx}`}
              role="region"
              aria-hidden={!isOpen}
            >
              {isOpen && item.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}
