import type { useTranslations } from "next-intl";
import { Select, Input, TextArea } from "@/components/common";
import type { SingleAssessmentForm, YesNo } from "@/types/extended-area-assessment.types";

interface PropertyChangeCheckSectionProps {
  t: ReturnType<typeof useTranslations>;
  form: SingleAssessmentForm;
  setField: <K extends keyof SingleAssessmentForm>(key: K, value: SingleAssessmentForm[K]) => void;
  toggleChangeField: (field: "areaChanged" | "useChanged" | "otherChanged", value: YesNo) => void;
  changed: boolean;
  isTaxTotal: boolean;
}

/** "Property Change Check" — Area/Use/Other-Structural change flags that disqualify Section 129A
 *  relief (forcing full/100% tax) when any is set to Yes, plus the change details/effective date. */
export function PropertyChangeCheckSection({ t, form, setField, toggleChangeField, changed, isTaxTotal }: PropertyChangeCheckSectionProps) {
  const yesNoOptions = [
    { label: t("options.no"), value: "no" },
    { label: t("options.yes"), value: "yes" },
  ];

  return (
    <div className="flex flex-col gap-2">
      <h3 className="border-b border-dashed border-slate-200 pb-1.5 text-[11px] font-extrabold uppercase tracking-wide text-blue-700">
        {t("section.propertyChangeCheck")}
      </h3>
      <p className="text-[11px] text-slate-500">{t("section.propertyChangeCheckHint")}</p>
      <div className="grid grid-cols-2 items-end gap-2.5">
        <Select
          label={t("fields.areaChanged")}
          options={yesNoOptions}
          value={form.areaChanged}
          onChange={(_e, v) => toggleChangeField("areaChanged", v as YesNo)}
        />
        <Select
          label={t("fields.useChanged")}
          options={yesNoOptions}
          value={form.useChanged}
          onChange={(_e, v) => toggleChangeField("useChanged", v as YesNo)}
        />
        <Select
          label={t("fields.otherChanged")}
          options={yesNoOptions}
          value={form.otherChanged}
          onChange={(_e, v) => toggleChangeField("otherChanged", v as YesNo)}
        />
        <Input
          type="date"
          label={t("fields.changeDate")}
          disabled={!changed}
          required={changed}
          value={form.changeDate}
          onChange={(e) => setField("changeDate", e.target.value)}
        />
        <div className="col-span-2">
          <TextArea
            label={t("fields.changeDetails")}
            placeholder={t("fields.changeDetailsPlaceholder")}
            rows={2}
            disabled={!changed}
            required={changed}
            value={form.changeDetails}
            onChange={(e) => setField("changeDetails", e.target.value.replace(/[^a-zA-Z0-9,.\-/\s]/g, ""))}
          />
        </div>
      </div>
      <div
        className={`rounded-lg border p-2.5 text-xs font-semibold ${
          changed ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"
        }`}
      >
        {changed
          ? isTaxTotal
            ? t("ruleMessage.notApplicableTotalTax")
            : t("ruleMessage.notApplicable")
          : t("ruleMessage.applicable")}
      </div>
    </div>
  );
}
