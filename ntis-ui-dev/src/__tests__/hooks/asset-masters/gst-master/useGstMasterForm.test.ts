import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useGstMasterForm } from "@/hooks/asset-masters/gst-master/useGstMasterForm";
import * as actions from "@/app/[locale]/assets/configuration/master-data/gst-master/action";
import { GstMaster } from "@/types/asset-masters/gst-master.types";
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

vi.mock("@/app/[locale]/assets/configuration/master-data/gst-master/action", () => ({
  saveGstMaster: vi.fn(),
}));

describe("useGstMasterForm", () => {
  const mockProps = {
    initialData: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Initialization", () => {
    it("should initialize with default data when adding a new GST", () => {
      const { result } = renderHook(() => useGstMasterForm(mockProps));

      expect(result.current.isEdit).toBe(false);
      expect(result.current.formData.taxCode).toBe("");
      expect(result.current.formData.taxName).toBe("");
      expect(result.current.formData.taxPercentage).toBe("");
      expect(result.current.formData.isActive).toBe(true);
    });

    it("should initialize with provided data when editing", () => {
      const initialData: GstMaster = {
        id: 1,
        taxCode: "GST-18",
        taxName: "GST 18%",
        taxPercentage: 18,
        isActive: true,
        effectiveFromDate: "2017-07-01",
        effectiveToDate: null,
      };

      const { result } = renderHook(() =>
        useGstMasterForm({ initialData })
      );

      expect(result.current.isEdit).toBe(true);
      expect(result.current.formData.taxCode).toBe("GST-18");
      expect(result.current.formData.taxName).toBe("GST 18%");
      expect(result.current.formData.taxPercentage).toBe(18);
    });
  });

  describe("Form Handlers", () => {
    it("should update form data when handleChange is called", () => {
      const { result } = renderHook(() => useGstMasterForm(mockProps));

      act(() => {
        result.current.handleChange({
          target: { name: "taxName", value: "New GST Rate" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.formData.taxName).toBe("New GST Rate");
    });

    it("should sanitize taxCode input", () => {
      const { result } = renderHook(() => useGstMasterForm(mockProps));

      act(() => {
        result.current.handleChange({
          target: { name: "taxCode", value: "GST-18<script>" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.formData.taxCode).toBe("GST-18SCRIPT");
    });

    it("should toggle isActive state when toggled", () => {
      const { result } = renderHook(() => useGstMasterForm(mockProps));

      expect(result.current.formData.isActive).toBe(true);

      act(() => {
        result.current.setFormData(prev => ({ ...prev, isActive: false }));
      });

      expect(result.current.formData.isActive).toBe(false);
    });
  });

  describe("Form Submission", () => {
    it("should call saveGstMaster on submit when adding", async () => {
      vi.mocked(actions.saveGstMaster).mockResolvedValue({ ok: true, mode: "create" });

      const { result } = renderHook(() => useGstMasterForm(mockProps));

      act(() => {
        result.current.handleChange({
          target: { name: "taxCode", value: "GST-18" },
        } as React.ChangeEvent<HTMLInputElement>);
        result.current.handleChange({
          target: { name: "taxName", value: "GST 18 Percent" },
        } as React.ChangeEvent<HTMLInputElement>);
        result.current.handleChange({
          target: { name: "taxPercentage", value: "18" },
        } as React.ChangeEvent<HTMLInputElement>);
        result.current.handleChange({
          target: { name: "effectiveFromDate", value: "2017-07-01" },
        } as React.ChangeEvent<HTMLInputElement>);
        result.current.handleChange({
          target: { name: "effectiveToDate", value: "2026-12-31" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as FormEvent);
      });

      expect(actions.saveGstMaster).toHaveBeenCalled();
    });

    it("should show error when validation fails", async () => {
      const { result } = renderHook(() => useGstMasterForm(mockProps));

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as FormEvent);
      });

      expect(actions.saveGstMaster).not.toHaveBeenCalled();
    });
  });

  describe("Error Display", () => {
    it("should show error for field only after blur", () => {
      const { result } = renderHook(() => useGstMasterForm(mockProps));

      expect(result.current.showError("taxCode")).toBeFalsy();

      act(() => {
        result.current.handleBlur({
          target: { name: "taxCode", value: "" },
        } as React.FocusEvent<HTMLInputElement>);
      });

      expect(result.current.showError("taxCode")).toBeTruthy();
    });
  });
});
