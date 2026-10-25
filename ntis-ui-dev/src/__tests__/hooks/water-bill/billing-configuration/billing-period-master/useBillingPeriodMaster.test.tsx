import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useBillingPeriodMaster } from "@/hooks/water-bill/billing-configuration/billing-period-master/useBillingPeriodMaster";
import type {
  BillingPeriodMaster,
  BillingPeriodPagedResponse,
  CreateBillingPeriodDto,
} from "@/types/water-bill/billing-configuration/billingPeriodMaster.types";

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

describe("useBillingPeriodMaster - Hook Tests", () => {
  const sampleRecords: BillingPeriodMaster[] = [
    {
      id: 1,
      billingPeriodCode: "BP-1-1-1",
      financialYearId: 1,
      billingFrequencyId: 1,
      periodFromDate: "2026-04-01T00:00:00.000Z",
      periodToDate: "2026-04-30T00:00:00.000Z",
      graceDays: 0,
      isActive: true,
      financialYear: "2026",
      billingFrequency: "Monthly",
    },
  ];

  const samplePagedData: BillingPeriodPagedResponse = {
    items: sampleRecords,
    totalCount: 1,
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
      useBillingPeriodMaster({
        locale: "en",
        pagedData: samplePagedData,
      })
    );

    expect(result.current.records).toEqual(sampleRecords);
    expect(result.current.pageNumber).toBe(1);
    expect(result.current.pageSize).toBe(10);
    expect(result.current.totalCount).toBe(1);
    expect(result.current.totalPages).toBe(1);
    expect(Array.isArray(result.current.columns)).toBe(true);
  });

  it("should handle navigation routes for add, edit, and close", () => {
    const { result } = renderHook(() =>
      useBillingPeriodMaster({
        locale: "en",
        pagedData: samplePagedData,
      })
    );

    act(() => {
      result.current.handleAdd();
    });
    expect(mockPush).toHaveBeenCalledWith("/en/water-bill/billing-configuration/billing-period/add");

    act(() => {
      result.current.handleEdit(sampleRecords[0]);
    });
    expect(mockPush).toHaveBeenCalledWith("/en/water-bill/billing-configuration/billing-period/edit/1");

    act(() => {
      result.current.handleFormClose();
    });
    expect(mockPush).toHaveBeenCalledWith("/en/water-bill/billing-configuration/billing-period");
  });

  it("should handle search change and manual search submit", () => {
    const { result } = renderHook(() =>
      useBillingPeriodMaster({
        locale: "en",
        pagedData: samplePagedData,
      })
    );

    act(() => {
      result.current.handleSearchChange("BP-1");
    });
    expect(result.current.search).toBe("BP-1");

    act(() => {
      result.current.handleSearchSubmit();
    });
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("searchTerm=BP-1")
    );
  });

  it("should handle sorting toggle", () => {
    const { result } = renderHook(() =>
      useBillingPeriodMaster({
        locale: "en",
        pagedData: samplePagedData,
      })
    );

    act(() => {
      result.current.handleSort("billingPeriodCode");
    });
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("sortBy=billingPeriodCode&sortOrder=asc")
    );
  });

  it("should handle page change and page size change", () => {
    const { result } = renderHook(() =>
      useBillingPeriodMaster({
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
      useBillingPeriodMaster({
        locale: "en",
        drawer: "add",
        createAction: createActionMock,
      })
    );

    const formData: CreateBillingPeriodDto = {
      billingPeriodCode: "BP-1-1-2",
      financialYearId: 1,
      billingFrequencyId: 1,
      periodFromDate: "2026-05-01",
      periodToDate: "2026-05-31",
      graceDays: 0,
      isActive: true,
    };

    await act(async () => {
      await result.current.handleFormSubmit(formData);
    });

    expect(createActionMock).toHaveBeenCalledWith({ success: false }, formData);
    expect(mockToastSuccess).toHaveBeenCalledWith("billingPeriodMaster.messages.createSuccess");
    expect(mockPush).toHaveBeenCalledWith("/en/water-bill/billing-configuration/billing-period");
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("should handle create submission error response", async () => {
    const createActionMock = vi.fn().mockResolvedValue({
      success: false,
      message: "Period already exists",
    });

    const { result } = renderHook(() =>
      useBillingPeriodMaster({
        locale: "en",
        drawer: "add",
        createAction: createActionMock,
      })
    );

    await act(async () => {
      await result.current.handleFormSubmit({
        billingPeriodCode: "BP-1-1-1",
        financialYearId: 1,
        billingFrequencyId: 1,
        periodFromDate: "2026-04-01",
        periodToDate: "2026-04-30",
        graceDays: 0,
        isActive: true,
      });
    });

    expect(mockToastError).toHaveBeenCalledWith("Period already exists");
  });

  it("should successfully handle update submission in edit mode", async () => {
    const updateActionMock = vi.fn().mockResolvedValue({ success: true });

    const { result } = renderHook(() =>
      useBillingPeriodMaster({
        locale: "en",
        drawer: "edit",
        initialEditingData: sampleRecords[0],
        updateAction: updateActionMock,
      })
    );

    const formData: CreateBillingPeriodDto = {
      billingPeriodCode: "BP-1-1-1",
      financialYearId: 1,
      billingFrequencyId: 1,
      periodFromDate: "2026-04-01",
      periodToDate: "2026-04-30",
      graceDays: 0,
      isActive: true,
    };

    await act(async () => {
      await result.current.handleFormSubmit(formData);
    });

    expect(updateActionMock).toHaveBeenCalledWith(1, { success: false }, formData);
    expect(mockToastSuccess).toHaveBeenCalledWith("billingPeriodMaster.messages.updateSuccess");
    expect(mockPush).toHaveBeenCalledWith("/en/water-bill/billing-configuration/billing-period");
  });

  it("should handle delete flow with confirmation and action execution", async () => {
    const deleteActionMock = vi.fn().mockResolvedValue({ success: true });

    mockConfirm.mockImplementation(({ onConfirm }) => {
      onConfirm();
    });

    const { result } = renderHook(() =>
      useBillingPeriodMaster({
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
        meta: { name: "BP-1-1-1" },
      })
    );
    expect(deleteActionMock).toHaveBeenCalledWith(1);
  });
});
