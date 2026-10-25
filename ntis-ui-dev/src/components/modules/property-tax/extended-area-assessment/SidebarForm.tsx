import type { useTranslations } from "next-intl";
import { SaveButton, CancelButton } from "@/components/common";
import type { SelectOption } from "@/types/extended-area-assessment.types";
import type { UseSingleAssessment } from "@/hooks/extendedAreaAssessment/useSingleAssessment";
import type { UseCascadingPropertyFilters } from "@/hooks/extendedAreaAssessment/useCascadingPropertyFilters";
import { PropertyIdentificationSection } from "./PropertyIdentificationSection";
import { InclusionTaxBasisSection } from "./InclusionTaxBasisSection";
import { PropertyChangeCheckSection } from "./PropertyChangeCheckSection";

interface SidebarFormProps {
  t: ReturnType<typeof useTranslations>;
  assessment: UseSingleAssessment;
  filters: UseCascadingPropertyFilters;
  usageTypeOptions: SelectOption[];
  isTaxTotal: boolean;
  /** Live-measured height (px) of the right column (KPI cards + timeline + schedule table) —
   *  `null` until the first measurement lands (SSR/first paint), during which a CSS-only viewport
   *  cap is used instead so the panel isn't unbounded for that first render. */
  matchHeight: number | null;
}

/** The left-hand editable form panel: property identification, tax basis, property-change check,
 *  and the Recalculate/Reset actions. Composes the three section sub-components. */
export function SidebarForm({ t, assessment, filters, usageTypeOptions, isTaxTotal, matchHeight }: SidebarFormProps) {
  const {
    form,
    propertyId,
    setField,
    syncGeneralTax,
    toggleChangeField,
    changed,
    showOcDate,
    isSearching,
    isSaving,
    handleSearch,
    handleSearchAny,
    handleReset,
    handleSave,
    handleRecalculate,
  } = assessment;

  // `handleReset` (from the search hook) clears the search form/result + the upic/oldGpNo/wardId/
  // propertyNo/partitionNo URL params, but the Ward/Property No/Partition No dropdowns keep their
  // own local selection state (`filters`), which the URL change alone doesn't clear — reset both
  // together so neither the typed search fields nor the cascading dropdowns are left stale.
  const handleFullReset = () => {
    handleReset();
    filters.resetFilters();
  };

  return (
    <div
      className="flex min-h-0 flex-col rounded-lg border border-slate-200 bg-white lg:sticky lg:top-28 lg:min-h-0 lg:max-h-[calc(100vh-11rem)] print:hidden"
      style={matchHeight != null ? { height: matchHeight, maxHeight: matchHeight } : undefined}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
        <h2 className="text-sm font-bold text-[#0b2545]">{t("card.title")}</h2>
        <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" aria-hidden="true" />
          {t("card.editable")}
        </span>
      </div>

      <div className="flex flex-col gap-4 overflow-y-auto p-4 lg:min-h-0 lg:flex-1">
        <PropertyIdentificationSection
          t={t}
          form={form}
          setField={setField}
          usageTypeOptions={usageTypeOptions}
          isSearching={isSearching}
          onSearch={(value, field) => void handleSearch(value, field)}
          onSearchAny={() => void handleSearchAny()}
          filters={filters}
          searchLocked={!!propertyId}
          onReset={handleFullReset}
        />

        <InclusionTaxBasisSection
          t={t}
          form={form}
          setField={setField}
          syncGeneralTax={syncGeneralTax}
          isTaxTotal={isTaxTotal}
          showOcDate={showOcDate}
        />

        <PropertyChangeCheckSection
          t={t}
          form={form}
          setField={setField}
          toggleChangeField={toggleChangeField}
          changed={changed}
          isTaxTotal={isTaxTotal}
        />

        <div className="flex flex-col gap-2 border-t border-slate-200 pt-3">
          <SaveButton
            label={isSaving ? t("actions.recalculating") : t("actions.recalculate")}
            className="w-full justify-center"
            disabled={isSaving}
            onClick={() => void (form.caseStatus === "Calculated" ? handleRecalculate() : handleSave())}
          />
          <CancelButton label={t("actions.reset")} className="w-full justify-center" onClick={handleFullReset} />
        </div>
      </div>
    </div>
  );
}
