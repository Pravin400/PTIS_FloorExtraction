/**
 * Shared Auditor Filter Field Component
 * Path: src/components/modules/fire-audit/staff/auditor/filters/AuditorFilterField.tsx
 *
 * Uses common Select primitive from @/components/common for standard filters.
 * Accessible date filter popover with Calendar component.
 * Line ceiling: <= 300 lines.
 */

import { ChevronDown } from "lucide-react";
import { Card, Select, Button } from "@/components/common";
import { cn } from "@/lib/utils/cn";
import type { FilterFieldConfig } from "@/types/fire-audit/auditor.types";
import type { AuditorFiltersBarState } from "./useAuditorFiltersBarState";
import { AuditorDatePopover } from "./AuditorDatePopover";
import { AuditorFilterDropdown } from "./AuditorFilterDropdown";

export interface AuditorFilterFieldProps {
  item: FilterFieldConfig;
  variant: "desktop" | "mobile";
  state: AuditorFiltersBarState;
  align?: "left" | "right";
}

export function AuditorFilterField({
  item,
  variant,
  state,
  align,
}: AuditorFilterFieldProps) {
  const {
    draftFilters,
    openDropdownKey,
    setOpenDropdownKey,
    dateQuickPresets,
    selectedCalendarDate,
    getSelectedOption,
    handleSelectOption,
    handleCalendarDateSelect,
  } = state;

  const dropdownKey = `${variant}-${item.key}`;
  const isOpen = openDropdownKey === dropdownKey;
  const isDate = item.key === "dateFilter";
  const selectedOption = getSelectedOption(item);
  const Icon = item.icon;

  const toggleOpen = () => {
    setOpenDropdownKey(isOpen ? null : dropdownKey);
  };

  if (variant === "desktop") {
    if (isDate) {
      return (
        <div
          className={cn(
            "flex-1 min-w-0 flex flex-col gap-1 relative",
            isOpen ? "z-40" : "z-10"
          )}
        >
          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 truncate">
            <Icon className={cn("h-3 w-3 shrink-0", item.iconColor)} />
            <span className="truncate">{item.label}</span>
          </div>
          <div className="relative">
            <Button
              variant="secondary"
              size="xs"
              onClick={toggleOpen}
              aria-haspopup="dialog"
              aria-expanded={isOpen}
              className={cn(
                "!h-8 w-full !rounded-xl !border !bg-slate-50/70 !pl-2 !pr-5 !text-[11px] !font-medium !text-slate-700 !text-left cursor-pointer truncate !flex !items-center !justify-start transition-colors [&>span]:truncate [&>span]:w-full",
                isOpen
                  ? "!border-[#1A86E8] ring-1 ring-[#1A86E8] !bg-white"
                  : "!border-slate-200 hover:!border-slate-300"
              )}
            >
              <span className="truncate">{selectedOption.label}</span>
              <ChevronDown
                className={cn(
                  "pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400 transition-transform",
                  isOpen ? "rotate-180 text-[#1A86E8]" : ""
                )}
              />
            </Button>

            {isOpen && (
              <AuditorDatePopover
                currentValue={draftFilters.dateFilter}
                quickPresets={dateQuickPresets}
                selectedDate={selectedCalendarDate}
                onPresetSelect={(val) => handleSelectOption("dateFilter", val)}
                onDateSelect={handleCalendarDateSelect}
              />
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 truncate">
          <Icon className={cn("h-3 w-3 shrink-0", item.iconColor)} />
          <span className="truncate">{item.label}</span>
        </div>
        <Select
          options={item.options}
          value={draftFilters[item.key]}
          onChange={(_e, val) => handleSelectOption(item.key, val)}
          ariaLabel={selectedOption.label}
          selectSize="sm"
          className="text-[11px]"
        />
      </div>
    );
  }

  // Mobile Variant: Date Filter
  if (isDate) {
    return (
      <Card
        padding="none"
        className={cn(
          "relative rounded-2xl border bg-white p-2.5 transition-all shadow-2xs",
          isOpen
            ? "border-2 border-sky-400 ring-2 ring-sky-100 z-40"
            : draftFilters.dateFilter
            ? "border-[#1A86E8]/70 ring-1 ring-sky-100 z-10"
            : "border-slate-200/90 hover:border-slate-300 z-10"
        )}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleOpen}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          className="w-full !p-0 !h-auto !bg-transparent hover:!bg-transparent text-left !flex !items-center !justify-start cursor-pointer focus:outline-none [&>span]:w-full [&>span]:flex [&>span]:items-center [&>span]:gap-2"
        >
          <div
            className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
              item.iconBg,
              item.iconColor
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium text-slate-500 leading-tight truncate">
              {item.label}
            </p>
            <p className="text-xs font-bold text-slate-800 leading-tight truncate mt-0.5">
              {selectedOption.label}
            </p>
          </div>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 shrink-0 self-center transition-transform duration-200",
              isOpen ? "rotate-180 text-[#1A86E8]" : "text-slate-400"
            )}
          />
        </Button>

        {isOpen && (
          <AuditorDatePopover
            currentValue={draftFilters.dateFilter}
            quickPresets={dateQuickPresets}
            selectedDate={selectedCalendarDate}
            onPresetSelect={(val) => handleSelectOption("dateFilter", val)}
            onDateSelect={handleCalendarDateSelect}
            align={align}
            isMobile
          />
        )}
      </Card>
    );
  }

  // Mobile Variant: Non-Date Filter Card
  return (
    <Card
      padding="none"
      className={cn(
        "relative rounded-2xl border bg-white p-2.5 transition-all shadow-2xs",
        isOpen
          ? "border-2 border-sky-400 ring-2 ring-sky-100 z-40"
          : draftFilters[item.key]
          ? "border-[#1A86E8]/70 ring-1 ring-sky-100 z-10"
          : "border-slate-200/90 hover:border-slate-300 z-10"
      )}
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleOpen}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? `${dropdownKey}-listbox` : undefined}
        className="w-full !p-0 !h-auto !bg-transparent hover:!bg-transparent text-left !flex !items-center !justify-start cursor-pointer focus:outline-none [&>span]:w-full [&>span]:flex [&>span]:items-center [&>span]:gap-2"
      >
        <div
          className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
            item.iconBg,
            item.iconColor
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-medium text-slate-500 leading-tight truncate">
            {item.label}
          </p>
          <p className="text-xs font-bold text-slate-800 leading-tight truncate mt-0.5">
            {selectedOption.label}
          </p>
        </div>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 self-center transition-transform duration-200",
            isOpen ? "rotate-180 text-[#1A86E8]" : "text-slate-400"
          )}
        />
      </Button>

      {isOpen && (
        <AuditorFilterDropdown
          id={`${dropdownKey}-listbox`}
          options={item.options}
          selectedValue={draftFilters[item.key] || ""}
          onSelect={(val) => {
            handleSelectOption(item.key, val);
            setOpenDropdownKey(null);
          }}
          onClose={() => setOpenDropdownKey(null)}
          align={align}
        />
      )}
    </Card>
  );
}
