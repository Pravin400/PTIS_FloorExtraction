import { useTranslations } from "next-intl";
import { DateInput, ValidationMessage } from "@/components/common";
import type { BillingPeriodInput } from "@/types/water-bill/billing-configuration/billingPeriodMaster.types";

interface BillingPeriodPenaltyFieldsProps {
  formData: BillingPeriodInput;
  showError: (field: keyof BillingPeriodInput) => boolean;
  errors: Partial<Record<keyof BillingPeriodInput, string>>;
  err: (field: keyof BillingPeriodInput) => string;
  handleBlur: (field: keyof BillingPeriodInput) => void;
  handleChange: (field: keyof BillingPeriodInput, value: string | number | boolean) => void;
  handleCurrentPenaltyStartChange: (val: string) => void;
  handleCurrentPenaltyEndChange: (val: string) => void;
  handlePendingPenaltyStartChange: (val: string) => void;
  handlePendingPenaltyEndChange?: (val: string) => void;
}

export function BillingPeriodPenaltyFields({
  formData,
  showError,
  errors,
  err,
  handleBlur,
  handleChange,
  handleCurrentPenaltyStartChange,
  handleCurrentPenaltyEndChange,
  handlePendingPenaltyStartChange,
  handlePendingPenaltyEndChange,
}: BillingPeriodPenaltyFieldsProps) {
  const t = useTranslations("billingPeriodMaster");

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Current Penalty Card */}
      <div className="rounded-xl border border-amber-200/80 bg-linear-to-b from-amber-50/50 via-white to-white p-4 shadow-2xs space-y-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-amber-500 ring-2 ring-amber-100" />
          <span className="text-xs font-semibold text-amber-900 uppercase tracking-wide">
            {t("table.currentPenalty")}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
          <div className="space-y-1">
            <DateInput
              disableManualEntry
              label={t("table.currentPenaltyStartDate")}
              value={formData.currentPenaltyStartDate}
              onValueChange={handleCurrentPenaltyStartChange}
              onBlur={() => handleBlur("currentPenaltyStartDate")}
              className={err("currentPenaltyStartDate")}
            />
            <ValidationMessage
              message={errors.currentPenaltyStartDate}
              visible={showError("currentPenaltyStartDate")}
            />
          </div>

          <div className="space-y-1">
            <DateInput
              disableManualEntry
              label={t("table.currentPenaltyEndDate")}
              value={formData.currentPenaltyEndDate}
              onValueChange={handleCurrentPenaltyEndChange}
              onBlur={() => handleBlur("currentPenaltyEndDate")}
              className={err("currentPenaltyEndDate")}
            />
            <ValidationMessage
              message={errors.currentPenaltyEndDate}
              visible={showError("currentPenaltyEndDate")}
            />
          </div>
        </div>
      </div>

      {/* Pending Penalty Card */}
      <div className="rounded-xl border border-purple-200/80 bg-linear-to-b from-purple-50/50 via-white to-white p-4 shadow-2xs space-y-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-purple-500 ring-2 ring-purple-100" />
          <span className="text-xs font-semibold text-purple-900 uppercase tracking-wide">
            {t("table.pendingPenalty")}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
          <div className="space-y-1">
            <DateInput
              disableManualEntry
              label={t("table.pendingPenaltyStartDate")}
              value={formData.pendingPenaltyStartDate}
              onValueChange={handlePendingPenaltyStartChange}
              onBlur={() => handleBlur("pendingPenaltyStartDate")}
              className={err("pendingPenaltyStartDate")}
            />
            <ValidationMessage
              message={errors.pendingPenaltyStartDate}
              visible={showError("pendingPenaltyStartDate")}
            />
          </div>

          <div className="space-y-1">
            <DateInput
              disableManualEntry
              label={t("table.pendingPenaltyEndDate")}
              value={formData.pendingPenaltyEndDate}
              onValueChange={(val) =>
                handlePendingPenaltyEndChange
                  ? handlePendingPenaltyEndChange(val)
                  : handleChange("pendingPenaltyEndDate", val)
              }
              onBlur={() => handleBlur("pendingPenaltyEndDate")}
              className={err("pendingPenaltyEndDate")}
            />
            <ValidationMessage
              message={errors.pendingPenaltyEndDate}
              visible={showError("pendingPenaltyEndDate")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
