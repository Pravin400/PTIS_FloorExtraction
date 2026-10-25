import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useOwningDepartmentForm } from "@/hooks/asset-masters/owning-department/useOwningDepartmentForm";
import * as actions from "@/app/[locale]/assets/configuration/master-data/owning-department/action";
import type { OwningDepartment } from "@/types/asset-masters/owning-department.types";
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

vi.mock("@/app/[locale]/assets/configuration/master-data/owning-department/action", () => ({
  saveOwningDepartment: vi.fn(),
}));

describe("useOwningDepartmentForm", () => {
  const mockProps = {
    initialData: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Initialization", () => {
    it("should initialize with default data when adding a new department", () => {
      const { result } = renderHook(() => useOwningDepartmentForm(mockProps));

      expect(result.current.isEdit).toBe(false);
      expect(result.current.formData.owningDepartmentName).toBe("");
      expect(result.current.formData.description).toBe("");
      expect(result.current.formData.isActive).toBe(true);
    });

    it("should initialize with provided data when editing", () => {
      const initialData: OwningDepartment = {
        id: 1,
        owningDepartmentName: "General Admin",
        description: "General administration",
        isActive: true,
        createdDate: null,
        updatedDate: null,
      };

      const { result } = renderHook(() =>
        useOwningDepartmentForm({ initialData })
      );

      expect(result.current.isEdit).toBe(true);
      expect(result.current.formData.owningDepartmentName).toBe("General Admin");
      expect(result.current.formData.description).toBe("General administration");
    });
  });

  describe("Form Handlers", () => {
    it("should update form data when handleChange is called", () => {
      const { result } = renderHook(() => useOwningDepartmentForm(mockProps));

      act(() => {
        result.current.handleChange({
          target: { name: "owningDepartmentName", value: "New Dept Name" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.formData.owningDepartmentName).toBe("New Dept Name");
    });

    it("should toggle isActive state when setFormData is called", () => {
      const { result } = renderHook(() => useOwningDepartmentForm(mockProps));

      expect(result.current.formData.isActive).toBe(true);

      act(() => {
        result.current.setFormData(prev => ({ ...prev, isActive: false }));
      });

      expect(result.current.formData.isActive).toBe(false);
    });
  });

  describe("Form Submission", () => {
    it("should call saveOwningDepartment on submit when adding", async () => {
      vi.mocked(actions.saveOwningDepartment).mockResolvedValue({ ok: true, mode: "create" });

      const { result } = renderHook(() => useOwningDepartmentForm(mockProps));

      act(() => {
        result.current.handleChange({
          target: { name: "owningDepartmentName", value: "General Admin" },
        } as React.ChangeEvent<HTMLInputElement>);
        result.current.handleChange({
          target: { name: "description", value: "General administration" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as FormEvent);
      });

      expect(actions.saveOwningDepartment).toHaveBeenCalled();
    });
  });

  describe("Reference check", () => {
    it("shows the deactivate reference error under the status toggle and clears it on toggle", async () => {
      vi.mocked(actions.saveOwningDepartment).mockResolvedValue({
        ok: false,
        error: "api_error",
        message: "This Owning Department cannot be deactivated because it has Designations. Please delete all Designations for this Owning Department first.",
        statusCode: 400,
      });
      const initialData: OwningDepartment = {
        id: 1,
        owningDepartmentName: "General Admin",
        description: "General administration",
        isActive: true,
        createdDate: null,
        updatedDate: null,
      };
      const { result } = renderHook(() => useOwningDepartmentForm({ initialData }));

      act(() => result.current.handleStatusToggle());
      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as FormEvent);
      });

      expect(result.current.errors.isActive).toBe("apiErrors.referenceBlocked.owningDepartment.deactivateHasMasters");

      act(() => result.current.handleStatusToggle());
      expect(result.current.formData.isActive).toBe(true);
      expect(result.current.errors.isActive).toBe("");
    });
  });
});
