/**
 * Auditor Desktop Filters Toolbar
 * Path: src/components/modules/fire-audit/staff/auditor/filters/AuditorDesktopFilters.tsx
 *
 * Desktop compact single-row filter dropdowns and actions.
 * Line ceiling: <= 300 lines.
 */

import { Search, RotateCcw } from "lucide-react";
import { Button } from "@/components/common";
import { cn } from "@/lib/utils/cn";
import type { AuditorFiltersBarState } from "./useAuditorFiltersBarState";
import { AuditorFilterField } from "./AuditorFilterField";

export interface AuditorDesktopFiltersProps {
  state: AuditorFiltersBarState;
  className?: string;
}

export function AuditorDesktopFilters({
  state,
  className,
}: AuditorDesktopFiltersProps) {
  const {
    t,
    isDesktopExpanded,
    openDropdownKey,
    setOpenDropdownKey,
    filterConfigs,
    handleApply,
    handleReset,
  } = state;

  if (!isDesktopExpanded) return null;

  return (
    <div
      id="auditor-desktop-filters-panel"
      role="region"
      aria-label={t("filterButton")}
      className={cn("hidden sm:flex relative items-end gap-2 mt-2.5", className)}
    >
      {/* Backdrop to dismiss open desktop date calendar popover */}
      {openDropdownKey === "desktop-dateFilter" && (
        <div
          className="fixed inset-0 z-30 cursor-default"
          onClick={() => setOpenDropdownKey(null)}
        />
      )}

      {filterConfigs.map((item) => (
        <AuditorFilterField
          key={item.key}
          item={item}
          variant="desktop"
          state={state}
        />
      ))}

      {/* Inline Reset & Show Results Buttons */}
      <div className="flex items-center gap-1.5 shrink-0 z-10">
        <Button
          variant="secondary"
          size="xs"
          onClick={handleReset}
          className="!h-8 inline-flex items-center !rounded-xl !border !border-slate-200 !bg-white hover:!bg-slate-50 !text-slate-700 px-3 !text-xs !font-semibold transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
        >
          <span className="inline-flex flex-row items-center gap-1 whitespace-nowrap">
            <RotateCcw className="h-3 w-3 text-slate-500 shrink-0" />
            <span>{t("resetButton")}</span>
          </span>
        </Button>

        <Button
          variant="primary"
          size="xs"
          onClick={handleApply}
          className="!h-8 inline-flex items-center !rounded-xl !bg-[#1A86E8] hover:!bg-[#1570c0] !text-white px-3.5 !text-xs !font-semibold transition-colors cursor-pointer shadow-xs whitespace-nowrap !border-transparent"
        >
          <span className="inline-flex flex-row items-center gap-1.5 whitespace-nowrap">
            <Search className="h-3 w-3 shrink-0" />
            <span>{t("showResults")}</span>
          </span>
        </Button>
      </div>
    </div>
  );
}
