"use client";

import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { useSingleAssessment } from "@/hooks/extendedAreaAssessment/useSingleAssessment";
import { useCascadingPropertyFilters } from "@/hooks/extendedAreaAssessment/useCascadingPropertyFilters";
import { useMatchHeight } from "@/hooks/extendedAreaAssessment/useMatchHeight";
import type {
  Section129ActionResult,
  WardDropdownOption,
  WardPropertyOptionDto,
} from "@/app/[locale]/property-tax/extended-area-assesment/single-assessment/action";
import type { SelectOption } from "@/types/extended-area-assessment.types";
import { SidebarForm } from "./SidebarForm";
import { KpiCards } from "./KpiCards";
import { StageTimeline } from "./StageTimeline";
import { ScheduleTableSection } from "./ScheduleTableSection";
import { Section129PdfPreviewModal } from "./components/Section129PdfPreviewModal";

interface SingleAssessmentScreenProps {
  initialUpic?: string;
  initialOldGpNo?: string;
  initialWardId?: string;
  /** The resolved property's id (as a string) — binds the combined Property No dropdown. */
  initialPropertyId?: string;
  initialSearchResult?: Section129ActionResult | null;
  /** SSR-fetched current finance year (CORE.YearMaster.IsActive=1) — a ULB-wide constant, shown before any property is searched. */
  initialCurrentFinancialYear?: string | null;
  /** SSR-fetched PTIS.TypeOfUseGroupMaster options (PageSize=-1, IsActive=true) for the Usage Type dropdown. */
  usageTypeOptions?: SelectOption[];
  /** SSR-fetched Ward options from /api/Ward. */
  initialWards?: WardDropdownOption[];
  /** SSR-fetched property + partition options for the initial Ward (combined "Property No" dropdown). */
  initialWardProperties?: WardPropertyOptionDto[];
}

export function SingleAssessmentScreen({
  initialUpic = "",
  initialOldGpNo = "",
  initialWardId = "",
  initialPropertyId = "",
  initialSearchResult = null,
  initialCurrentFinancialYear = null,
  usageTypeOptions = [],
  initialWards = [],
  initialWardProperties = [],
}: SingleAssessmentScreenProps) {
  const t = useTranslations("extendedAreaAssessment.single");

  const assessment = useSingleAssessment({
    initialUpic,
    initialOldGpNo,
    initialSearchResult,
    initialCurrentFinancialYear,
  });
  const { form, result, setField, handleExportCsv, handlePrint, pdfPreviewUrl, closePdfPreview, isSearching, isSaving } = assessment;

  const filters = useCascadingPropertyFilters({
    t,
    initialWardId,
    initialPropertyId,
    initialWards,
    initialWardProperties,
    onPropertyResolved: (upic) => setField("upic", upic),
  });

  // Tolerant of spacing/case so a config-saved "TaxTotal" (no space) still matches "Tax Total" —
  // the backend now normalizes this before sending it, but comparing loosely here too means the
  // KPI/label split can't silently regress to General Tax mode again from a future spelling drift.
  const isTaxTotal = result.baseTaxCode?.replace(/\s+/g, "").toLowerCase() === "taxtotal";

  // Measures the right column's actual rendered height (KPI cards + timeline + schedule table)
  // so the left form panel can be capped to exactly that height and scroll internally, instead of
  // stretching taller than the table side — CSS-only intrinsic-sizing tricks (grid items-stretch)
  // don't reliably match a sibling that has its own internal overflow:auto scroll region.
  const { ref: rightColumnRef, height: rightColumnHeight } = useMatchHeight<HTMLDivElement>();

  return (
    <div className="relative space-y-3">

        {/* Shown while the UPIC/Old GP Number search or an Apply/Recalculate request is in flight —
            `fixed inset-0` (not `absolute`) and a z-index above the shared app header's z-[100] so
            it covers the whole viewport, including the "Section 129A Assessment" title/tabs that
            live in this route's layout.tsx above this component, not just this screen's own content. */}
        {(isSearching || isSaving) && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-white/70 print:hidden">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-sm font-semibold text-[#0b2545]">{t("loading.message")}</p>
            </div>
          </div>
        )}

        {/* Print-only header — mirrors the property identity normally shown in the sidebar form,
            which is hidden on print (see below) so only the KPI cards, timeline, and schedule table print. */}
        <div className="hidden print:block">
          <h1 className="text-lg font-extrabold text-[#0b2545]">{t("printHeaderTitle")}</h1>
          <p className="text-xs text-slate-600">
            {form.upic} — {form.ownerName} — {form.address}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[380px_1fr] lg:items-start print:!grid-cols-1">
          <SidebarForm
            t={t}
            assessment={assessment}
            filters={filters}
            usageTypeOptions={usageTypeOptions}
            isTaxTotal={isTaxTotal}
            matchHeight={rightColumnHeight}
          />

          {/* ================= Right: stat cards, timeline, schedule ================= */}
          <div ref={rightColumnRef} className="flex flex-col gap-3">
            <KpiCards t={t} result={result} isTaxTotal={isTaxTotal} />
            <StageTimeline t={t} result={result} />
            <ScheduleTableSection
              t={t}
              result={result}
              isTaxTotal={isTaxTotal}
              onExportCsv={() => void handleExportCsv()}
              onPrint={() => void handlePrint()}
            />
          </div>
        </div>

      {/* Scoped to this page only (styled-jsx injects/removes this <style> with the component's
          mount lifecycle) — hides the shared app header/sidebar chrome on print without touching
          Header.tsx/SidebarFrame.tsx/MainLayout.tsx/globals.css, so no other screen's print
          behavior changes. */}
      <style jsx global>{`
        @media print {
          header[class*="z-[100]"],
          #mobile-sidebar,
          .sidebar-mobile-toggle {
            display: none !important;
          }
          main.layout-content-shifted {
            margin-left: 0 !important;
            padding-top: 0 !important;
          }
          /* MasterTable's body wraps in a fixed-height, overflow-auto scroll container (via its
             height="sm" prop) so only the currently-scrolled rows are in the print viewport —
             override it here so every row renders, letting the page itself paginate instead. */
          .schedule-print-table .overflow-auto {
            overflow: visible !important;
            max-height: none !important;
          }
        }
      `}</style>

      <Section129PdfPreviewModal
        isOpen={!!pdfPreviewUrl}
        onClose={closePdfPreview}
        fileUrl={pdfPreviewUrl ?? ""}
        fileName="Section_129A_General_Tax_Schedule.pdf"
        label={t("printHeaderTitle")}
      />
    </div>
  );
}
