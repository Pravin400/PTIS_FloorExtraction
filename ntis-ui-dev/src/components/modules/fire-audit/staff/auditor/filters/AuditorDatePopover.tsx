/**
 * Auditor Date Popover Component
 * Path: src/components/modules/fire-audit/staff/auditor/filters/AuditorDatePopover.tsx
 *
 * Popover containing date quick presets and the Calendar picker.
 */

import { Button, Calendar as CalendarPicker } from "@/components/common";
import { cn } from "@/lib/utils/cn";
import { calendarClassNames } from "./auditorFilters.config";

interface AuditorDatePopoverProps {
  currentValue: string;
  quickPresets: Array<{ label: string; value: string }>;
  selectedDate?: Date;
  onPresetSelect: (value: string) => void;
  onDateSelect: (date?: Date) => void;
  align?: "left" | "right";
  isMobile?: boolean;
}

export function AuditorDatePopover({
  currentValue,
  quickPresets,
  selectedDate,
  onPresetSelect,
  onDateSelect,
  align = "right",
  isMobile = false,
}: AuditorDatePopoverProps) {
  return (
    <div
      className={cn(
        "absolute z-50 rounded-2xl border border-slate-200/90 bg-white p-3 shadow-xl shadow-slate-900/10 animate-in fade-in-0 zoom-in-95",
        isMobile
          ? cn(
              "top-[calc(100%+6px)] w-[min(325px,calc(100vw-32px))] duration-150",
              align === "right" ? "right-0" : "left-0"
            )
          : cn(
              "top-[calc(100%+4px)] w-[325px] duration-100",
              align === "left" ? "left-0" : "right-0"
            )
      )}
    >
      {/* Quick Preset Pills */}
      <div
        className={cn(
          "flex items-center justify-between border-b border-slate-100 overflow-x-auto no-scrollbar",
          isMobile ? "gap-1 pb-2 mb-2" : "gap-1.5 pb-2.5 mb-1"
        )}
      >
        {quickPresets.map((preset) => {
          const isPresetActive = (currentValue || "") === preset.value;
          return (
            <Button
              key={preset.value}
              variant={isPresetActive ? "primary" : "secondary"}
              size="xs"
              onClick={() => onPresetSelect(preset.value)}
              className={cn(
                "!rounded-full !font-semibold transition-all whitespace-nowrap cursor-pointer shrink-0 text-center !h-auto !border-0",
                isMobile ? "!px-2 !py-1 !text-[10px]" : "!px-2.5 !py-1 !text-[11px]",
                isPresetActive
                  ? "!bg-[#1A86E8] !text-white shadow-xs"
                  : isMobile
                  ? "!bg-slate-100 hover:!bg-slate-200 !text-slate-700"
                  : "!bg-slate-100 hover:!bg-slate-200/80 !text-slate-700"
              )}
            >
              {preset.label}
            </Button>
          );
        })}
      </div>

      {/* Common Calendar Component */}
      <div className="flex justify-center select-none pt-1">
        <CalendarPicker
          mode="single"
          selected={selectedDate}
          onSelect={onDateSelect}
          className="p-0 w-full"
          classNames={calendarClassNames}
        />
      </div>
    </div>
  );
}
