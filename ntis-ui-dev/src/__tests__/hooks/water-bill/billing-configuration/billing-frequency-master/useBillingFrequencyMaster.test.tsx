import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useBillingFrequencyMaster } from "@/hooks/water-bill/billing-configuration/billing-frequency-master/useBillingFrequencyMaster";
import type {
  BillingFrequencyMaster,
  BillingFrequencyMasterPagedResponse,
  CreateBillingFrequencyMasterDto,
} from "@/types/water-bill/billing-configuration/billingFrequencyMaster.types";

const mockPush = vi.fn();
const mockRefresh = vi.fn();
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
const mockConfirm = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

vi.mock("next-intl", () => ({
  useTranslations: (ns: string) => (key: string) => `${ns}.${key}`,
  useLocale: () => "en",
}));

vi.mock("@/components/common", () => ({
  useToast: () => ({
    success: mockToastSuccess,
    error: mockToastError,
    info: vi.fn(),
    warning: vi.fn(),
    toast: vi.fn(),
  }),
  useConfirm: () => ({
    confirm: mockConfirm,
  }),
}));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useTransition: () => [false, (fn: () => void) => fn()],
  };
});

vi.mock("@/hooks/useDebounce", () => ({
  useDebounce: (val: string) => val,
}));

describe("useBillingFrequencyMaster - Hook Tests", () => {
  const sampleRecords: BillingFrequencyMaster[] = [
    {
      id: 1,
      billingFrequencyCode: "MONTHLY",
      billingFrequency: "Monthly",
      periodsPerYear: 12,
      description: "Monthly billing",
      isActive: true,
    },
    {
      id: 2,
      billingFrequencyCode: "YEARLY",
      billingFrequency: "Yearly",
      periodsPerYear: 1,
      description: "Yearly billing",
      isActive: true,
    },
  ];

  const samplePagedData: BillingFrequencyMasterPagedResponse = {
    items: sampleRecords,
    totalCount: 2,
    pageNumber: 1,
    pageSize: 10,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with paged data properly", () => {
    const { result } = renderHook(() =>
      useBillingFrequencyMaster({
        locale: "en",
        pagedData: samplePagedData,
      })
    );

    expect(result.current.records).toEqual(sampleRecords);
    expect(result.current.pageNumber).toBe(1);
    expect(result.current.pageSize).toBe(10);
    expect(result.current.totalCount).toBe(2);
    expect(result.current.totalPages).toBe(1);
    expect(Array.isArray(result.current.columns)).toBe(true);
  });

  it("should handle navigation routes for add, edit, and close", () => {
    const { result } = renderHook(() =>
      useBillingFrequencyMaster({
        locale: "en",
        pagedData: samplePagedData,
      })
    );

    act(() => {
      result.current.handleAdd();
    });
    expect(mockPush).toHaveBeenCalledWith("/en/water-bill/billing-configuration/billing-frequency/add");

    act(() => {
      result.current.handleEdit(sampleRecords[0]);
    });
    expect(mockPush).toHaveBeenCalledWith("/en/water-bill/billing-configuration/billing-frequency/edit/1");

    act(() => {
      result.current.handleFormClose();
    });
    expect(mockPush).toHaveBeenCalledWith("/en/water-bill/billing-configuration/billing-frequency");
  });

  it("should handle search change and manual search submit", () => {
    const { result } = renderHook(() =>
      useBillingFrequencyMaster({
        locale: "en",
        pagedData: samplePagedData,
      })
    );

    act(() => {
      result.current.handleSearchChange("Monthly");
    });
    expect(result.current.search).toBe("Monthly");

    act(() => {
      result.current.handleSearchSubmit();
    });
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("searchTerm=Monthly")
    );
  });

  it("should handle sorting toggle", () => {
    const { result } = renderHook(() =>
      useBillingFrequencyMaster({
        locale: "en",
        pagedData: samplePagedData,
      })
    );

    act(() => {
      result.current.handleSort("billingFrequency");
    });
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("sortBy=billingFrequency&sortOrder=asc")
    );
  });

  it("should handle page change and page size change", () => {
    const { result } = renderHook(() =>
      useBillingFrequencyMaster({
        locale: "en",
        pagedData: samplePagedData,
      })
    );

    act(() => {
      result.current.handlePageChange(2);
    });
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("pageNumber=2")
    );

    act(() => {
      result.current.handlePageSizeChange(20);
    });
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("pageSize=20")
    );
  });

  it("should successfully handle create submission in add mode", async () => {
    const createActionMock = vi.fn().mockResolvedValue({ success: true });

    const { result } = renderHook(() =>
      useBillingFrequencyMaster({
        locale: "en",
        drawer: "add",
        createAction: createActionMock,
      })
    );

    const formData: CreateBillingFrequencyMasterDto = {
      billingFrequencyCode: "WEEKLY",
      billingFrequency: "Weekly",
      periodsPerYear: 52,
      isActive: true,
    };

    await act(async () => {
      await result.current.handleFormSubmit(formData);
    });

    expect(createActionMock).toHaveBeenCalledWith({ success: false }, formData);
    expect(mockToastSuccess).toHaveBeenCalledWith("billingFrequencyMaster.messages.createSuccess");
    expect(mockPush).toHaveBeenCalledWith("/en/water-bill/billing-configuration/billing-frequency");
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("should handle create submission error response", async () => {
    const createActionMock = vi.fn().mockResolvedValue({
      success: false,
      message: "Frequency already exists",
    });

    const { result } = renderHook(() =>
      useBillingFrequencyMaster({
        locale: "en",
        drawer: "add",
        createAction: createActionMock,
      })
    );

    await act(async () => {
      await result.current.handleFormSubmit({
        billingFrequencyCode: "MONTHLY",
        billingFrequency: "Monthly",
        periodsPerYear: 12,
        isActive: true,
      });
    });

    expect(mockToastError).toHaveBeenCalledWith("Frequency already exists");
  });

  it("should successfully handle update submission in edit mode", async () => {
    const updateActionMock = vi.fn().mockResolvedValue({ success: true });

    const { result } = renderHook(() =>
      useBillingFrequencyMaster({
        locale: "en",
        drawer: "edit",
        initialEditingData: sampleRecords[0],
        updateAction: updateActionMock,
      })
    );

    const formData: CreateBillingFrequencyMasterDto = {
      billingFrequencyCode: "MONTHLY",
      billingFrequency: "Monthly",
      periodsPerYear: 12,
      isActive: true,
    };

    await act(async () => {
      await result.current.handleFormSubmit(formData);
    });

    expect(updateActionMock).toHaveBeenCalledWith(1, { success: false }, { ...formData, id: 1 });
    expect(mockToastSuccess).toHaveBeenCalledWith("billingFrequencyMaster.messages.updateSuccess");
    expect(mockPush).toHaveBeenCalledWith("/en/water-bill/billing-configuration/billing-frequency");
  });

  it("should handle delete flow with confirmation and action execution", async () => {
    const deleteActionMock = vi.fn().mockResolvedValue({ success: true });

    mockConfirm.mockImplementation(({ onConfirm }) => {
      onConfirm();
    });

    const { result } = renderHook(() =>
      useBillingFrequencyMaster({
        locale: "en",
        pagedData: samplePagedData,
        deleteAction: deleteActionMock,
      })
    );

    act(() => {
      result.current.handleDelete(sampleRecords[0]);
    });

    expect(mockConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: "delete",
        meta: { name: "Monthly" },
      })
    );
    expect(deleteActionMock).toHaveBeenCalledWith(1);
  });
});
