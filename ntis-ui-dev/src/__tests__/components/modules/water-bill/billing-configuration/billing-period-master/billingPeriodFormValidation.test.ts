import { describe, it, expect } from "vitest";
import { validateBillingPeriodFormData } from "@/components/modules/water-bill/billing-configuration/billing-period/billingPeriodFormValidation";
import type { BillingPeriodInput } from "@/types/water-bill/billing-configuration/billingPeriodMaster.types";

describe("billingPeriodFormValidation", () => {
  const t = (key: string) => key;

  const validForm: BillingPeriodInput = {
    financialYearId: 1,
    billingFrequencyId: 10,
    periodFromDate: "2026-04-01",
    periodToDate: "2026-04-30",
    dueDate: "2026-04-30",
    graceDays: 0,
    currentPenaltyStartDate: "2026-04-01",
    currentPenaltyEndDate: "2026-04-30",
    pendingPenaltyStartDate: "2026-05-01",
    isActive: true,
  };

  it("passes validation for valid form data", () => {
    const errors = validateBillingPeriodFormData(validForm, t);
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it("fails if required fields are missing", () => {
    const errors = validateBillingPeriodFormData(
      {
        financialYearId: "",
        billingFrequencyId: "",
        periodFromDate: "",
        periodToDate: "",
        graceDays: "",
        isActive: true,
      },
      t
    );

    expect(errors.financialYearId).toBe("validation.financialYearRequired");
    expect(errors.billingFrequencyId).toBe("validation.billingFrequencyRequired");
    expect(errors.periodFromDate).toBe("validation.periodFromDateRequired");
    expect(errors.periodToDate).toBe("validation.periodToDateRequired");
    expect(errors.dueDate).toBe("validation.dueDateRequired");
    expect(errors.graceDays).toBe("validation.graceDaysRequired");
  });

  it("validates Due Date cannot be before Period To Date", () => {
    const errors = validateBillingPeriodFormData(
      {
        ...validForm,
        periodToDate: "2026-05-31",
        currentPenaltyEndDate: "2026-05-31",
        dueDate: "2026-05-20", // Before Period To
      },
      t
    );

    expect(errors.dueDate).toBe("validation.dueDateAfterPeriodTo");

    const invalidErrors = validateBillingPeriodFormData(
      {
        ...validForm,
        dueDate: "INVALID",
      },
      t
    );
    expect(invalidErrors.dueDate).toBe("validation.dueDateInvalid");
  });

  it("validates Due Date and Grace Days when exceeding 31 days", () => {
    const errors = validateBillingPeriodFormData(
      {
        ...validForm,
        periodToDate: "2026-05-31",
        currentPenaltyEndDate: "2026-05-31",
        dueDate: "2026-07-16", // 46 days later
        graceDays: 46,
      },
      t
    );

    expect(errors.dueDate).toBe("validation.dueDateMaxDays");
    expect(errors.graceDays).toBe("validation.graceDaysMax");
  });

  it("validates Current Penalty Start and End dates must match Period From and Period To", () => {
    const mismatchedStartErrors = validateBillingPeriodFormData(
      {
        ...validForm,
        periodFromDate: "2026-04-01",
        periodToDate: "2026-04-30",
        currentPenaltyStartDate: "2026-04-05", // does not match Period From
        currentPenaltyEndDate: "2026-04-30",
      },
      t
    );
    expect(mismatchedStartErrors.currentPenaltyStartDate).toBe(
      "validation.currentPenaltyStartMustMatchPeriodFrom"
    );

    const mismatchedEndErrors = validateBillingPeriodFormData(
      {
        ...validForm,
        periodFromDate: "2026-04-01",
        periodToDate: "2026-04-30",
        currentPenaltyStartDate: "2026-04-01",
        currentPenaltyEndDate: "2026-05-15", // does not match Period To
      },
      t
    );
    expect(mismatchedEndErrors.currentPenaltyEndDate).toBe(
      "validation.currentPenaltyEndMustMatchPeriodTo"
    );
  });

  it("validates penalty dates sequence", () => {
    const errors = validateBillingPeriodFormData(
      {
        ...validForm,
        dueDate: "2026-05-31",
        currentPenaltyStartDate: "2026-05-20",
        currentPenaltyEndDate: "2026-05-15", // Before Start Date
        pendingPenaltyStartDate: "2026-05-10", // Before Current End Date
      },
      t
    );

    expect(errors.currentPenaltyStartDate).toBe("validation.currentPenaltyStartMustMatchPeriodFrom");
    expect(errors.currentPenaltyEndDate).toBe("validation.currentPenaltyEndAfterStart");
    expect(errors.pendingPenaltyStartDate).toBe(
      "validation.pendingPenaltyStartNotBeforeCurrentPenaltyEnd"
    );
  });

  it("validates pending penalty start date cannot be before or equal to current penalty end date", () => {
    // When equal to current penalty end date
    const equalErrors = validateBillingPeriodFormData(
      {
        ...validForm,
        periodFromDate: "2026-04-01",
        periodToDate: "2026-04-30",
        currentPenaltyStartDate: "2026-04-01",
        currentPenaltyEndDate: "2026-04-30",
        pendingPenaltyStartDate: "2026-04-30", // equal to current penalty end
      },
      t
    );
    expect(equalErrors.pendingPenaltyStartDate).toBe(
      "validation.pendingPenaltyStartNotBeforeCurrentPenaltyEnd"
    );

    // When less than current penalty end date
    const lessErrors = validateBillingPeriodFormData(
      {
        ...validForm,
        periodFromDate: "2026-04-01",
        periodToDate: "2026-04-30",
        currentPenaltyStartDate: "2026-04-01",
        currentPenaltyEndDate: "2026-04-30",
        pendingPenaltyStartDate: "2026-04-25", // less than current penalty end
      },
      t
    );
    expect(lessErrors.pendingPenaltyStartDate).toBe(
      "validation.pendingPenaltyStartNotBeforeCurrentPenaltyEnd"
    );

    // When greater than current penalty end date (valid)
    const validErrors = validateBillingPeriodFormData(
      {
        ...validForm,
        periodFromDate: "2026-04-01",
        periodToDate: "2026-04-30",
        currentPenaltyStartDate: "2026-04-01",
        currentPenaltyEndDate: "2026-04-30",
        pendingPenaltyStartDate: "2026-05-01", // 1 day after current penalty end
      },
      t
    );
    expect(validErrors.pendingPenaltyStartDate).toBeUndefined();
  });

  it("validates bill generation date between Period From and Due date", () => {
    // Before Period From
    const beforeFromErrors = validateBillingPeriodFormData(
      {
        ...validForm,
        periodFromDate: "2026-04-01",
        periodToDate: "2026-04-30",
        dueDate: "2026-05-15",
        billGenerationDate: "2026-03-31",
      },
      t
    );
    expect(beforeFromErrors.billGenerationDate).toBe("validation.billGenerationNotBeforePeriodFrom");

    // After Due date
    const afterDueErrors = validateBillingPeriodFormData(
      {
        ...validForm,
        periodFromDate: "2026-04-01",
        periodToDate: "2026-04-30",
        dueDate: "2026-05-15",
        billGenerationDate: "2026-05-16",
      },
      t
    );
    expect(afterDueErrors.billGenerationDate).toBe("validation.billGenerationNotAfterDueDate");

    // Valid: Between Period From and Due Date (even before Period To)
    const validGenDateErrors = validateBillingPeriodFormData(
      {
        ...validForm,
        periodFromDate: "2026-04-01",
        periodToDate: "2026-04-30",
        dueDate: "2026-05-15",
        billGenerationDate: "2026-04-15",
      },
      t
    );
    expect(validGenDateErrors.billGenerationDate).toBeUndefined();

    // Invalid date string or "INVALID"
    const invalidErrors = validateBillingPeriodFormData(
      {
        ...validForm,
        billGenerationDate: "INVALID",
      },
      t
    );
    expect(invalidErrors.billGenerationDate).toBe("validation.billGenerationDateInvalid");
  });

  it("shows validation message on currentPenaltyStartDate when currentPenaltyStartDate is changed to be after end date", () => {
    const errors = validateBillingPeriodFormData(
      {
        ...validForm,
        periodFromDate: "2026-05-01",
        periodToDate: "2026-05-01",
        dueDate: "2026-05-01",
        currentPenaltyStartDate: "2026-06-01", // After End Date & doesn't match Period From
        currentPenaltyEndDate: "2026-05-01",
      },
      t,
      "currentPenaltyStartDate"
    );

    expect(errors.currentPenaltyStartDate).toBe("validation.currentPenaltyStartMustMatchPeriodFrom");
    expect(errors.currentPenaltyEndDate).toBeUndefined();
  });

  it("shows validation message on currentPenaltyEndDate when currentPenaltyEndDate is changed to be before start date", () => {
    const errors = validateBillingPeriodFormData(
      {
        ...validForm,
        periodFromDate: "2026-05-01",
        periodToDate: "2026-05-01",
        dueDate: "2026-05-01",
        currentPenaltyStartDate: "2026-05-01",
        currentPenaltyEndDate: "2026-04-20", // Before Start Date & doesn't match Period To
      },
      t,
      "currentPenaltyEndDate"
    );

    expect(errors.currentPenaltyEndDate).toBe("validation.currentPenaltyEndAfterStart");
    expect(errors.currentPenaltyStartDate).toBeUndefined();
  });

  it("returns periodToDateInvalid instead of required when an invalid date is provided", () => {
    const errors = validateBillingPeriodFormData(
      {
        ...validForm,
        periodToDate: "INVALID",
      },
      t
    );

    expect(errors.periodToDate).toBe("validation.periodToDateInvalid");
    expect(errors.periodToDate).not.toBe("validation.periodToDateRequired");
  });

  describe("financial year boundary and period matching validation", () => {
    const fyContext = {
      yearStartDate: "2026-04-01",
      yearEndDate: "2027-03-31",
      isFirstPeriod: true,
      isLastPeriod: false,
    };

    it("requires first period to match financial year start date", () => {
      const mismatchedErrors = validateBillingPeriodFormData(
        {
          ...validForm,
          periodFromDate: "2026-04-05", // does not match FY start
          periodToDate: "2026-06-30",
        },
        t,
        null,
        fyContext
      );
      expect(mismatchedErrors.periodFromDate).toBe("validation.periodFromDateMustMatchYearStart");

      const matchedErrors = validateBillingPeriodFormData(
        {
          ...validForm,
          periodFromDate: "2026-04-01",
          periodToDate: "2026-06-30",
        },
        t,
        null,
        fyContext
      );
      expect(matchedErrors.periodFromDate).toBeUndefined();
    });

    it("requires last period to match financial year end date", () => {
      const lastPeriodContext = {
        ...fyContext,
        isFirstPeriod: false,
        isLastPeriod: true,
      };

      const mismatchedErrors = validateBillingPeriodFormData(
        {
          ...validForm,
          periodFromDate: "2026-12-01",
          periodToDate: "2027-02-28", // does not match FY end
          dueDate: "2027-02-28",
        },
        t,
        null,
        lastPeriodContext
      );
      expect(mismatchedErrors.periodToDate).toBe("validation.periodToDateMustMatchYearEnd");

      const matchedErrors = validateBillingPeriodFormData(
        {
          ...validForm,
          periodFromDate: "2026-12-01",
          periodToDate: "2027-03-31", // matches FY end
          dueDate: "2027-03-31",
        },
        t,
        null,
        lastPeriodContext
      );
      expect(matchedErrors.periodToDate).toBeUndefined();
    });

    it("validates that dates cannot exceed FY boundaries for intermediate periods", () => {
      const intermediateContext = {
        ...fyContext,
        isFirstPeriod: false,
        isLastPeriod: false,
      };

      const beforeStartErrors = validateBillingPeriodFormData(
        {
          ...validForm,
          periodFromDate: "2026-03-15", // Before FY start
          periodToDate: "2026-05-31",
        },
        t,
        null,
        intermediateContext
      );
      expect(beforeStartErrors.periodFromDate).toBe("validation.periodFromNotBeforeYearStart");

      const afterEndErrors = validateBillingPeriodFormData(
        {
          ...validForm,
          periodFromDate: "2026-10-01",
          periodToDate: "2027-04-15", // After FY end
        },
        t,
        null,
        intermediateContext
      );
      expect(afterEndErrors.periodToDate).toBe("validation.periodToNotAfterYearEnd");
    });
  });
});
