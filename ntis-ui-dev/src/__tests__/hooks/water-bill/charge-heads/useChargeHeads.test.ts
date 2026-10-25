import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useChargeHeads } from "@/hooks/water-bill/charge-heads/useChargeHeads";
import type {
  ChargeHead,
  ChargeHeadsPagedResponse,
  CreateChargeHeadDto,
} from "@/types/water-bill/chargeHeads.types";

const mockPush = vi.fn();
const mockRefresh = vi.fn();
const mockRouter = {
  push: mockPush,
  refresh: mockRefresh,
};
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
const mockConfirm = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => new URLSearchParams(),
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

vi.mock("@/hooks/useDebounce", () => ({
  useDebounce: (val: string) => val,
}));

describe("useChargeHeads Hook Tests", () => {
  const sampleRecords: ChargeHead[] = [
    {
      id: 1,
      chargeHeadCode: "WTR_CHG",
      chargeHeadName: "Water Charge",
      chargeType: "Charge",
      isRefundable: false,
      sequenceNo: 1,
      isRegularPay: false,
      isActive: true,
    },
    {
      id: 2,
      chargeHeadCode: "WTR_TAX",
      chargeHeadName: "Water Tax",
      chargeType: "Tax",
      isRefundable: false,
      sequenceNo: 2,
      isRegularPay: false,
      isActive: true,
    },
  ];

  const samplePagedData: ChargeHeadsPagedResponse = {
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

  it("should initialize hook state properly with paged data", () => {
    const { result } = renderHook(() =>
      useChargeHeads({
        locale: "en",
        pagedData: samplePagedData,
      })
    );

    expect(result.current.records).toEqual(sampleRecords);
    expect(result.current.pageNumber).toBe(1);
    expect(result.current.pageSize).toBe(10);
    expect(result.current.totalCount).toBe(2);
    expect(result.current.totalPages).toBe(1);
    expect(result.current.columns.length).toBe(7);
  });

  it("should handle navigation routes for add, edit, and close", () => {
    const { result } = renderHook(() =>
      useChargeHeads({
        locale: "en",
        pagedData: samplePagedData,
      })
    );

    act(() => {
      result.current.handleAdd();
    });
    expect(mockPush).toHaveBeenCalledWith("/en/water-bill/charge-heads/add");

    act(() => {
      result.current.handleEdit(sampleRecords[0]);
    });
    expect(mockPush).toHaveBeenCalledWith("/en/water-bill/charge-heads/edit/1");

    act(() => {
      result.current.handleFormClose();
    });
    expect(mockPush).toHaveBeenCalledWith("/en/water-bill/charge-heads");
  });

  it("should handle search input change and manual submit", () => {
    const { result } = renderHook(() =>
      useChargeHeads({
        locale: "en",
        pagedData: samplePagedData,
      })
    );

    act(() => {
      result.current.handleSearchChange("WTR");
    });
    expect(result.current.search).toBe("WTR");

    act(() => {
      result.current.handleSearchSubmit();
    });
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("searchTerm=WTR"));
  });

  it("should handle page change and page size change navigation", () => {
    const { result } = renderHook(() =>
      useChargeHeads({
        locale: "en",
        pagedData: samplePagedData,
      })
    );

    act(() => {
      result.current.handlePageChange(2);
    });
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("pageNumber=2"));

    act(() => {
      result.current.handlePageSizeChange(20);
    });
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("pageSize=20"));
  });

  it("should handle successful create submission in add mode", async () => {
    const createActionMock = vi.fn().mockResolvedValue({ success: true });

    const { result } = renderHook(() =>
      useChargeHeads({
        locale: "en",
        drawer: "add",
        createAction: createActionMock,
      })
    );

    const formData: CreateChargeHeadDto = {
      chargeHeadCode: "WTR_NEW",
      chargeHeadName: "New Connection Charge",
      chargeType: "Charge",
      isRefundable: false,
      sequenceNo: 1,
      isRegularPay: false,
      isActive: true,
    };

    await act(async () => {
      await result.current.handleFormSubmit(formData);
    });

    expect(createActionMock).toHaveBeenCalledWith({ success: false }, formData);
    expect(mockToastSuccess).toHaveBeenCalledWith("chargeHeads.success.created");
    expect(mockPush).toHaveBeenCalledWith("/en/water-bill/charge-heads");
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("should handle create submission error response gracefully", async () => {
    const createActionMock = vi.fn().mockResolvedValue({
      success: false,
      message: "Charge head code already exists",
    });

    const { result } = renderHook(() =>
      useChargeHeads({
        locale: "en",
        drawer: "add",
        createAction: createActionMock,
      })
    );

    await act(async () => {
      await result.current.handleFormSubmit({
        chargeHeadCode: "WTR_CHG",
        chargeHeadName: "Water Charge",
        chargeType: "Charge",
        isRefundable: false,
        sequenceNo: 1,
        isRegularPay: false,
        isActive: true,
      });
    });

    expect(mockToastError).toHaveBeenCalledWith("Charge head code already exists");
  });

  it("should handle successful update submission in edit mode", async () => {
    const updateActionMock = vi.fn().mockResolvedValue({ success: true });

    const { result } = renderHook(() =>
      useChargeHeads({
        locale: "en",
        drawer: "edit",
        initialEditingData: sampleRecords[0],
        updateAction: updateActionMock,
      })
    );

    const formData: CreateChargeHeadDto = {
      chargeHeadCode: "WTR_CHG_UPD",
      chargeHeadName: "Water Charge Updated",
      chargeType: "Charge",
      isRefundable: false,
      sequenceNo: 1,
      isRegularPay: false,
      isActive: true,
    };

    await act(async () => {
      await result.current.handleFormSubmit(formData);
    });

    expect(updateActionMock).toHaveBeenCalledWith(1, { success: false }, formData);
    expect(mockToastSuccess).toHaveBeenCalledWith("chargeHeads.success.updated");
    expect(mockPush).toHaveBeenCalledWith("/en/water-bill/charge-heads");
  });

  it("should handle delete flow with confirmation modal and deleteAction execution", async () => {
    const deleteActionMock = vi.fn().mockResolvedValue({ success: true });

    mockConfirm.mockImplementation(({ onConfirm }) => {
      onConfirm();
    });

    const { result } = renderHook(() =>
      useChargeHeads({
        locale: "en",
        pagedData: samplePagedData,
        deleteAction: deleteActionMock,
      })
    );

    await act(async () => {
      result.current.handleDelete(sampleRecords[0]);
    });

    expect(mockConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: "delete",
        meta: { name: "Water Charge", id: 1 },
      })
    );
    expect(deleteActionMock).toHaveBeenCalledWith(1);
    expect(mockToastSuccess).toHaveBeenCalledWith("chargeHeads.success.deleted");
  });
});
