import { AlertCircle, CalendarCheck2 } from "lucide-react";
import { FormStatusToggle } from "@/components/common";
import type { BillingPeriodTranslator } from "@/types/water-bill/billing-configuration/billingPeriodMaster.types";

interface BillingPeriodStatusBannersProps {
  isEdit: boolean;
  isActive: boolean;
  isSubmitting: boolean;
  isMaxLimitReached: boolean;
  periodsPerYear: number;
  existingCount: number;
  financialYearId?: string | number;
  t: BillingPeriodTranslator;
  onActiveChange: (val: boolean) => void;
}

export function BillingPeriodStatusBanners({
  isEdit,
  isActive,
  isSubmitting,
  isMaxLimitReached,
  periodsPerYear,
  existingCount,
  financialYearId,
  t,
  onActiveChange,
}: BillingPeriodStatusBannersProps) {
  return (
    <>
      <FormStatusToggle
        isEdit={isEdit}
        isActive={isActive}
        onChange={onActiveChange}
        isSubmitting={isSubmitting}
        statusLabel={t("table.isActive")}
        description={isActive ? t("form.activeStatusOn") : t("form.activeStatusOff")}
      />

      {/* Limit / Slot Status Banner */}
      {isMaxLimitReached && (
        <div className="flex items-center gap-2.5 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
          <AlertCircle size={16} className="text-amber-600 shrink-0" />
          <span>
            {t("validation.maxPeriodsReached", {
              count: periodsPerYear,
            })}
          </span>
        </div>
      )}

      {!isEdit && !isMaxLimitReached && periodsPerYear > 0 && financialYearId && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-blue-50 border border-blue-100 text-blue-800 text-xs font-medium">
          <CalendarCheck2 size={15} className="text-blue-600 shrink-0" />
          <span>
            {t("form.creatingPeriodStatus", {
              current: Math.min(existingCount + 1, periodsPerYear),
              total: periodsPerYear,
              remaining: Math.max(0, periodsPerYear - existingCount - 1),
            })}
          </span>
        </div>
      )}
    </>
  );
}
