import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useBillingPeriodFormFields } from "@/hooks/water-bill/billing-configuration/billing-period-master/useBillingPeriodFormFields";
import type {
  BillingPeriodInput,
  BillingPeriodMaster,
  DropdownOption,
} from "@/types/water-bill/billing-configuration/billingPeriodMaster.types";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/components/common", () => ({
  useToast: () => ({
    error: vi.fn(),
    success: vi.fn(),
  }),
}));

describe("useBillingPeriodFormFields", () => {
  const financialYearOptions: DropdownOption[] = [
    {
      value: "1",
      label: "2026-2027",
      data: { year: 2026, startDate: "2026-04-01", endDate: "2027-03-31" },
    },
  ];

  const billingFrequencyOptions: DropdownOption[] = [
    {
      value: "10",
      label: "Monthly",
      data: { billingFrequencyCode: "M", periodsPerYear: 12, sequenceNo: 1 },
    },
    {
      value: "20",
      label: "Quarterly",
      data: { billingFrequencyCode: "Q", periodsPerYear: 4, sequenceNo: 2 },
    },
  ];

  const existingMonthlyPeriod1: BillingPeriodMaster = {
    id: 101,
    billingPeriodCode: "2026-M1",
    financialYearId: 1,
    billingFrequencyId: 10,
    periodFromDate: "2026-04-01T00:00:00.000Z",
    periodToDate: "2026-04-30T00:00:00.000Z",
    graceDays: 0,
    isActive: true,
  };

  it("sets only Period From Date from year start when only Financial Year is selected (no frequency yet)", () => {
    let formData: BillingPeriodInput = {
      financialYearId: "",
      billingFrequencyId: "",
      periodFromDate: "",
      periodToDate: "",
      dueDate: "",
      graceDays: 0,
      currentPenaltyStartDate: "",
      isActive: true,
    };

    const handleUpdate = vi.fn((updates) => {
      formData = { ...formData, ...updates };
    });
    const handleChange = vi.fn();

    const { result } = renderHook(() =>
      useBillingPeriodFormFields({
        formData,
        financialYearOptions,
        billingFrequencyOptions,
        existingPeriods: [existingMonthlyPeriod1], // Even with existing period for Monthly
        handleChange,
        handleUpdate,
      })
    );

    act(() => {
      result.current.handleYearChange("1");
    });

    // When only Year is selected, Period From is set to year start without checking existing periods
    expect(handleUpdate).toHaveBeenCalledWith({
      financialYearId: 1,
      periodFromDate: "2026-04-01",
      periodToDate: "",
      dueDate: "",
      currentPenaltyStartDate: "2026-04-01",
      currentPenaltyEndDate: "",
    });
  });

  it("checks existing records when Billing Frequency is selected after Financial Year (with existing records)", () => {
    let formData: BillingPeriodInput = {
      financialYearId: "1",
      billingFrequencyId: "",
      periodFromDate: "2026-04-01",
      periodToDate: "",
      dueDate: "",
      graceDays: 0,
      currentPenaltyStartDate: "",
      isActive: true,
    };

    const handleUpdate = vi.fn((updates) => {
      formData = { ...formData, ...updates };
    });
    const handleChange = vi.fn();

    const { result } = renderHook(() =>
      useBillingPeriodFormFields({
        formData,
        financialYearOptions,
        billingFrequencyOptions,
        existingPeriods: [existingMonthlyPeriod1],
        handleChange,
        handleUpdate,
      })
    );

    act(() => {
      result.current.handleFrequencyChange("10"); // Monthly
    });

    // M1 exists (ends 2026-04-30), so M2 starts on 2026-05-01, ends on 2026-05-31
    expect(handleUpdate).toHaveBeenCalledWith({
      billingFrequencyId: 10,
      periodFromDate: "2026-05-01",
      periodToDate: "2026-05-31",
      sequenceNo: 2,
      dueDate: "2026-05-31",
      graceDays: 0,
      currentPenaltyStartDate: "2026-05-01",
      currentPenaltyEndDate: "2026-05-31",
      pendingPenaltyStartDate: "2026-06-01",
    });
  });

  it("calculates Period From as Year Start when Billing Frequency is selected with no existing records", () => {
    let formData: BillingPeriodInput = {
      financialYearId: "1",
      billingFrequencyId: "",
      periodFromDate: "2026-04-01",
      periodToDate: "",
      dueDate: "",
      graceDays: 0,
      currentPenaltyStartDate: "",
      isActive: true,
    };

    const handleUpdate = vi.fn((updates) => {
      formData = { ...formData, ...updates };
    });
    const handleChange = vi.fn();

    const { result } = renderHook(() =>
      useBillingPeriodFormFields({
        formData,
        financialYearOptions,
        billingFrequencyOptions,
        existingPeriods: [], // No existing records
        handleChange,
        handleUpdate,
      })
    );

    act(() => {
      result.current.handleFrequencyChange("20"); // Quarterly
    });

    // Q1 starts 2026-04-01, ends 2026-06-30
    expect(handleUpdate).toHaveBeenCalledWith({
      billingFrequencyId: 20,
      periodFromDate: "2026-04-01",
      periodToDate: "2026-06-30",
      sequenceNo: 1,
      dueDate: "2026-06-30",
      graceDays: 0,
      currentPenaltyStartDate: "2026-04-01",
      currentPenaltyEndDate: "2026-06-30",
      pendingPenaltyStartDate: "2026-07-01",
    });
  });

  it("updates Grace Days when Due Date is changed without altering penalty start date", () => {
    let formData: BillingPeriodInput = {
      financialYearId: "1",
      billingFrequencyId: "10",
      periodFromDate: "2026-04-01",
      periodToDate: "2026-04-30",
      dueDate: "2026-04-30",
      graceDays: 0,
      currentPenaltyStartDate: "2026-04-01",
      isActive: true,
    };

    const handleUpdate = vi.fn((updates) => {
      formData = { ...formData, ...updates };
    });
    const handleChange = vi.fn();

    const { result } = renderHook(() =>
      useBillingPeriodFormFields({
        formData,
        financialYearOptions,
        billingFrequencyOptions,
        existingPeriods: [],
        handleChange,
        handleUpdate,
      })
    );

    act(() => {
      result.current.handleDueDateChange("2026-05-10");
    });

    // From 2026-04-30 to 2026-05-10 is 10 days
    expect(handleUpdate).toHaveBeenCalledWith({
      dueDate: "2026-05-10",
      graceDays: 10,
    });
  });

  it("updates Due Date when Grace Days is changed without altering penalty start date", () => {
    let formData: BillingPeriodInput = {
      financialYearId: "1",
      billingFrequencyId: "10",
      periodFromDate: "2026-04-01",
      periodToDate: "2026-04-30",
      dueDate: "2026-04-30",
      graceDays: 0,
      currentPenaltyStartDate: "2026-04-01",
      isActive: true,
    };

    const handleUpdate = vi.fn((updates) => {
      formData = { ...formData, ...updates };
    });
    const handleChange = vi.fn();

    const { result } = renderHook(() =>
      useBillingPeriodFormFields({
        formData,
        financialYearOptions,
        billingFrequencyOptions,
        existingPeriods: [],
        handleChange,
        handleUpdate,
      })
    );

    act(() => {
      result.current.handleGraceDaysChange("5");
    });

    // 2026-04-30 + 5 days = 2026-05-05
    expect(handleUpdate).toHaveBeenCalledWith({
      graceDays: 5,
      dueDate: "2026-05-05",
    });
  });

  it("sets Grace Days to 0 when Due Date is set equal to Period To Date", () => {
    let formData: BillingPeriodInput = {
      financialYearId: "1",
      billingFrequencyId: "10",
      periodFromDate: "2026-05-01",
      periodToDate: "2026-05-31",
      dueDate: "2026-06-10",
      graceDays: 10,
      currentPenaltyStartDate: "2026-05-01",
      isActive: true,
    };

    const handleUpdate = vi.fn((updates) => {
      formData = { ...formData, ...updates };
    });
    const handleChange = vi.fn();

    const { result } = renderHook(() =>
      useBillingPeriodFormFields({
        formData,
        financialYearOptions,
        billingFrequencyOptions,
        existingPeriods: [],
        handleChange,
        handleUpdate,
      })
    );

    act(() => {
      result.current.handleDueDateChange("2026-05-31");
    });

    expect(handleUpdate).toHaveBeenCalledWith({
      dueDate: "2026-05-31",
      graceDays: 0,
    });
  });

  it("auto increases Grace Days to 31 when Due Date is set to 2026-07-01 for Period To 2026-05-31", () => {
    let formData: BillingPeriodInput = {
      financialYearId: "1",
      billingFrequencyId: "10",
      periodFromDate: "2026-05-01",
      periodToDate: "2026-05-31",
      dueDate: "2026-05-31",
      graceDays: 0,
      currentPenaltyStartDate: "2026-05-01",
      isActive: true,
    };

    const handleUpdate = vi.fn((updates) => {
      formData = { ...formData, ...updates };
    });
    const handleChange = vi.fn();

    const { result } = renderHook(() =>
      useBillingPeriodFormFields({
        formData,
        financialYearOptions,
        billingFrequencyOptions,
        existingPeriods: [],
        handleChange,
        handleUpdate,
      })
    );

    act(() => {
      result.current.handleDueDateChange("2026-07-01");
    });

    expect(handleUpdate).toHaveBeenCalledWith({
      dueDate: "2026-07-01",
      graceDays: 31,
    });
  });

  it("distinguishes sequential periods (M1, M2, M3) with correct count and distinct codes when calculated", () => {
    const existingM1: BillingPeriodMaster = {
      id: 1,
      billingPeriodCode: "BP-1-10-1",
      financialYearId: 1,
      billingFrequencyId: 10,
      sequenceNo: 1,
      periodFromDate: "2026-04-01T00:00:00.000Z",
      periodToDate: "2026-04-30T00:00:00.000Z",
      graceDays: 0,
      isActive: true,
    };

    const existingM2: BillingPeriodMaster = {
      id: 2,
      billingPeriodCode: "BP-1-10-2",
      financialYearId: 1,
      billingFrequencyId: 10,
      sequenceNo: 2,
      periodFromDate: "2026-05-01T00:00:00.000Z",
      periodToDate: "2026-05-31T00:00:00.000Z",
      graceDays: 0,
      isActive: true,
    };

    let formData: BillingPeriodInput = {
      financialYearId: "1",
      billingFrequencyId: "",
      periodFromDate: "",
      periodToDate: "",
      dueDate: "",
      graceDays: 0,
      currentPenaltyStartDate: "",
      isActive: true,
    };

    const handleUpdate = vi.fn((updates) => {
      formData = { ...formData, ...updates };
    });
    const handleChange = vi.fn();

    const { result } = renderHook(() =>
      useBillingPeriodFormFields({
        formData,
        financialYearOptions,
        billingFrequencyOptions,
        existingPeriods: [existingM1, existingM2],
        handleChange,
        handleUpdate,
      })
    );

    act(() => {
      result.current.handleFrequencyChange("10"); // Monthly
    });

    // M3 should start after M2 (2026-06-01 to 2026-06-30)
    expect(handleUpdate).toHaveBeenCalledWith({
      billingFrequencyId: 10,
      periodFromDate: "2026-06-01",
      periodToDate: "2026-06-30",
      sequenceNo: 3,
      dueDate: "2026-06-30",
      graceDays: 0,
      currentPenaltyStartDate: "2026-06-01",
      currentPenaltyEndDate: "2026-06-30",
      pendingPenaltyStartDate: "2026-07-01",
    });

    // Verify existing codes are distinct
    expect(existingM1.billingPeriodCode).not.toBe(existingM2.billingPeriodCode);
    expect(existingM1.billingPeriodCode).toBe("BP-1-10-1");
    expect(existingM2.billingPeriodCode).toBe("BP-1-10-2");
  });

  it("updates periodFromDate and syncs currentPenaltyStartDate when handlePeriodFromChange is called", () => {
    let formData: BillingPeriodInput = {
      financialYearId: "1",
      billingFrequencyId: "10",
      periodFromDate: "2026-04-01",
      periodToDate: "2026-04-30",
      dueDate: "2026-04-30",
      graceDays: 0,
      currentPenaltyStartDate: "2026-04-01",
      isActive: true,
    };

    const handleUpdate = vi.fn((updates) => {
      formData = { ...formData, ...updates };
    });
    const handleChange = vi.fn();

    const { result } = renderHook(() =>
      useBillingPeriodFormFields({
        formData,
        financialYearOptions,
        billingFrequencyOptions,
        existingPeriods: [],
        handleChange,
        handleUpdate,
      })
    );

    act(() => {
      result.current.handlePeriodFromChange("2026-05-01");
    });

    expect(handleUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        periodFromDate: "2026-05-01",
        currentPenaltyStartDate: "2026-05-01",
        periodToDate: "2026-05-31",
        currentPenaltyEndDate: "2026-05-31",
        pendingPenaltyStartDate: "2026-06-01",
      })
    );
  });

  it("updates periodToDate and syncs currentPenaltyEndDate when handlePeriodToChange is called", () => {
    let formData: BillingPeriodInput = {
      financialYearId: "1",
      billingFrequencyId: "10",
      periodFromDate: "2026-04-01",
      periodToDate: "2026-04-30",
      dueDate: "2026-04-30",
      graceDays: 0,
      currentPenaltyStartDate: "2026-04-01",
      currentPenaltyEndDate: "2026-04-30",
      isActive: true,
    };

    const handleUpdate = vi.fn((updates) => {
      formData = { ...formData, ...updates };
    });
    const handleChange = vi.fn();

    const { result } = renderHook(() =>
      useBillingPeriodFormFields({
        formData,
        financialYearOptions,
        billingFrequencyOptions,
        existingPeriods: [],
        handleChange,
        handleUpdate,
      })
    );

    act(() => {
      result.current.handlePeriodToChange("2026-05-15");
    });

    expect(handleUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        periodToDate: "2026-05-15",
        currentPenaltyEndDate: "2026-05-15",
        pendingPenaltyStartDate: "2026-05-16",
        dueDate: "2026-05-15",
        graceDays: 0,
      })
    );
  });

  it("sets INVALID state when handlePeriodToChange or handlePeriodFromChange receives INVALID", () => {
    let formData: BillingPeriodInput = {
      financialYearId: "1",
      billingFrequencyId: "10",
      periodFromDate: "2026-04-01",
      periodToDate: "2026-04-30",
    };

    const handleUpdate = vi.fn((updates) => {
      formData = { ...formData, ...updates };
    });
    const handleChange = vi.fn();

    const { result } = renderHook(() =>
      useBillingPeriodFormFields({
        formData,
        financialYearOptions,
        billingFrequencyOptions,
        existingPeriods: [],
        handleChange,
        handleUpdate,
      })
    );

    act(() => {
      result.current.handlePeriodToChange("INVALID");
    });
    expect(handleUpdate).toHaveBeenCalledWith({ periodToDate: "INVALID" });

    act(() => {
      result.current.handlePeriodFromChange("INVALID");
    });
    expect(handleUpdate).toHaveBeenCalledWith({ periodFromDate: "INVALID" });
  });

  it("does not auto-update or overwrite billGenerationDate when other fields change", () => {
    let formData: BillingPeriodInput = {
      financialYearId: "1",
      billingFrequencyId: "10",
      periodFromDate: "2026-04-01",
      periodToDate: "2026-04-30",
      billGenerationDate: "2026-04-20",
    };

    const handleUpdate = vi.fn((updates) => {
      formData = { ...formData, ...updates };
    });
    const handleChange = vi.fn();

    const { result } = renderHook(() =>
      useBillingPeriodFormFields({
        formData,
        financialYearOptions,
        billingFrequencyOptions,
        existingPeriods: [],
        handleChange,
        handleUpdate,
      })
    );

    act(() => {
      result.current.handlePeriodToChange("2026-05-15");
    });

    // Should NOT have billGenerationDate in updates
    expect(handleUpdate).toHaveBeenCalledWith(
      expect.not.objectContaining({
        billGenerationDate: expect.anything(),
      })
    );
  });

  it("sets periodToDate to financial year end date (2027-03-31) when creating the last quarterly period (Period 4)", () => {
    const existingQuarterlyPeriods: BillingPeriodMaster[] = [
      {
        id: 1,
        billingPeriodCode: "2026-Q1",
        financialYearId: 1,
        billingFrequencyId: 20,
        sequenceNo: 1,
        periodFromDate: "2026-04-01",
        periodToDate: "2026-06-30",
        graceDays: 0,
        isActive: true,
      },
      {
        id: 2,
        billingPeriodCode: "2026-Q2",
        financialYearId: 1,
        billingFrequencyId: 20,
        sequenceNo: 2,
        periodFromDate: "2026-07-01",
        periodToDate: "2026-08-30",
        graceDays: 0,
        isActive: true,
      },
      {
        id: 3,
        billingPeriodCode: "2026-Q3",
        financialYearId: 1,
        billingFrequencyId: 20,
        sequenceNo: 3,
        periodFromDate: "2026-08-31",
        periodToDate: "2026-11-30",
        graceDays: 0,
        isActive: true,
      },
    ];

    let formData: BillingPeriodInput = {
      financialYearId: "1",
      billingFrequencyId: "",
      periodFromDate: "",
      periodToDate: "",
      dueDate: "",
      graceDays: 0,
    };

    const handleUpdate = vi.fn((updates) => {
      formData = { ...formData, ...updates };
    });
    const handleChange = vi.fn();

    const { result } = renderHook(() =>
      useBillingPeriodFormFields({
        formData,
        financialYearOptions,
        billingFrequencyOptions,
        existingPeriods: existingQuarterlyPeriods,
        handleChange,
        handleUpdate,
      })
    );

    act(() => {
      result.current.handleFrequencyChange("20"); // Select Quarterly
    });

    expect(handleUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        periodFromDate: "2026-12-01",
        periodToDate: "2027-03-31", // Ends on FY end date, not 2027-02-28
        sequenceNo: 4,
        dueDate: "2027-03-31",
        currentPenaltyEndDate: "2027-03-31",
        pendingPenaltyStartDate: "2027-04-01",
      })
    );
  });
});
