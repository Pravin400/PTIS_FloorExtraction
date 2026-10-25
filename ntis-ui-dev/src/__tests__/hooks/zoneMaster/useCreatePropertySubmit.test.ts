import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useTranslations } from "next-intl";
import { useCreatePropertySubmit } from "@/hooks/zoneMaster/useCreatePropertySubmit";
import { createPropertyRangeAction } from "@/app/[locale]/property-tax/zone-master/property.actions";
import { toast } from "sonner";
import { WardItem } from "@/types/wardMaster.types";
import { CreatePropertyFormData } from "@/types/zone-master/properties/create-property-drawer.types";

// Mock dependencies
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  usePathname: () => "/property-tax/zone-master",
  useSearchParams: () => ({
    toString: () => "createProperty=true",
  }),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) => {
    if (params) {
      return `${key}_${JSON.stringify(params)}`;
    }
    return key;
  },
  useLocale: () => "en",
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/app/[locale]/property-tax/zone-master/property.actions", () => ({
  createPropertyRangeAction: vi.fn(),
}));

describe("useCreatePropertySubmit", () => {
  const mockWard: WardItem = {
    id: 1,
    wardNo: "W1",
    zoneId: 1,
    description: "Ward One",
    sequenceNo: 1,
    isActive: true,
    createdDate: "2024-01-01",
    updatedDate: null,
  };

  const mockFormData: CreatePropertyFormData = {
    propertyTypeId: "1",
    categoryId: "1",
    taxZoneId: "1",
    propertyNo: "P001",
    ownerName: "John Doe",
    societyName: "",
    isBulkCreate: false,
    fromPropertyNo: "",
    toPropertyNo: "",
  };

  const mockValidateForm = vi.fn();
  const mockResetForm = vi.fn();
  const mockOnSuccess = vi.fn();
  const mockOnClose = vi.fn();
  const mockStartTransition = vi.fn((callback) => callback());
  const mockT = vi.fn((key: string) => key) as unknown as ReturnType<typeof useTranslations<"zoneMaster">>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should not submit if validation fails", async () => {
    mockValidateForm.mockReturnValueOnce(false);

    const { result } = renderHook(() =>
      useCreatePropertySubmit({
        formData: mockFormData,
        selectedWard: mockWard,
        validateForm: mockValidateForm,
        resetForm: mockResetForm,
        onSuccess: mockOnSuccess,
        onClose: mockOnClose,
        startTransition: mockStartTransition,
        t: mockT,
      })
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(createPropertyRangeAction).not.toHaveBeenCalled();
  });

  it("should not submit if ward is not selected", async () => {
    mockValidateForm.mockReturnValueOnce(true);

    const { result } = renderHook(() =>
      useCreatePropertySubmit({
        formData: mockFormData,
        selectedWard: null,
        validateForm: mockValidateForm,
        resetForm: mockResetForm,
        onSuccess: mockOnSuccess,
        onClose: mockOnClose,
        startTransition: mockStartTransition,
        t: mockT,
      })
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(createPropertyRangeAction).not.toHaveBeenCalled();
  });

  it("should successfully create single property", async () => {
    mockValidateForm.mockReturnValueOnce(true);
    vi.mocked(createPropertyRangeAction).mockResolvedValueOnce({
      success: true,
      data: { successCount: 1, failedCount: 0, results: [] },
    });

    const { result } = renderHook(() =>
      useCreatePropertySubmit({
        formData: mockFormData,
        selectedWard: mockWard,
        validateForm: mockValidateForm,
        resetForm: mockResetForm,
        onSuccess: mockOnSuccess,
        onClose: mockOnClose,
        startTransition: mockStartTransition,
        t: mockT,
      })
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(createPropertyRangeAction).toHaveBeenCalledWith("en", {
      rangeFrom: "P001",
      rangeTo: "P001",
      template: {
        propertyTypeId: 1,
        categoryId: 1,
        taxZoneId: 1,
        wardId: 1,
        ownerName: "John Doe",
      },
      startSequenceNo: 0,
    });

    expect(toast.success).toHaveBeenCalled();
    expect(mockResetForm).toHaveBeenCalled();
    expect(mockOnSuccess).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("should successfully create bulk properties", async () => {
    const bulkFormData: CreatePropertyFormData = {
      ...mockFormData,
      isBulkCreate: true,
      propertyNo: "",
      fromPropertyNo: "100",
      toPropertyNo: "110",
    };

    mockValidateForm.mockReturnValueOnce(true);
    vi.mocked(createPropertyRangeAction).mockResolvedValueOnce({
      success: true,
      data: { successCount: 11, failedCount: 0, results: [] },
    });

    const { result } = renderHook(() =>
      useCreatePropertySubmit({
        formData: bulkFormData,
        selectedWard: mockWard,
        validateForm: mockValidateForm,
        resetForm: mockResetForm,
        onSuccess: mockOnSuccess,
        onClose: mockOnClose,
        startTransition: mockStartTransition,
        t: mockT,
      })
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(createPropertyRangeAction).toHaveBeenCalledWith("en", {
      rangeFrom: "100",
      rangeTo: "110",
      template: {
        propertyTypeId: 1,
        categoryId: 1,
        taxZoneId: 1,
        wardId: 1,
        ownerName: "John Doe",
      },
      startSequenceNo: 0,
    });

    expect(toast.success).toHaveBeenCalled();
  });

  it("should include a provided society name in the range API payload", async () => {
    mockValidateForm.mockReturnValueOnce(true);
    vi.mocked(createPropertyRangeAction).mockResolvedValueOnce({
      success: true,
      data: { successCount: 1, failedCount: 0, results: [] },
    });

    const { result } = renderHook(() =>
      useCreatePropertySubmit({
        formData: { ...mockFormData, societyName: "  Sunrise Society  " },
        selectedWard: mockWard,
        validateForm: mockValidateForm,
        resetForm: mockResetForm,
        onSuccess: mockOnSuccess,
        onClose: mockOnClose,
        startTransition: mockStartTransition,
        t: mockT,
      })
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(createPropertyRangeAction).toHaveBeenCalledWith("en", {
      rangeFrom: "P001",
      rangeTo: "P001",
      template: {
        propertyTypeId: 1,
        categoryId: 1,
        taxZoneId: 1,
        wardId: 1,
        ownerName: "John Doe",
        societyName: "Sunrise Society",
      },
      startSequenceNo: 0,
    });
  });

  it("should handle API error", async () => {
    mockValidateForm.mockReturnValueOnce(true);
    vi.mocked(createPropertyRangeAction).mockResolvedValueOnce({
      success: false,
      error: "API Error",
    });

    const { result } = renderHook(() =>
      useCreatePropertySubmit({
        formData: mockFormData,
        selectedWard: mockWard,
        validateForm: mockValidateForm,
        resetForm: mockResetForm,
        onSuccess: mockOnSuccess,
        onClose: mockOnClose,
        startTransition: mockStartTransition,
        t: mockT,
      })
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(toast.error).toHaveBeenCalledWith("API Error");
    expect(mockResetForm).not.toHaveBeenCalled();
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it("should handle close action", () => {
    const { result } = renderHook(() =>
      useCreatePropertySubmit({
        formData: mockFormData,
        selectedWard: mockWard,
        validateForm: mockValidateForm,
        resetForm: mockResetForm,
        onSuccess: mockOnSuccess,
        onClose: mockOnClose,
        startTransition: mockStartTransition,
        t: mockT,
      })
    );

    act(() => {
      result.current.handleClose();
    });

    expect(mockResetForm).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });
});
