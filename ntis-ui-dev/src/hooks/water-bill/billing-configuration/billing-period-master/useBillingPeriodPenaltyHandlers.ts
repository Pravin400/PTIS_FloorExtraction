import type { BillingPeriodInput } from "@/types/water-bill/billing-configuration/billingPeriodMaster.types";
import { addDays } from "../../../../lib/utils/water-bill/billing-configuration/billingPeriodCalculation.utils";

interface UseBillingPeriodPenaltyHandlersParams {
  formData: BillingPeriodInput;
  handleChange: (field: keyof BillingPeriodInput, value: string | number | boolean) => void;
  handleUpdate: (updates: Partial<BillingPeriodInput>) => void;
}

export function useBillingPeriodPenaltyHandlers({
  formData: _formData,
  handleChange,
  handleUpdate,
}: UseBillingPeriodPenaltyHandlersParams) {
  const handleCurrentPenaltyStartChange = (val: string) => {
    if (!val) {
      handleChange("currentPenaltyStartDate", "");
      return;
    }
    const cleanDate = val.split("T")[0];
    handleChange("currentPenaltyStartDate", cleanDate);
  };

  const handleCurrentPenaltyEndChange = (val: string) => {
    if (!val) {
      handleUpdate({ currentPenaltyEndDate: "", pendingPenaltyStartDate: "" });
      return;
    }
    if (val === "INVALID" || isNaN(new Date(val).getTime())) {
      handleUpdate({ currentPenaltyEndDate: "INVALID" });
      return;
    }
    const cleanDate = val.split("T")[0];
    const pendingStart = addDays(cleanDate, 1);
    handleUpdate({
      currentPenaltyEndDate: cleanDate,
      pendingPenaltyStartDate: pendingStart,
    });
  };

  const handlePendingPenaltyStartChange = (val: string) => {
    if (!val) {
      handleChange("pendingPenaltyStartDate", "");
      return;
    }
    const cleanDate = val.split("T")[0];
    handleChange("pendingPenaltyStartDate", cleanDate);
  };

  const handlePendingPenaltyEndChange = (val: string) => {
    if (!val) {
      handleChange("pendingPenaltyEndDate", "");
      return;
    }
    const cleanDate = val.split("T")[0];
    handleChange("pendingPenaltyEndDate", cleanDate);
  };

  return {
    handleCurrentPenaltyStartChange,
    handleCurrentPenaltyEndChange,
    handlePendingPenaltyStartChange,
    handlePendingPenaltyEndChange,
  };
}
