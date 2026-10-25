import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { usePenaltyRuleForm } from "@/hooks/water-bill/penalty-rule-master/usePenaltyRuleForm";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { WaterPenaltyRuleDto } from "@/types/water-bill/penalty-rule-master.types";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/app/[locale]/water-bill/penalty-rule-master/action", () => ({
  savePenaltyRuleAction: vi.fn(),
}));

describe("usePenaltyRuleForm", () => {
  const mockPush = vi.fn();
  const mockRefresh = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    } as unknown as ReturnType<typeof useRouter>);
  });

  it("initializes create form with default empty data", () => {
    const { result } = renderHook(() => usePenaltyRuleForm({ open: true }));

    expect(result.current.isEdit).toBe(false);
    expect(result.current.formData.penaltyType).toBe("Percentage");
    expect(result.current.formData.isActive).toBe(true);
    expect(result.current.formData.isCurrentBill).toBe(true);
  });

  it("initializes edit form with initialData", () => {
    const initialData: WaterPenaltyRuleDto = {
      penaltyRuleId: 42,
      financialYearId: 2,
      financialYearName: "2026-27",
      connectionCategoryId: 3,
      geographyUnitId: 1,
      chargeHeadId: 4,
      penaltyType: "Percentage",
      fromDay: 15,
      toDay: 30,
      percentageRate: 2.5,
      effectiveFrom: "2026-04-01T00:00:00",
      effectiveTo: "2027-03-31T00:00:00",
      isCurrentBill: true,
      isPendingBill: false,
      isActive: true,
    };

    const { result } = renderHook(() =>
      usePenaltyRuleForm({ open: true, initialData })
    );

    expect(result.current.isEdit).toBe(true);
    expect(result.current.formData.financialYearId).toBe(2);
    expect(result.current.formData.connectionCategoryId).toBe(3);
    expect(result.current.formData.fromDay).toBe(15);
    expect(result.current.formData.toDay).toBe(30);
    expect(result.current.formData.effectiveFrom).toBe("2026-04-01");
    expect(result.current.formData.effectiveTo).toBe("2027-03-31");
  });

  it("toggles active status correctly", () => {
    const { result } = renderHook(() => usePenaltyRuleForm({ open: true }));

    expect(result.current.formData.isActive).toBe(true);

    act(() => {
      result.current.handleToggleStatus(false);
    });

    expect(result.current.formData.isActive).toBe(false);

    act(() => {
      result.current.handleToggleStatus();
    });

    expect(result.current.formData.isActive).toBe(true);
  });

  it("closes form and navigates back when onClose not provided", () => {
    const { result } = renderHook(() =>
      usePenaltyRuleForm({ open: true, listPath: "/water-bill/penalty-rule-master" })
    );

    act(() => {
      result.current.handleClose();
    });

    expect(mockPush).toHaveBeenCalledWith("/en/water-bill/penalty-rule-master");
  });

  it("validates financial year required on submit", async () => {
    const { result } = renderHook(() => usePenaltyRuleForm({ open: true }));

    const fakeEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;

    await act(async () => {
      await result.current.handleSubmit(fakeEvent);
    });

    expect(toast.error).toHaveBeenCalled();
  });

  it("submits valid form data through onSave callback", async () => {
    const onSave = vi.fn().mockResolvedValue({ success: true });
    const onClose = vi.fn();

    const initialData: WaterPenaltyRuleDto = {
      penaltyRuleId: 1,
      financialYearId: 1,
      penaltyType: "Flat",
      fromDay: 0,
      toDay: 10,
      flatAmount: 100,
      effectiveFrom: "2026-04-01T00:00:00",
      effectiveTo: "2027-03-31T00:00:00",
      isCurrentBill: true,
      isPendingBill: false,
      isActive: true,
    };

    const { result } = renderHook(() =>
      usePenaltyRuleForm({ open: true, initialData, onSave, onClose })
    );

    const fakeEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;

    await act(async () => {
      await result.current.handleSubmit(fakeEvent);
    });

    expect(onSave).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
