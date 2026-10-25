import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAliasMasterForm } from "@/hooks/configuration-settings/alias-master/useAliasMasterForm";
import * as actions from "@/app/[locale]/configuration-settings/alias-master/action";
import type { AliasMaster } from "@/types/alias-master.types";
import type { FormEvent } from "react";

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

vi.mock("@/app/[locale]/configuration-settings/alias-master/action", () => ({
  saveAliasMaster: vi.fn(),
}));

describe("useAliasMasterForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Initialization", () => {
    it("initializes with empty defaults and isEdit=false when adding", () => {
      const { result } = renderHook(() => useAliasMasterForm({ initialData: null }));

      expect(result.current.isEdit).toBe(false);
      expect(result.current.formData.keyName).toBe("");
      expect(result.current.formData.labelName).toBe("");
      expect(result.current.formData.isActive).toBe(true);
    });

    it("initializes with provided data and isEdit=true when editing", () => {
      const initialData: AliasMaster = {
        id: 47,
        aliasKey: "ALS-000047",
        keyName: "Ward_No",
        labelName: "Ward No",
        englishName: "Sector",
        regionalName: "सेक्टर",
        hindiName: "सेक्टर",
        isActive: true,
      };

      const { result } = renderHook(() => useAliasMasterForm({ initialData }));

      expect(result.current.isEdit).toBe(true);
      expect(result.current.formData.keyName).toBe("Ward_No");
      expect(result.current.formData.englishName).toBe("Sector");
    });
  });

  describe("Form handlers", () => {
    it("updates formData when handleChange is called", () => {
      const { result } = renderHook(() => useAliasMasterForm({ initialData: null }));

      act(() => {
        result.current.handleChange({
          target: { name: "labelName", value: "Ward No" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.formData.labelName).toBe("Ward No");
    });

    it("sanitizes keyName input on change", () => {
      const { result } = renderHook(() => useAliasMasterForm({ initialData: null }));

      act(() => {
        result.current.handleChange({
          target: { name: "keyName", value: "Ward@No!!" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.formData.keyName).toBe("WardNo");
    });
  });

  describe("Form submission", () => {
    it("calls saveAliasMaster on submit when valid", async () => {
      vi.mocked(actions.saveAliasMaster).mockResolvedValue({ ok: true, mode: "create" });

      const { result } = renderHook(() => useAliasMasterForm({ initialData: null }));

      act(() => {
        result.current.handleChange({
          target: { name: "keyName", value: "Ward_No" },
        } as React.ChangeEvent<HTMLInputElement>);
        result.current.handleChange({
          target: { name: "labelName", value: "Ward No" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as FormEvent);
      });

      expect(actions.saveAliasMaster).toHaveBeenCalled();
    });

    it("does not call saveAliasMaster when required fields are missing", async () => {
      const { result } = renderHook(() => useAliasMasterForm({ initialData: null }));

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as FormEvent);
      });

      expect(actions.saveAliasMaster).not.toHaveBeenCalled();
    });
  });

  describe("Error display", () => {
    it("shows an error for a field only after it has been blurred", () => {
      const { result } = renderHook(() => useAliasMasterForm({ initialData: null }));

      expect(result.current.showError("labelName")).toBeFalsy();

      act(() => {
        result.current.handleBlur({
          target: { name: "labelName", value: "" },
        } as React.FocusEvent<HTMLInputElement>);
      });

      expect(result.current.showError("labelName")).toBeTruthy();
    });
  });
});
