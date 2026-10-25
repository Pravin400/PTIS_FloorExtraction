import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { usePropertyTypeForm } from "@/hooks/usePropertyTypeForm";
import * as actions from "@/app/[locale]/property-tax/propertytype/action";
import { toast } from "sonner";
import { PropertyType } from "@/types/property-type.types";
import { FormEvent } from "react";

// Mock dependencies
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
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

vi.mock("@/app/[locale]/property-tax/propertytype/action", () => ({
  createPropertyTypeAction: vi.fn(),
  updatePropertyTypeAction: vi.fn(),
}));

describe("usePropertyTypeForm", () => {
  const mockProps = {
    id: null,
    onSuccess: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Initialization", () => {
    it("should initialize with default data when adding a new property type", () => {
      const { result } = renderHook(() => usePropertyTypeForm(mockProps));

      expect(result.current.isEdit).toBe(false);
      expect(result.current.formData.propertyDescription).toBe("");    
      expect(result.current.formData.type).toBe("");
      expect(result.current.formData.propertyTypeGroup).toBe(null);      
      expect(result.current.formData.isActive).toBe(true);
      expect(result.current.formData.propertyTypeCategoryId).toBe(0);
    });

    it("should initialize with provided data when editing", () => {
      const initialData: PropertyType = {
        id: 1,
        propertyDescription: "Test Property",
        descriptionEnglish: "Test English",
        type: "A",
        propertyTypeGroup: "Residential",
        searchSequence: 1,
        propertyTypeCategoryId: 2,
        isActive: true,
        createdDate: "2024-01-01",
        updatedDate: null,
      };

      const { result } = renderHook(() =>
        usePropertyTypeForm({ ...mockProps, id: 1, initialData })
      );

      expect(result.current.isEdit).toBe(true);
      expect(result.current.formData.propertyDescription).toBe("Test Property");
      expect(result.current.formData.descriptionEnglish).toBe("Test English");
      expect(result.current.formData.type).toBe("A");
      expect(result.current.formData.propertyTypeGroup).toBe("Residential");
      expect(result.current.formData.propertyTypeCategoryId).toBe(2);
    });

    it("should initialize searchSequenceValue as string", () => {
      const initialData: PropertyType = {
        id: 1,
        propertyDescription: "Test",
        type: "A",
        propertyTypeGroup: "Group",
        searchSequence: 5,
        propertyTypeCategoryId: 1,
        isActive: true,
        createdDate: "2024-01-01",
        updatedDate: null,
      };

      const { result } = renderHook(() =>
        usePropertyTypeForm({ ...mockProps, id: 1, initialData })
      );

      expect(result.current.searchSequenceValue).toBe("5");
    });
  });

  describe("Form Handlers", () => {
    it("should update form data when handleChange is called", () => {
      const { result } = renderHook(() => usePropertyTypeForm(mockProps));

      act(() => {
        result.current.handleChange({
          target: { name: "propertyDescription", value: "New Property" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.formData.propertyDescription).toBe("New Property");
    });

    it("should sanitize propertyDescription input", () => {
      const { result } = renderHook(() => usePropertyTypeForm(mockProps));

      act(() => {
        result.current.handleChange({
          target: { name: "propertyDescription", value: "Test<script>alert('xss')</script>" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      // Should strip out script tags and invalid characters
      expect(result.current.formData.propertyDescription).not.toContain("<script>");
    });

    it("should handle type field with code sanitization", () => {
      const { result } = renderHook(() => usePropertyTypeForm(mockProps));

      act(() => {
        result.current.handleChange({
          target: { name: "type", value: "ABC123" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.formData.type).toBe("ABC123");
    });

    it("should update searchSequence correctly", () => {
      const { result } = renderHook(() => usePropertyTypeForm(mockProps));

      act(() => {
        result.current.handleChange({
          target: { name: "searchSequence", value: "10" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.formData.searchSequence).toBe(10);
      expect(result.current.searchSequenceValue).toBe("10");
    });

    it("should handle empty searchSequence as 0", () => {
      const { result } = renderHook(() => usePropertyTypeForm(mockProps));

      act(() => {
        result.current.handleChange({
          target: { name: "searchSequence", value: "" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.formData.searchSequence).toBe(0);
    });

    it("should toggle status", () => {
      const { result } = renderHook(() => usePropertyTypeForm(mockProps));

      expect(result.current.isActive).toBe(true);

      act(() => {
        result.current.handleToggleStatus();
      });

      expect(result.current.isActive).toBe(false);
      expect(result.current.formData.isActive).toBe(false);

      act(() => {
        result.current.handleToggleStatus();
      });

      expect(result.current.isActive).toBe(true);
      expect(result.current.formData.isActive).toBe(true);
    });

    it("should update category when handleCategoryChange is called", () => {
      const { result } = renderHook(() => usePropertyTypeForm(mockProps));

      act(() => {
        result.current.handleCategoryChange("3");
      });

      expect(result.current.formData.propertyTypeCategoryId).toBe(3);
    });

    it("should handle empty category as 0", () => {
      const { result } = renderHook(() => usePropertyTypeForm(mockProps));

      act(() => {
        result.current.handleCategoryChange("5");
      });

      expect(result.current.formData.propertyTypeCategoryId).toBe(5);

      act(() => {
        result.current.handleCategoryChange("");
      });

      expect(result.current.formData.propertyTypeCategoryId).toBe(0);
    });
  });

  describe("Form Submission", () => {
    it("should call createPropertyTypeAction on submit when adding", async () => {
      const mockResult = { success: true, createdId: 1 };
      vi.mocked(actions.createPropertyTypeAction).mockResolvedValue(mockResult);

      const { result } = renderHook(() => usePropertyTypeForm(mockProps));

      // Fill required fields
      act(() => {
        result.current.handleChange({
          target: { name: "descriptionEnglish", value: "Test English" },
        } as React.ChangeEvent<HTMLInputElement>);
        result.current.handleChange({
          target: { name: "propertyDescription", value: "Test Property" },
        } as React.ChangeEvent<HTMLInputElement>);
        result.current.handleChange({
          target: { name: "type", value: "A" },
        } as React.ChangeEvent<HTMLInputElement>);
        result.current.handleChange({
          target: { name: "propertyTypeGroup", value: "Group" },
        } as React.ChangeEvent<HTMLInputElement>);
        result.current.handleCategoryChange("1");
        result.current.handleChange({
          target: { name: "searchSequence", value: "5" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as FormEvent);
      });

      expect(actions.createPropertyTypeAction).toHaveBeenCalled();
    });

    it("should call updatePropertyTypeAction on submit when editing", async () => {
      const mockResult = { success: true };
      vi.mocked(actions.updatePropertyTypeAction).mockResolvedValue(mockResult);

      const initialData: PropertyType = {
        id: 1,
        propertyDescription: "Test",
        descriptionEnglish: "Test English",
        type: "A",
        propertyTypeGroup: "Group",
        searchSequence: 1,
        propertyTypeCategoryId: 1,
        isActive: true,
        createdDate: "2024-01-01",
        updatedDate: null,
      };

      const { result } = renderHook(() =>
        usePropertyTypeForm({ ...mockProps, id: 1, initialData })
      );

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as FormEvent);
      });

      expect(actions.updatePropertyTypeAction).toHaveBeenCalled();
    });

    it("should show error when validation fails", async () => {
      const { result } = renderHook(() => usePropertyTypeForm(mockProps));

      // Submit without filling required fields
      const submitResult = await act(async () => {
        return await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as FormEvent);
      });

      expect(submitResult.success).toBe(false);
      expect(actions.createPropertyTypeAction).not.toHaveBeenCalled();
    });

    it("should set descriptionEnglish error to form.validation.descriptionEnglishAllZeros when value is all zeros", async () => {
      const { result } = renderHook(() => usePropertyTypeForm(mockProps));

      act(() => {
        result.current.handleChange({
          target: { name: "descriptionEnglish", value: "000" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as FormEvent);
      });

      expect(result.current.errors.descriptionEnglish).toBe("form.validation.descriptionEnglishAllZeros");
    });

    it("should set descriptionEnglish error to form.validation.englishOnly when value has invalid English format (such as double spaces)", async () => {
      const { result } = renderHook(() => usePropertyTypeForm(mockProps));

      act(() => {
        result.current.handleChange({
          target: { name: "descriptionEnglish", value: "Test  Description" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as FormEvent);
      });

      expect(result.current.errors.descriptionEnglish).toBe("form.validation.englishOnly");
    });

    it("should show error toast on API failure", async () => {
      const mockResult = { success: false, message: "API Error" };
      vi.mocked(actions.createPropertyTypeAction).mockResolvedValue(mockResult);

      const { result } = renderHook(() => usePropertyTypeForm(mockProps));

      // Fill required fields
      act(() => {
        result.current.handleChange({
          target: { name: "descriptionEnglish", value: "Test English" },
        } as React.ChangeEvent<HTMLInputElement>);
        result.current.handleChange({
          target: { name: "propertyDescription", value: "Test" },
        } as React.ChangeEvent<HTMLInputElement>);
        result.current.handleChange({
          target: { name: "type", value: "A" },
        } as React.ChangeEvent<HTMLInputElement>);
        result.current.handleChange({
          target: { name: "propertyTypeGroup", value: "Group" },
        } as React.ChangeEvent<HTMLInputElement>);
        result.current.handleCategoryChange("1");
        result.current.handleChange({
          target: { name: "searchSequence", value: "5" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as FormEvent);
      });

      expect(toast.error).toHaveBeenCalled();
    });
  });

  describe("Error Display", () => {
    it("should show error for field only after submission or blur", () => {
      const { result } = renderHook(() => usePropertyTypeForm(mockProps));

      // Initially, errors should not be visible (falsy value)
      expect(result.current.showError("propertyDescription")).toBeFalsy();

      // After blur on empty required field, error should be visible
      act(() => {
        result.current.handleBlur({
          target: { name: "propertyDescription", value: "" },
        } as React.FocusEvent<HTMLInputElement>);
      });

      expect(result.current.showError("propertyDescription")).toBeTruthy();
    });
  });

  describe("Drawer State", () => {
    it("should start with drawer open", () => {
      const { result } = renderHook(() => usePropertyTypeForm(mockProps));
      expect(result.current.open).toBe(true);
    });
  });
});
