import type {
  CreateBillingPeriodDto,
  UpdateBillingPeriodDto,
  BillingPeriodValidationResult,
  BillingPeriodInput,
  BillingPeriodTranslator,
} from "@/types/water-bill/billing-configuration/billingPeriodMaster.types";

export type { BillingPeriodValidationResult, BillingPeriodInput, BillingPeriodTranslator };

const formatDateOrNull = (dateStr?: string | null): string | null => {
  if (!dateStr || !dateStr.trim()) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d.toISOString();
};

/**
 * Server-side hook logic for validating Billing Period Master inputs
 */
export function validateBillingPeriodInput(
  input: BillingPeriodInput,
  t: BillingPeriodTranslator
): BillingPeriodValidationResult {
  const errors: Record<string, string[]> = {};

  // 1. Period Code
  if (input.billingPeriodCode && input.billingPeriodCode.trim().length > 30) {
    errors.billingPeriodCode = [t("validation.billingPeriodCodeLength", { count: 30 })];
  }

  // 2. Financial Year
  const fyId = typeof input.financialYearId === "number"
    ? input.financialYearId
    : parseInt(String(input.financialYearId || ""), 10);
  if (isNaN(fyId) || fyId <= 0) {
    errors.financialYearId = [t("validation.financialYearRequired")];
  }

  // 3. Billing Frequency
  const bfId = typeof input.billingFrequencyId === "number"
    ? input.billingFrequencyId
    : parseInt(String(input.billingFrequencyId || ""), 10);
  if (isNaN(bfId) || bfId <= 0) {
    errors.billingFrequencyId = [t("validation.billingFrequencyRequired")];
  }

  // 4. Period From Date
  if (!input.periodFromDate || !input.periodFromDate.trim()) {
    errors.periodFromDate = [t("validation.periodFromDateRequired")];
  } else {
    const from = new Date(input.periodFromDate);
    if (isNaN(from.getTime())) {
      errors.periodFromDate = [t("validation.periodFromDateInvalid")];
    }
  }

  // 5. Period To Date
  if (!input.periodToDate || !input.periodToDate.trim()) {
    errors.periodToDate = [t("validation.periodToDateRequired")];
  } else {
    const to = new Date(input.periodToDate);
    if (isNaN(to.getTime())) {
      errors.periodToDate = [t("validation.periodToDateInvalid")];
    } else if (input.periodFromDate) {
      const from = new Date(input.periodFromDate);
      if (!isNaN(from.getTime()) && to <= from) {
        errors.periodToDate = [t("validation.periodToDateAfterFromDate")];
      }
    }
  }

  // 6. Due Date & Grace Days Validation
  if (input.periodToDate) {
    const graceDays = typeof input.graceDays === "number"
      ? input.graceDays
      : parseInt(String(input.graceDays || "0"), 10);

    if (input.dueDate && input.dueDate.trim()) {
      if (input.dueDate === "INVALID" || isNaN(new Date(input.dueDate).getTime())) {
        errors.dueDate = [t("validation.dueDateInvalid")];
      } else if (input.dueDate < input.periodToDate) {
        errors.dueDate = [t("validation.dueDateAfterPeriodTo")];
      }
    }

    if (graceDays < 0) {
      if (!errors.graceDays) errors.graceDays = [t("validation.graceDaysPositive")];
    }
  }

  // 7. Bill Generation Date Validation
  if (input.billGenerationDate && input.billGenerationDate.trim()) {
    if (
      input.billGenerationDate === "INVALID" ||
      isNaN(new Date(input.billGenerationDate).getTime())
    ) {
      errors.billGenerationDate = [t("validation.billGenerationDateInvalid")];
    } else {
      const genDate = input.billGenerationDate.split("T")[0];
      if (
        input.periodFromDate &&
        input.periodFromDate.trim() &&
        !isNaN(new Date(input.periodFromDate).getTime())
      ) {
        const periodFrom = input.periodFromDate.split("T")[0];
        if (genDate < periodFrom) {
          errors.billGenerationDate = [t("validation.billGenerationNotBeforePeriodFrom")];
        }
      }
      if (
        input.dueDate &&
        input.dueDate.trim() &&
        !isNaN(new Date(input.dueDate).getTime())
      ) {
        const dueDate = input.dueDate.split("T")[0];
        if (genDate > dueDate) {
          errors.billGenerationDate = [t("validation.billGenerationNotAfterDueDate")];
        }
      }
    }
  }

  // 8. Current Penalty End Date must not be before Current Penalty Start Date
  if (input.currentPenaltyEndDate && input.currentPenaltyStartDate) {
    const penaltyEnd = new Date(input.currentPenaltyEndDate);
    const penaltyStart = new Date(input.currentPenaltyStartDate);
    if (!isNaN(penaltyEnd.getTime()) && !isNaN(penaltyStart.getTime()) && penaltyEnd < penaltyStart) {
      errors.currentPenaltyEndDate = [t("validation.currentPenaltyEndAfterStart")];
    }
  }

  // 9. Pending Penalty Start Date must not be before Current Penalty End Date
  if (input.pendingPenaltyStartDate && input.currentPenaltyEndDate) {
    const pendingStart = new Date(input.pendingPenaltyStartDate);
    const currentEnd = new Date(input.currentPenaltyEndDate);
    if (!isNaN(pendingStart.getTime()) && !isNaN(currentEnd.getTime()) && pendingStart < currentEnd) {
      errors.pendingPenaltyStartDate = [t("validation.pendingPenaltyStartNotBeforeCurrentPenaltyEnd")];
    }
  }

  // 10. Pending Penalty End Date must not be before Pending Penalty Start Date
  if (input.pendingPenaltyEndDate && input.pendingPenaltyStartDate) {
    const penaltyEnd = new Date(input.pendingPenaltyEndDate);
    const penaltyStart = new Date(input.pendingPenaltyStartDate);
    if (!isNaN(penaltyEnd.getTime()) && !isNaN(penaltyStart.getTime()) && penaltyEnd < penaltyStart) {
      errors.pendingPenaltyEndDate = [t("validation.pendingPenaltyEndAfterStart")];
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Server-side hook logic for mapping and sanitizing Create DTO
 */
export function mapToCreateBillingPeriodDto(
  input: BillingPeriodInput,
  userId?: number
): CreateBillingPeriodDto {
  const fyId = typeof input.financialYearId === "number"
    ? input.financialYearId
    : parseInt(String(input.financialYearId || "0"), 10);

  const bfId = typeof input.billingFrequencyId === "number"
    ? input.billingFrequencyId
    : parseInt(String(input.billingFrequencyId || "0"), 10);

  const seq = typeof input.sequenceNo === "number"
    ? input.sequenceNo
    : input.sequenceNo !== undefined && input.sequenceNo !== null && String(input.sequenceNo).trim() !== ""
      ? parseInt(String(input.sequenceNo), 10)
      : undefined;

  const validSeq = seq !== undefined && !isNaN(seq) && seq > 0 ? seq : undefined;

  const grace = typeof input.graceDays === "number"
    ? input.graceDays
    : parseInt(String(input.graceDays || "0"), 10);

  const defaultCode = validSeq ? `BP-${fyId}-${bfId}-${validSeq}` : `BP-${fyId}-${bfId}`;
  const code = (input.billingPeriodCode || defaultCode).trim().toUpperCase();

  const effectiveUserId =
    userId !== undefined && userId !== null
      ? Number(userId)
      : input.createdBy !== undefined && input.createdBy !== null && String(input.createdBy).trim() !== ""
        ? Number(input.createdBy)
        : undefined;

  return {
    billingPeriodCode: code,
    financialYearId: fyId,
    billingFrequencyId: bfId,
    sequenceNo: validSeq,
    periodFromDate: new Date(input.periodFromDate).toISOString(),
    periodToDate: new Date(input.periodToDate).toISOString(),
    billGenerationDate: formatDateOrNull(input.billGenerationDate),
    dueDate: formatDateOrNull(input.dueDate),
    graceDays: isNaN(grace) ? 0 : grace,
    currentPenaltyStartDate: formatDateOrNull(input.currentPenaltyStartDate),
    currentPenaltyEndDate: formatDateOrNull(input.currentPenaltyEndDate),
    pendingPenaltyStartDate: formatDateOrNull(input.pendingPenaltyStartDate),
    pendingPenaltyEndDate: formatDateOrNull(input.pendingPenaltyEndDate),
    isActive: typeof input.isActive === "boolean"
      ? input.isActive
      : input.isActive === "true" || input.isActive === undefined,
    ...(effectiveUserId !== undefined && !isNaN(effectiveUserId)
      ? { createdBy: effectiveUserId }
      : {}),
  };
}

/**
 * Server-side hook logic for mapping and sanitizing Update DTO
 */
export function mapToUpdateBillingPeriodDto(
  id: number,
  input: BillingPeriodInput,
  userId?: number
): UpdateBillingPeriodDto {
  const createDto = mapToCreateBillingPeriodDto(input, userId);
  const effectiveUserId =
    userId !== undefined && userId !== null
      ? Number(userId)
      : input.updatedBy !== undefined && input.updatedBy !== null && String(input.updatedBy).trim() !== ""
        ? Number(input.updatedBy)
        : undefined;

  return {
    id,
    ...createDto,
    ...(effectiveUserId !== undefined && !isNaN(effectiveUserId)
      ? { updatedBy: effectiveUserId }
      : {}),
  };
}
