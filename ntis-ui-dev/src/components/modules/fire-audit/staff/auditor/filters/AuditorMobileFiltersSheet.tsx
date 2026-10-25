/**
 * Auditor Mobile Filters Sheet
 * Path: src/components/modules/fire-audit/staff/auditor/filters/AuditorMobileFiltersSheet.tsx
 *
 * Mobile filters drawer using common Drawer primitive.
 * Handles accessibility (focus trap, Esc to close, aria-expanded, keyboard navigation).
 * Line ceiling: <= 300 lines.
 */

import { Search, RotateCcw, X } from "lucide-react";
import { Button, Drawer } from "@/components/common";
import type { AuditorFiltersBarState } from "./useAuditorFiltersBarState";
import { AuditorFilterField } from "./AuditorFilterField";

export interface AuditorMobileFiltersSheetProps {
  state: AuditorFiltersBarState;
}

export function AuditorMobileFiltersSheet({
  state,
}: AuditorMobileFiltersSheetProps) {
  const {
    t,
    draftCount,
    isMobileSheetOpen,
    setIsMobileSheetOpen,
    openDropdownKey,
    setOpenDropdownKey,
    filterConfigs,
    handleApply,
    handleReset,
  } = state;

  return (
    <Drawer
      open={isMobileSheetOpen}
      onClose={() => {
        setIsMobileSheetOpen(false);
        setOpenDropdownKey(null);
      }}
      hideHeader
      footer={
        <Button
          variant="primary"
          size="md"
          onClick={handleApply}
          className="w-full !h-12 !bg-[#1A86E8] hover:!bg-[#1570c0] !text-white !rounded-2xl !font-bold !text-sm flex items-center justify-center shadow-md cursor-pointer active:scale-[0.99] transition-all !border-transparent"
        >
          <span className="inline-flex flex-row items-center justify-center gap-2 whitespace-nowrap">
            <Search className="h-4 w-4 shrink-0" />
            <span>
              {draftCount > 0
                ? t("showResultsCount", { count: draftCount })
                : t("showResults")}
            </span>
          </span>
        </Button>
      }
      className="sm:hidden !top-auto !bottom-0 !right-0 !left-0 !w-full !max-w-none !h-auto !max-h-[90vh] !rounded-t-[28px] !bg-white !shadow-2xl !animate-in !slide-in-from-bottom !duration-300"
      bodyClassName="px-4 pb-4 pt-1 overflow-y-auto max-h-[calc(90vh-140px)]"
    >
      <div className="relative flex flex-col">
        {/* Drag handle pill */}
        <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto my-2 shrink-0" />

        {/* Top Header Row: Filters Title (Left) + Reset All & Close (Right) */}
        <div className="flex items-center justify-between pb-3 pt-0.5 shrink-0">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {t("filters")}
          </h2>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="xs"
              onClick={handleReset}
              className="inline-flex items-center !text-sm !font-semibold !text-[#1A86E8] hover:underline cursor-pointer !bg-transparent hover:!bg-transparent !p-0 !h-auto"
            >
              <span className="inline-flex flex-row items-center gap-1.5 whitespace-nowrap">
                <RotateCcw className="h-3.5 w-3.5 shrink-0" />
                <span>{t("resetAll")}</span>
              </span>
            </Button>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => {
                setIsMobileSheetOpen(false);
                setOpenDropdownKey(null);
              }}
              className="!p-1 !h-auto !rounded-lg !text-slate-400 hover:!text-slate-600 transition cursor-pointer !bg-transparent hover:!bg-slate-100"
              aria-label={t("close")}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Backdrop for open dropdown popovers */}
        {openDropdownKey !== null && (
          <div
            className="fixed inset-0 z-30 cursor-default"
            onClick={() => setOpenDropdownKey(null)}
          />
        )}

        {/* 2-Column Responsive Filter Cards Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {filterConfigs.map((item, index) => (
            <AuditorFilterField
              key={item.key}
              item={item}
              variant="mobile"
              state={state}
              align={index % 2 === 0 ? "left" : "right"}
            />
          ))}
        </div>
      </div>
    </Drawer>
  );
}
