import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useBillingPeriodPenaltyHandlers } from "@/hooks/water-bill/billing-configuration/billing-period-master/useBillingPeriodPenaltyHandlers";
import type { BillingPeriodInput } from "@/types/water-bill/billing-configuration/billingPeriodMaster.types";

const mockToastError = vi.fn();

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/components/common", () => ({
  useToast: () => ({
    error: mockToastError,
    success: vi.fn(),
  }),
}));

describe("useBillingPeriodPenaltyHandlers", () => {
  it("handles current penalty start change and warns if before due date", () => {
    let formData: BillingPeriodInput = {
      financialYearId: 1,
      billingFrequencyId: 10,
      periodFromDate: "2026-04-01",
      periodToDate: "2026-04-30",
      dueDate: "2026-04-30",
      graceDays: 0,
      currentPenaltyStartDate: "",
      isActive: true,
    };

    const handleChange = vi.fn((field, val) => {
      formData = { ...formData, [field]: val };
    });
    const handleUpdate = vi.fn();

    const { result } = renderHook(() =>
      useBillingPeriodPenaltyHandlers({
        formData,
        handleChange,
        handleUpdate,
      })
    );

    // Date before due date allows date change freely (validation is handled by form validation)
    act(() => {
      result.current.handleCurrentPenaltyStartChange("2026-04-20");
    });
    expect(handleChange).toHaveBeenCalledWith("currentPenaltyStartDate", "2026-04-20");

    // Valid start date
    act(() => {
      result.current.handleCurrentPenaltyStartChange("2026-05-01");
    });
    expect(handleChange).toHaveBeenCalledWith("currentPenaltyStartDate", "2026-05-01");
  });

  it("handles current penalty end change and auto-computes pending penalty start date", () => {
    let formData: BillingPeriodInput = {
      financialYearId: 1,
      billingFrequencyId: 10,
      periodFromDate: "2026-04-01",
      periodToDate: "2026-04-30",
      dueDate: "2026-04-30",
      graceDays: 0,
      currentPenaltyStartDate: "2026-05-01",
      currentPenaltyEndDate: "",
      pendingPenaltyStartDate: "",
      isActive: true,
    };

    const handleChange = vi.fn();
    const handleUpdate = vi.fn((updates) => {
      formData = { ...formData, ...updates };
    });

    const { result } = renderHook(() =>
      useBillingPeriodPenaltyHandlers({
        formData,
        handleChange,
        handleUpdate,
      })
    );

    act(() => {
      result.current.handleCurrentPenaltyEndChange("2026-05-15");
    });

    expect(handleUpdate).toHaveBeenCalledWith({
      currentPenaltyEndDate: "2026-05-15",
      pendingPenaltyStartDate: "2026-05-16",
    });
  });

  it("handles pending penalty start change", () => {
    const formData: BillingPeriodInput = {
      financialYearId: 1,
      billingFrequencyId: 10,
      periodFromDate: "2026-04-01",
      periodToDate: "2026-04-30",
      dueDate: "2026-04-30",
      graceDays: 0,
      currentPenaltyStartDate: "2026-05-01",
      currentPenaltyEndDate: "2026-05-15",
      pendingPenaltyStartDate: "",
      isActive: true,
    };

    const handleChange = vi.fn();
    const handleUpdate = vi.fn();

    const { result } = renderHook(() =>
      useBillingPeriodPenaltyHandlers({
        formData,
        handleChange,
        handleUpdate,
      })
    );

    act(() => {
      result.current.handlePendingPenaltyStartChange("2026-05-20");
    });

    expect(handleChange).toHaveBeenCalledWith("pendingPenaltyStartDate", "2026-05-20");
  });
});
