import type { useTranslations } from "next-intl";
import { Checkbox, Input, Label } from "@/components/common";
import type { SingleAssessmentForm } from "@/types/extended-area-assessment.types";

interface InclusionTaxBasisSectionProps {
  t: ReturnType<typeof useTranslations>;
  form: SingleAssessmentForm;
  setField: <K extends keyof SingleAssessmentForm>(key: K, value: SingleAssessmentForm[K]) => void;
  syncGeneralTax: (taxableValue: number, generalRate: number) => void;
  isTaxTotal: boolean;
  /** OC Date + basis checkbox are only shown for a property the rule was applied to earlier (not right after the first Apply). */
  showOcDate: boolean;
}

/** "Inclusion & Total Tax Basis" — the dates and figures the Section 129A schedule is staged
 *  from (ward-wide Area Inclusion Date, the property's own OC Date, Old GP tax, Municipal Total Tax
 *  at 100%, RV, rate), plus the "Which is More" rule explainer. The OC Date and its "use as the
 *  basis" checkbox only appear once the rule has already been applied for the property. */
export function InclusionTaxBasisSection({ t, form, setField, syncGeneralTax, isTaxTotal, showOcDate }: InclusionTaxBasisSectionProps) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="border-b border-dashed border-slate-200 pb-1.5 text-[11px] font-extrabold uppercase tracking-wide text-blue-700">
        {isTaxTotal ? t("section.inclusionTotalTaxBasis") : t("section.inclusionBasis")}
      </h3>
      <div className="grid grid-cols-2 items-end gap-2.5">
        <Input
          type="date"
          label={t("fields.inclusionDate")}
          disabled
          value={form.inclusionDate}
          onChange={(e) => setField("inclusionDate", e.target.value)}
        />
        {showOcDate && (
          <>
            <Input type="date" label={t("fields.ocDate")} disabled value={form.ocDate} onChange={() => undefined} />
            <div className="col-span-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="use-oc-date-basis"
                  checked={form.useOcDateBasis}
                  disabled={!form.ocDate && !form.useOcDateBasis}
                  onCheckedChange={(checked) => setField("useOcDateBasis", checked)}
                  className="border-slate-400 data-[state=checked]:border-slate-800 data-[state=checked]:bg-slate-800 data-[state=checked]:text-white"
                />
                <Label
                  htmlFor="use-oc-date-basis"
                  className="cursor-pointer text-sm font-semibold text-slate-800"
                >
                  {t("fields.useOcDateBasis")}
                </Label>
              </div>
              {!form.ocDate && <p className="mt-1 text-[11px] font-medium text-red-600">{t("fields.noOcDate")}</p>}
            </div>
          </>
        )}
        <Input
          type="number"
          label={isTaxTotal ? t("fields.oldTaxTotal") : t("fields.oldTax")}
          disabled
          value={form.oldTax}
          onChange={(e) => setField("oldTax", Number(e.target.value) || 0)}
        />
        <Input
          type="number"
          label={isTaxTotal ? t("fields.fullGeneralTotal") : t("fields.fullGeneral")}
          disabled
          value={form.fullGeneral}
          onChange={(e) => setField("fullGeneral", Number(e.target.value) || 0)}
        />
        <Input
          type="number"
          label={t("fields.taxableValue")}
          disabled
          value={form.taxableValue}
          onChange={(e) => syncGeneralTax(Number(e.target.value) || 0, form.generalRate)}
        />
        <Input
          type="number"
          step="0.01"
          label={t("fields.generalRate")}
          disabled
          value={form.generalRate}
          onChange={(e) => syncGeneralTax(form.taxableValue, Number(e.target.value) || 0)}
        />
      </div>
      <div className="flex items-center justify-between gap-2 rounded-lg border border-cyan-200 bg-cyan-50 p-2.5 text-xs">
        <div>
          <p className="font-bold text-slate-800">{t("whichIsMoreRule.title")}</p>
          <p className="mt-0.5 text-slate-600">
            {isTaxTotal ? t("whichIsMoreRule.descriptionTotalTax") : t("whichIsMoreRule.description")}
          </p>
        </div>
        <span className="whitespace-nowrap rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-700">
          {t("whichIsMoreRule.badge")}
        </span>
      </div>
    </div>
  );
}
