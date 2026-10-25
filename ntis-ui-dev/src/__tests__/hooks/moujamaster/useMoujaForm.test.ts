import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useMoujaForm } from "@/hooks/moujamaster/useMoujaForm";
import * as actions from "@/app/[locale]/property-tax/moujamaster/action";
import { toast } from "sonner";
import { Mouja } from "@/types/mouja.types";
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

vi.mock("@/app/[locale]/property-tax/moujamaster/action", () => ({
  createMoujaAction: vi.fn(),
  updateMoujaAction: vi.fn(),
}));

describe("useMoujaForm", () => {
  const mockProps = {
    id: null,
    onSuccess: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Initialization", () => {
    it("should initialize with default data when adding a new mouja", () => {
      const { result } = renderHook(() => useMoujaForm(mockProps));

      expect(result.current.isEdit).toBe(false);
      expect(result.current.formData.moujaNo).toBe("");
      expect(result.current.formData.moujaName).toBe("");
      expect(result.current.formData.isActive).toBe(true);
    });

    it("should initialize with provided data when editing", () => {
      const initialData: Mouja = {
        id: 1,
        moujaNo: "M001",
        moujaName: "Test Mouja",
        isActive: true,
        createdDate: "2024-01-01",
        updatedDate: null,
      };

      const { result } = renderHook(() =>
        useMoujaForm({ ...mockProps, id: 1, initialData })
      );

      expect(result.current.isEdit).toBe(true);
      expect(result.current.formData.moujaNo).toBe("M001");
      expect(result.current.formData.moujaName).toBe("Test Mouja");
      expect(result.current.formData.isActive).toBe(true);
    });

    it("should initialize with open drawer", () => {
      const { result } = renderHook(() => useMoujaForm(mockProps));

      expect(result.current.open).toBe(true);
    });
  });

  describe("Form Validation", () => {
    it("should validate required moujaNo field", () => {
      const { result } = renderHook(() => useMoujaForm(mockProps));

      act(() => {
        result.current.handleBlur({
          target: { name: "moujaNo", value: "" },
        } as React.FocusEvent<HTMLInputElement>);
      });

      expect(result.current.errors.moujaNo).toBeDefined();
    });

    it("should validate required moujaName field", () => {
      const { result } = renderHook(() => useMoujaForm(mockProps));

      act(() => {
        result.current.handleBlur({
          target: { name: "moujaName", value: "" },
        } as React.FocusEvent<HTMLInputElement>);
      });

      expect(result.current.errors.moujaName).toBeDefined();
    });

    it("should accept valid moujaNo", () => {
      const { result } = renderHook(() => useMoujaForm(mockProps));

      act(() => {
        result.current.handleChange({
          target: { name: "moujaNo", value: "M001" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      act(() => {
        result.current.handleBlur({
          target: { name: "moujaNo", value: "M001" },
        } as React.FocusEvent<HTMLInputElement>);
      });

      expect(result.current.errors.moujaNo).toBeUndefined();
    });

    it("should accept valid moujaNo with decimal values", () => {
      const { result } = renderHook(() => useMoujaForm(mockProps));

      act(() => {
        result.current.handleChange({
          target: { name: "moujaNo", value: "12.5" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      act(() => {
        result.current.handleBlur({
          target: { name: "moujaNo", value: "12.5" },
        } as React.FocusEvent<HTMLInputElement>);
      });

      expect(result.current.errors.moujaNo).toBeUndefined();
    });

    it("should accept valid moujaName", () => {
      const { result } = renderHook(() => useMoujaForm(mockProps));

      act(() => {
        result.current.handleChange({
          target: { name: "moujaName", value: "Test Mouja" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      act(() => {
        result.current.handleBlur({
          target: { name: "moujaName", value: "Test Mouja" },
        } as React.FocusEvent<HTMLInputElement>);
      });

      expect(result.current.errors.moujaName).toBeUndefined();
    });
  });

  describe("Field Updates", () => {
    it("should update moujaNo on change", () => {
      const { result } = renderHook(() => useMoujaForm(mockProps));

      act(() => {
        result.current.handleChange({
          target: { name: "moujaNo", value: "M001" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.formData.moujaNo).toBe("M001");
    });

    it("should update moujaName on change", () => {
      const { result } = renderHook(() => useMoujaForm(mockProps));

      act(() => {
        result.current.handleChange({
          target: { name: "moujaName", value: "Test Mouja" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.formData.moujaName).toBe("Test Mouja");
    });

    it("should sanitize moujaNo by removing special characters", () => {
      const { result } = renderHook(() => useMoujaForm(mockProps));

      act(() => {
        result.current.handleChange({
          target: { name: "moujaNo", value: "M<>001" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.formData.moujaNo).not.toContain("<");
      expect(result.current.formData.moujaNo).not.toContain(">");
    });

    it("should sanitize moujaName by removing special characters", () => {
      const { result } = renderHook(() => useMoujaForm(mockProps));

      act(() => {
        result.current.handleChange({
          target: { name: "moujaName", value: "Test<>Mouja" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.formData.moujaName).not.toContain("<");
      expect(result.current.formData.moujaName).not.toContain(">");
    });
  });

  describe("Status Toggle", () => {
    it("should toggle isActive status", () => {
      const { result } = renderHook(() => useMoujaForm(mockProps));

      expect(result.current.isActive).toBe(true);

      act(() => {
        result.current.handleToggleStatus();
      });

      expect(result.current.isActive).toBe(false);

      act(() => {
        result.current.handleToggleStatus();
      });

      expect(result.current.isActive).toBe(true);
    });
  });

  describe("Form Submission - Create", () => {
    it("should successfully create a new mouja", async () => {
      const createMock = vi.mocked(actions.createMoujaAction);
      createMock.mockResolvedValue({
        success: true,
        statusCode: 201,
      });

      const { result } = renderHook(() => useMoujaForm(mockProps));

      act(() => {
        result.current.handleChange({
          target: { name: "moujaNo", value: "M001" },
        } as React.ChangeEvent<HTMLInputElement>);
        result.current.handleChange({
          target: { name: "moujaName", value: "Test Mouja" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: vi.fn(),
        } as unknown as FormEvent);
      });

      expect(createMock).toHaveBeenCalledWith(
        expect.objectContaining({
          moujaNo: "M001",
          moujaName: "Test Mouja",
          isActive: true,
        })
      );
      expect(toast.success).toHaveBeenCalled();
    });

    it("should prevent submission with validation errors", async () => {
      const createMock = vi.mocked(actions.createMoujaAction);

      const { result } = renderHook(() => useMoujaForm(mockProps));

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: vi.fn(),
        } as unknown as FormEvent);
      });

      expect(createMock).not.toHaveBeenCalled();
      expect(Object.keys(result.current.errors).length).toBeGreaterThan(0);
    });

    it("should handle create API error", async () => {
      const createMock = vi.mocked(actions.createMoujaAction);
      createMock.mockResolvedValue({
        success: false,
        statusCode: 409,
        message: "Duplicate record",
      });

      const { result } = renderHook(() => useMoujaForm(mockProps));

      act(() => {
        result.current.handleChange({
          target: { name: "moujaNo", value: "M001" },
        } as React.ChangeEvent<HTMLInputElement>);
        result.current.handleChange({
          target: { name: "moujaName", value: "Test Mouja" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: vi.fn(),
        } as unknown as FormEvent);
      });

      expect(toast.error).toHaveBeenCalled();
    });
  });

  describe("Form Submission - Update", () => {
    it("should successfully update existing mouja", async () => {
      const updateMock = vi.mocked(actions.updateMoujaAction);
      updateMock.mockResolvedValue({
        success: true,
        statusCode: 200,
      });

      const initialData: Mouja = {
        id: 1,
        moujaNo: "M001",
        moujaName: "Test Mouja",
        isActive: true,
        createdDate: "2024-01-01",
        updatedDate: null,
      };

      const { result } = renderHook(() =>
        useMoujaForm({ ...mockProps, id: 1, initialData })
      );

      act(() => {
        result.current.handleChange({
          target: { name: "moujaName", value: "Updated Mouja" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: vi.fn(),
        } as unknown as FormEvent);
      });

      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          moujaNo: "M001",
          moujaName: "Updated Mouja",
        })
      );
      expect(toast.success).toHaveBeenCalled();
    });
  });

  describe("Cancel Handler", () => {
    it("should call onCancel callback", () => {
      const { result } = renderHook(() => useMoujaForm(mockProps));

      act(() => {
        result.current.handleCancel();
      });

      expect(mockProps.onCancel).toHaveBeenCalled();
    });

    it("should close drawer", () => {
      const { result } = renderHook(() => useMoujaForm(mockProps));

      act(() => {
        result.current.handleCancel();
      });

      expect(result.current.open).toBe(false);
    });
  });

  describe("Error Display", () => {
    it("should show error when field is touched and has error", () => {
      const { result } = renderHook(() => useMoujaForm(mockProps));

      act(() => {
        result.current.handleBlur({
          target: { name: "moujaNo", value: "" },
        } as React.FocusEvent<HTMLInputElement>);
      });

      expect(result.current.showError("moujaNo")).toBe(true);
    });

    it("should not show error when field is not touched", () => {
      const { result } = renderHook(() => useMoujaForm(mockProps));

      expect(result.current.showError("moujaNo")).toBeFalsy();
    });

    it("should show error after form submission attempt", async () => {
      const { result } = renderHook(() => useMoujaForm(mockProps));

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: vi.fn(),
        } as unknown as FormEvent);
      });

      expect(result.current.showError("moujaNo")).toBe(true);
      expect(result.current.showError("moujaName")).toBe(true);
    });
  });
});
