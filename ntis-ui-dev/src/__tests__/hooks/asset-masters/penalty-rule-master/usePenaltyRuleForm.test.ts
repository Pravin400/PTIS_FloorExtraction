import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { usePenaltyRuleForm } from "@/hooks/asset-masters/penalty-rule-master/usePenaltyRuleForm";
import * as actions from "@/app/[locale]/assets/configuration/master-data/penalty-rule-master/action";
import { PenaltyRule } from "@/types/asset-masters/penalty-rule-master.types";
import { FormEvent } from "react";

// Mock dependencies
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
  }),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/app/[locale]/assets/configuration/master-data/penalty-rule-master/action", () => ({
  savePenaltyRule: vi.fn(),
}));

describe("usePenaltyRuleForm", () => {
  const mockProps = {
    initialData: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Initialization", () => {
    it("should initialize with default data when adding a new Penalty Rule", () => {
      const { result } = renderHook(() => usePenaltyRuleForm(mockProps));

      expect(result.current.isEdit).toBe(false);
      expect(result.current.formData.penaltyCode).toBe("");
      expect(result.current.formData.penaltyName).toBe("");
      expect(result.current.formData.calculationType).toBe("");
      expect(result.current.formData.penaltyValue).toBe("");
      expect(result.current.formData.gracePeriodDays).toBe("");
      expect(result.current.formData.isActive).toBe(true);
    });

    it("should initialize with provided data when editing", () => {
      const initialData: PenaltyRule = {
        id: 1,
        penaltyCode: "LATE_RENT",
        penaltyName: "Late Rent 10%",
        calculationType: "Percentage",
        penaltyValue: 10,
        gracePeriodDays: 5,
        isActive: true,
      };

      const { result } = renderHook(() =>
        usePenaltyRuleForm({ initialData })
      );

      expect(result.current.isEdit).toBe(true);
      expect(result.current.formData.penaltyCode).toBe("LATE_RENT");
      expect(result.current.formData.penaltyName).toBe("Late Rent 10%");
      expect(result.current.formData.calculationType).toBe("Percentage");
      expect(result.current.formData.penaltyValue).toBe(10);
      expect(result.current.formData.gracePeriodDays).toBe(5);
    });
  });

  describe("Form Handlers", () => {
    it("should update form data when handleChange is called", () => {
      const { result } = renderHook(() => usePenaltyRuleForm(mockProps));

      act(() => {
        result.current.handleChange({
          target: { name: "penaltyName", value: "New Penalty Rule" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.formData.penaltyName).toBe("New Penalty Rule");
    });

    it("should sanitize penaltyCode input", () => {
      const { result } = renderHook(() => usePenaltyRuleForm(mockProps));

      act(() => {
        result.current.handleChange({
          target: { name: "penaltyCode", value: "LATE_RENT<script>" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.formData.penaltyCode).toBe("LATE_RENTSCRIPT");
    });

    it("should toggle isActive state when toggled", () => {
      const { result } = renderHook(() => usePenaltyRuleForm(mockProps));

      expect(result.current.formData.isActive).toBe(true);

      act(() => {
        result.current.setFormData(prev => ({ ...prev, isActive: false }));
      });

      expect(result.current.formData.isActive).toBe(false);
    });
  });

  describe("Form Submission", () => {
    it("should call savePenaltyRule on submit when adding", async () => {
      vi.mocked(actions.savePenaltyRule).mockResolvedValue({ ok: true, mode: "create" });

      const { result } = renderHook(() => usePenaltyRuleForm(mockProps));

      act(() => {
        result.current.handleChange({
          target: { name: "penaltyCode", value: "LATE_RENT" },
        } as React.ChangeEvent<HTMLInputElement>);
        result.current.handleChange({
          target: { name: "penaltyName", value: "Late Rent 10%" },
        } as React.ChangeEvent<HTMLInputElement>);
        result.current.handleChange({
          target: { name: "calculationType", value: "Percentage" },
        } as React.ChangeEvent<HTMLInputElement>);
        result.current.handleChange({
          target: { name: "penaltyValue", value: "10" },
        } as React.ChangeEvent<HTMLInputElement>);
        result.current.handleChange({
          target: { name: "gracePeriodDays", value: "5" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as FormEvent);
      });

      expect(actions.savePenaltyRule).toHaveBeenCalled();
    });

    it("should show error when validation fails", async () => {
      const { result } = renderHook(() => usePenaltyRuleForm(mockProps));

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as FormEvent);
      });

      expect(actions.savePenaltyRule).not.toHaveBeenCalled();
    });
  });

  describe("Error Display", () => {
    it("should show error for field only after blur", () => {
      const { result } = renderHook(() => usePenaltyRuleForm(mockProps));

      expect(result.current.showError("penaltyCode")).toBeFalsy();

      act(() => {
        result.current.handleBlur({
          target: { name: "penaltyCode", value: "" },
        } as React.FocusEvent<HTMLInputElement>);
      });

      expect(result.current.showError("penaltyCode")).toBeTruthy();
    });
  });

  describe("Reference check", () => {
    it("shows the deactivate reference error under the status toggle and clears it on toggle", async () => {
      vi.mocked(actions.savePenaltyRule).mockResolvedValue({
        ok: false,
        error: "api_error",
        message: "This Penalty Rule cannot be deactivated because it is in use.",
        statusCode: 400,
      });
      const initialData: PenaltyRule = {
        id: 1,
        penaltyCode: "LATE_RENT",
        penaltyName: "Late Rent",
        calculationType: "Percentage",
        penaltyValue: 10,
        gracePeriodDays: 5,
        isActive: true,
      };
      const { result } = renderHook(() => usePenaltyRuleForm({ initialData }));

      act(() => result.current.handleStatusToggle());
      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as FormEvent);
      });

      expect(result.current.errors.isActive).toBe("apiErrors.referenceBlocked.penaltyRule.deactivateInUse");

      act(() => result.current.handleStatusToggle());
      expect(result.current.formData.isActive).toBe(true);
      expect(result.current.errors.isActive).toBe("");
    });
  });
});
