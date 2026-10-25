/**
 * Auditor Filter Dropdown Component
 * Path: src/components/modules/fire-audit/staff/auditor/filters/AuditorFilterDropdown.tsx
 *
 * Custom accessible dropdown menu styled to match the filter card design.
 * Highlights the active selected option with a checkmark and primary accent background.
 * Line ceiling: <= 300 lines.
 */

import { useEffect, useRef, useState, useCallback, type KeyboardEvent } from "react";
import { Check } from "lucide-react";
import { Card, Button } from "@/components/common";
import { cn } from "@/lib/utils/cn";
import type { FilterOption } from "@/types/fire-audit/auditor.types";

export interface AuditorFilterDropdownProps {
  id?: string;
  options: FilterOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  onClose?: () => void;
  align?: "left" | "right";
  className?: string;
}

export function AuditorFilterDropdown({
  id,
  options,
  selectedValue,
  onSelect,
  onClose,
  align = "left",
  className,
}: AuditorFilterDropdownProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedIndex = options.findIndex((opt) => opt.value === selectedValue);
  const [highlightedIndex, setHighlightedIndex] = useState(
    selectedIndex >= 0 ? selectedIndex : 0
  );

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setHighlightedIndex((prev) =>
            options.length > 0 ? (prev + 1) % options.length : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setHighlightedIndex((prev) =>
            options.length > 0 ? (prev - 1 + options.length) % options.length : 0
          );
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          if (highlightedIndex >= 0 && highlightedIndex < options.length) {
            onSelect(options[highlightedIndex].value);
          }
          break;
        case "Escape":
        case "Tab":
          e.preventDefault();
          onClose?.();
          break;
      }
    },
    [highlightedIndex, onClose, onSelect, options]
  );

  return (
    <Card
      ref={containerRef}
      id={id}
      role="listbox"
      tabIndex={-1}
      padding="none"
      onKeyDown={handleKeyDown}
      className={cn(
        "absolute top-[calc(100%+6px)] z-50 w-full min-w-[170px] max-w-[260px] rounded-2xl border border-slate-100 bg-white p-1.5 shadow-xl shadow-slate-900/10 animate-in fade-in-0 zoom-in-95 duration-150 overflow-hidden outline-none",
        align === "right" ? "right-0" : "left-0",
        className
      )}
    >
      <div className="max-h-60 overflow-y-auto no-scrollbar flex flex-col gap-0.5">
        {options.map((opt, index) => {
          const isSelected = selectedValue === opt.value;
          const isHighlighted = highlightedIndex === index;
          return (
            <Button
              key={opt.value}
              variant="ghost"
              size="sm"
              role="option"
              aria-selected={isSelected}
              onClick={() => onSelect(opt.value)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={cn(
                "w-full !flex !items-center !justify-between !px-3.5 !py-2.5 !h-auto !rounded-xl !text-sm !text-left cursor-pointer transition-colors !border-0 [&>span]:w-full [&>span]:flex [&>span]:items-center [&>span]:justify-between",
                isSelected
                  ? "!bg-sky-50 !text-[#1A86E8] !font-bold hover:!bg-sky-50"
                  : isHighlighted
                  ? "!bg-slate-50 !text-slate-900 !font-medium"
                  : "!text-slate-700 hover:!bg-slate-50 hover:!text-slate-900 !font-medium"
              )}
            >
              <span className="truncate">{opt.label}</span>
              {isSelected && (
                <Check className="h-4 w-4 text-[#1A86E8] shrink-0 ml-2 stroke-[2.5]" />
              )}
            </Button>
          );
        })}
      </div>
    </Card>
  );
}
