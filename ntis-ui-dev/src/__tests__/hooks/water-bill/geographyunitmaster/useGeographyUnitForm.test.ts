import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useGeographyUnitForm } from "@/hooks/water-bill/geographyunitmaster/useGeographyUnitForm";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import {
  createGeographyUnitAction,
  updateGeographyUnitAction,
  fetchGeographyTypeOptionsAction,
  fetchParentUnitCandidatesAction,
} from "@/app/[locale]/water-bill/geography-unit-master/action";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    refresh: vi.fn(),
  })),
}));

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(() => (key: string) => key),
  useLocale: vi.fn(() => "en"),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/app/[locale]/water-bill/geography-unit-master/action", () => ({
  createGeographyUnitAction: vi.fn(),
  updateGeographyUnitAction: vi.fn(),
  fetchGeographyTypeOptionsAction: vi.fn(),
  fetchParentUnitCandidatesAction: vi.fn(),
}));

const TYPE_OPTIONS = [
  { id: 1, geographyTypeCode: "ZONE",
    geographyType: "Zone", levelNo: 1, isActive: true, createdDate: "", updatedDate: null },
];

const PARENT_CANDIDATES = [
  {
    id: 5,
    geographyUnitCode: "Z1",
    geographyUnitName: "Zone 1",
  },
];

describe("useGeographyUnitForm", () => {
  const mockOnSuccess = vi.fn();
  const mockOnCancel = vi.fn();
  const mockRouter = {
    push: vi.fn(),
    refresh: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue(mockRouter as unknown as ReturnType<typeof useRouter>);
    vi.mocked(useTranslations).mockReturnValue(((key: string) => key) as unknown as ReturnType<typeof useTranslations>);
    vi.mocked(useLocale).mockReturnValue("en");
    vi.mocked(fetchGeographyTypeOptionsAction).mockResolvedValue(TYPE_OPTIONS);
    vi.mocked(fetchParentUnitCandidatesAction).mockResolvedValue(PARENT_CANDIDATES);
  });

  const defaultProps = {
    id: null,
    onSuccess: mockOnSuccess,
    onCancel: mockOnCancel,
  };

  it("should initialize with default values for create mode", () => {
    const { result } = renderHook(() => useGeographyUnitForm(defaultProps));

    expect(result.current.formData.geographyUnitCode).toBe("");
    expect(result.current.formData.geographyTypeId).toBe("");
    expect(result.current.formData.parentGeographyUnitId).toBeNull();
    expect(result.current.isEdit).toBe(false);
    expect(result.current.isActive).toBe(true);
  });

  it("should initialize with initial data for edit mode", () => {
    const initialData = {
      id: 123,
      geographyTypeId: 2,
      geographyTypeCode: "ZONE1",
    geographyType: "Ward",
      parentGeographyUnitId: 1,
      parentGeographyUnitName: "Zone 1",
      geographyUnitCode: "UT1",
      geographyUnitName: "UT1",
      searchSequence: 1,
      markedForDeletion: false,
      markedForDeletionDate: null,
      isActive: false,
      createdDate: "",
      updatedDate: null,
    };

    const { result } = renderHook(() =>
      useGeographyUnitForm({ ...defaultProps, id: 123, initialData })
    );

    expect(result.current.formData.geographyUnitCode).toBe("UT1");
    expect(result.current.formData.geographyTypeId).toBe(2);
    expect(result.current.formData.parentGeographyUnitId).toBe(1);
    expect(result.current.isEdit).toBe(true);
    expect(result.current.isActive).toBe(false);
  });

  it("should load geography type options on mount", async () => {
    const { result } = renderHook(() => useGeographyUnitForm({ ...defaultProps, id: 5 }));

    await waitFor(() => {
      expect(result.current.optionsLoading).toBe(false);
    });

    expect(result.current.geographyTypeOptions).toEqual(TYPE_OPTIONS);
    expect(result.current.parentUnitOptions).toEqual([]);
  });

  it("should load parent unit candidates for the selected geography type, excluding the record itself", async () => {
    const initialData = {
      id: 5,
      geographyTypeId: 1,
      geographyTypeCode: "ZONE1",
      geographyType: "Zone",
      parentGeographyUnitId: null,
      parentGeographyUnitName: null,
      geographyUnitCode: "Z1",
      geographyUnitName: "Zone 1",
      searchSequence: 1,
      markedForDeletion: false,
      markedForDeletionDate: null,
      isActive: true,
      createdDate: "",
      updatedDate: null,
    };

    const { result } = renderHook(() =>
      useGeographyUnitForm({ ...defaultProps, id: 5, initialData })
    );

    await waitFor(() => {
      expect(fetchParentUnitCandidatesAction).toHaveBeenCalledWith(1);
    });

    await waitFor(() => {
      expect(result.current.parentUnitOptions).toEqual([]);
    });
  });

  it("should handle input changes", () => {
    const { result } = renderHook(() => useGeographyUnitForm(defaultProps));

    act(() => {
      result.current.handleChange({
        target: { name: "geographyUnitCode", value: "newcode" },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.formData.geographyUnitCode).toBe("NEWCODE");
  });

  it("should handle geography type dropdown change", () => {
    const { result } = renderHook(() => useGeographyUnitForm(defaultProps));

    act(() => {
      result.current.handleGeographyTypeChange("1");
    });

    expect(result.current.formData.geographyTypeId).toBe(1);
  });

  it("should handle parent unit dropdown change, including clearing it", () => {
    const { result } = renderHook(() => useGeographyUnitForm(defaultProps));

    act(() => {
      result.current.handleParentUnitChange("5");
    });
    expect(result.current.formData.parentGeographyUnitId).toBe(5);

    act(() => {
      result.current.handleParentUnitChange("");
    });
    expect(result.current.formData.parentGeographyUnitId).toBeNull();
  });

  it("should handle status toggle", () => {
    const { result } = renderHook(() => useGeographyUnitForm(defaultProps));

    act(() => {
      result.current.handleToggleStatus();
    });

    expect(result.current.isActive).toBe(false);
    expect(result.current.formData.isActive).toBe(false);
  });

  it("should validate and show errors on submit, including missing geography type", async () => {
    const { result } = renderHook(() => useGeographyUnitForm(defaultProps));

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    expect(result.current.errors.geographyUnitCode).toBeDefined();
    expect(result.current.errors.geographyTypeId).toBeDefined();
    expect(createGeographyUnitAction).not.toHaveBeenCalled();
  });

  it("should call create action on successful submit", async () => {
    vi.mocked(createGeographyUnitAction).mockResolvedValue({ success: true });

    const { result } = renderHook(() => useGeographyUnitForm(defaultProps));

    act(() => {
      result.current.handleGeographyTypeChange("1");
      result.current.handleChange({
        target: { name: "geographyUnitCode", value: "Z1" },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
      result.current.handleChange({
        target: { name: "geographyUnitName", value: "Zone One" },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
      result.current.handleChange({
        target: { name: "searchSequence", value: "1" },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    expect(createGeographyUnitAction).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalled();
    expect(mockOnSuccess).toHaveBeenCalled();
  });

  it("should call update action in edit mode", async () => {
    vi.mocked(updateGeographyUnitAction).mockResolvedValue({ success: true });

    const initialData = {
      id: 123,
      geographyTypeId: 1,
      geographyTypeCode: "ZONE1",
    geographyType: "Zone",
      parentGeographyUnitId: null,
      parentGeographyUnitName: null,
      geographyUnitCode: "Z1",
      geographyUnitName: "Zone 1",
      searchSequence: 1,
      markedForDeletion: false,
      markedForDeletionDate: null,
      isActive: true,
      createdDate: "",
      updatedDate: null,
    };

    const { result } = renderHook(() =>
      useGeographyUnitForm({ ...defaultProps, id: 123, initialData })
    );

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    expect(updateGeographyUnitAction).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalled();
  });

  it("should show error toast when unit name contains only numbers", async () => {
    const { result } = renderHook(() => useGeographyUnitForm(defaultProps));

    act(() => {
      result.current.handleGeographyTypeChange("1");
      result.current.handleChange({
        target: { name: "geographyUnitCode", value: "Z1" },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
      result.current.handleChange({
        target: { name: "geographyUnitName", value: "12345" },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
      result.current.handleChange({
        target: { name: "searchSequence", value: "1" },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    expect(toast.error).toHaveBeenCalledWith("form.validation.unitNameNumbersOnlyNotAllowed");
    expect(createGeographyUnitAction).not.toHaveBeenCalled();
  });

  it("should handle cancel", () => {
    const { result } = renderHook(() => useGeographyUnitForm(defaultProps));

    act(() => {
      result.current.handleCancel();
    });

    expect(mockOnCancel).toHaveBeenCalled();
  });
});
