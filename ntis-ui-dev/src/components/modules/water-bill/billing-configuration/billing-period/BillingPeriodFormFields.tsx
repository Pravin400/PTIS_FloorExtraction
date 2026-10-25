import { useTranslations } from "next-intl";
import { Input, Select, Label, DateInput, ValidationMessage } from "@/components/common";
import type {
  BillingPeriodInput,
  BillingPeriodMaster,
  DropdownOption,
} from "@/types/water-bill/billing-configuration/billingPeriodMaster.types";
import {
  useBillingPeriodFormFields,
} from "@/hooks/water-bill/billing-configuration/billing-period-master/useBillingPeriodFormFields";
import { BillingPeriodPenaltyFields } from "./BillingPeriodPenaltyFields";
import { BillingPeriodStatusBanners } from "./BillingPeriodStatusBanners";

interface BillingPeriodFormFieldsProps {
  formData: BillingPeriodInput;
  errors: Partial<Record<keyof BillingPeriodInput, string>>;
  showError: (field: keyof BillingPeriodInput) => boolean;
  handleChange: (field: keyof BillingPeriodInput, value: string | number | boolean) => void;
  handleUpdate: (updates: Partial<BillingPeriodInput>) => void;
  handleBlur: (field: keyof BillingPeriodInput) => void;
  handleFocus?: (field: keyof BillingPeriodInput) => void;
  financialYearOptions: DropdownOption[];
  billingFrequencyOptions: DropdownOption[];
  existingPeriods?: BillingPeriodMaster[];
  isSubmitting?: boolean;
  isEdit?: boolean;
}

export function BillingPeriodFormFields({
  formData,
  errors,
  showError,
  handleChange,
  handleUpdate,
  handleBlur,
  handleFocus,
  financialYearOptions,
  billingFrequencyOptions,
  existingPeriods = [],
  isSubmitting = false,
  isEdit = false,
}: BillingPeriodFormFieldsProps) {
  const t = useTranslations("billingPeriodMaster");

  const {
    handleYearChange,
    handleFrequencyChange,
    handlePeriodFromChange,
    handlePeriodToChange,
    handleDueDateChange,
    handleGraceDaysChange,
    handleCurrentPenaltyStartChange,
    handleCurrentPenaltyEndChange,
    handlePendingPenaltyStartChange,
    handlePendingPenaltyEndChange,
    existingCount,
    periodsPerYear,
    isMaxLimitReached,
  } = useBillingPeriodFormFields({
    formData,
    financialYearOptions,
    billingFrequencyOptions,
    existingPeriods,
    isEdit,
    handleChange,
    handleUpdate,
  });

  const err = (field: keyof BillingPeriodInput) =>
    showError(field) ? "!border-red-500 focus:!ring-red-500" : "";

  return (
    <>
      <BillingPeriodStatusBanners
        isEdit={isEdit}
        isActive={Boolean(formData.isActive)}
        isSubmitting={isSubmitting}
        isMaxLimitReached={isMaxLimitReached}
        periodsPerYear={periodsPerYear}
        existingCount={existingCount}
        financialYearId={formData.financialYearId}
        t={t}
        onActiveChange={(val) => handleChange("isActive", val)}
      />

      <div className="space-y-4">
        {/* Section 1: Cycle Configuration & Period Slot */}
        <div className="rounded-xl border border-slate-200/80 bg-linear-to-b from-slate-50/50 via-white to-white p-4 shadow-2xs space-y-3.5">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-600 ring-2 ring-blue-100" />
            <span className="text-xs font-semibold text-slate-800 uppercase tracking-wide">
              {t("table.financialYear")} &amp; {t("table.billingFrequency")}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 items-start">
            {/* Financial Year */}
            <div className="space-y-1" onFocus={() => handleFocus?.("financialYearId")}>
              <Label required>{t("form.financialYear.label")}</Label>
              <Select
                options={financialYearOptions}
                value={formData.financialYearId ? String(formData.financialYearId) : ""}
                onChange={(e) => handleYearChange(e.target.value)}
                onBlur={() => handleBlur("financialYearId")}
                placeholder={t("form.financialYear.placeholder")}
                className={err("financialYearId")}
              />
              <ValidationMessage
                message={errors.financialYearId}
                visible={showError("financialYearId")}
              />
            </div>

            {/* Billing Frequency */}
            <div className="space-y-1" onFocus={() => handleFocus?.("billingFrequencyId")}>
              <Label required>{t("form.billingFrequency.label")}</Label>
              <Select
                options={billingFrequencyOptions}
                value={formData.billingFrequencyId ? String(formData.billingFrequencyId) : ""}
                onChange={(e) => handleFrequencyChange(e.target.value)}
                onBlur={() => handleBlur("billingFrequencyId")}
                placeholder={t("form.billingFrequency.placeholder")}
                className={err("billingFrequencyId")}
              />
              <ValidationMessage
                message={errors.billingFrequencyId}
                visible={showError("billingFrequencyId")}
              />
            </div>

            {/* Period From */}
            <div className="space-y-1">
              <DateInput
                required
                disableManualEntry
                label={t("form.periodFrom.label")}
                value={formData.periodFromDate}
                onValueChange={handlePeriodFromChange}
                onFocus={() => handleFocus?.("periodFromDate")}
                onBlur={() => handleBlur("periodFromDate")}
                className={err("periodFromDate")}
              />
              <ValidationMessage
                message={errors.periodFromDate}
                visible={showError("periodFromDate")}
              />
            </div>

            {/* Period To */}
            <div className="space-y-1">
              <DateInput
                required
                disableManualEntry
                label={t("form.periodTo.label")}
                value={formData.periodToDate}
                onValueChange={handlePeriodToChange}
                onFocus={() => handleFocus?.("periodToDate")}
                onBlur={() => handleBlur("periodToDate")}
                className={err("periodToDate")}
              />
              <ValidationMessage message={errors.periodToDate} visible={showError("periodToDate")} />
            </div>
          </div>
        </div>

        {/* Section 2: Bill Generation, Due Date & Grace Days */}
        <div className="rounded-xl border border-slate-200/80 bg-linear-to-b from-slate-50/50 via-white to-white p-4 shadow-2xs space-y-3.5">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-indigo-500 ring-2 ring-indigo-100" />
            <span className="text-xs font-semibold text-slate-800 uppercase tracking-wide">
              {t("table.billGenerationDate")}, {t("table.dueDate")} &amp; {t("table.graceDays")}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-start">
            {/* Bill Generation Date */}
            <div className="space-y-1 md:col-span-5">
              <DateInput
                disableManualEntry
                label={t("form.billGenerationDate.label")}
                value={formData.billGenerationDate}
                onValueChange={(val) => handleChange("billGenerationDate", val)}
                onFocus={() => handleFocus?.("billGenerationDate")}
                onBlur={() => handleBlur("billGenerationDate")}
                className={err("billGenerationDate")}
              />
              <ValidationMessage
                message={errors.billGenerationDate}
                visible={showError("billGenerationDate")}
              />
            </div>

            {/* Due Date */}
            <div className="space-y-1 md:col-span-5">
              <DateInput
                required
                disableManualEntry
                label={t("form.dueDate.label")}
                value={formData.dueDate}
                onValueChange={handleDueDateChange}
                onFocus={() => handleFocus?.("dueDate")}
                onBlur={() => handleBlur("dueDate")}
                className={err("dueDate")}
              />
              <ValidationMessage message={errors.dueDate} visible={showError("dueDate")} />
            </div>

            {/* Grace Days: Compact width for digits only */}
            <div className="space-y-1 md:col-span-2">
              <Input
                required
                type="number"
                min={0}
                step={1}
                label={t("form.graceDays.label")}
                placeholder={t("form.graceDays.placeholder")}
                value={formData.graceDays}
                onKeyDown={(e) => {
                  if (["e", "E", "+", "-", "."].includes(e.key)) {
                    e.preventDefault();
                  }
                }}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  handleGraceDaysChange(e.target.value);
                }}
                onBlur={() => handleBlur("graceDays")}
                className={`text-center font-medium ${err("graceDays")}`}
              />
              <ValidationMessage message={errors.graceDays} visible={showError("graceDays")} />
            </div>
          </div>
        </div>

        {/* Section 3: Penalty Application Windows */}
        <BillingPeriodPenaltyFields
          formData={formData}
          showError={showError}
          errors={errors}
          err={err}
          handleBlur={handleBlur}
          handleChange={handleChange}
          handleCurrentPenaltyStartChange={handleCurrentPenaltyStartChange}
          handleCurrentPenaltyEndChange={handleCurrentPenaltyEndChange}
          handlePendingPenaltyStartChange={handlePendingPenaltyStartChange}
          handlePendingPenaltyEndChange={handlePendingPenaltyEndChange}
        />
      </div>
    </>
  );
}
