import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useTariffWorkbench } from "@/hooks/water-bill/tariff-workbench/useTariffWorkbench";
import type {
  TariffWorkbench as TariffWorkbenchType,
  TariffWorkbenchPagedResponse,
  CreateTariffWorkbenchDto,
} from "@/types/water-bill/tariff-workbench/tariffWorkbench.types";

const mockPush = vi.fn();
const mockRefresh = vi.fn();
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
const mockConfirm = vi.fn();

const mockRouter = {
  push: mockPush,
  refresh: mockRefresh,
};

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
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

describe("useTariffWorkbench Hook Tests", () => {
  const sampleRecords: TariffWorkbenchType[] = [
    {
      id: 1,
      tariffCode: "RES-MTR-2026",
      tariffName: "Residential Metered",
      financialYearId: 1,
      connectionTypeId: 1,
      connectionCategoryId: 1,
      effectiveFrom: "2026-04-01T00:00:00.000Z",
      effectiveTo: "2027-03-31T00:00:00.000Z",
      versionNo: 1,
      status: "Published",
      description: "Sample Description",
      isActive: true,
      financialYearCode: "2026-27",
      connectionTypeName: "Residential",
      connectionCategoryName: "Regular",
      slabsCount: 2,
    },
    {
      id: 2,
      tariffCode: "COM-ANN-2026",
      tariffName: "Commercial Annual",
      financialYearId: 1,
      connectionTypeId: 2,
      connectionCategoryId: 2,
      effectiveFrom: "2026-04-01T00:00:00.000Z",
      effectiveTo: "2027-03-31T00:00:00.000Z",
      versionNo: 1,
      status: "Draft",
      description: "Sample Description",
      isActive: false,
      financialYearCode: "2026-27",
      connectionTypeName: "Commercial",
      connectionCategoryName: "Annual",
      slabsCount: 0,
    },
  ];

  const samplePagedData: TariffWorkbenchPagedResponse = {
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
      useTariffWorkbench({
        locale: "en",
        pagedData: samplePagedData,
      })
    );

    expect(result.current.records).toEqual(sampleRecords);
    expect(result.current.pageNumber).toBe(1);
    expect(result.current.pageSize).toBe(10);
    expect(result.current.totalCount).toBe(2);
    expect(result.current.totalPages).toBe(1);
    expect(result.current.columns.length).toBe(11);
  });

  it("should handle navigation routes for add, edit, and close", () => {
    const { result } = renderHook(() =>
      useTariffWorkbench({
        locale: "en",
        pagedData: samplePagedData,
      })
    );

    act(() => {
      result.current.handleAdd();
    });
    expect(mockPush).toHaveBeenCalledWith("/en/water-bill/tariff-workbench/master/add");

    act(() => {
      result.current.handleEdit(sampleRecords[0]);
    });
    expect(mockPush).toHaveBeenCalledWith("/en/water-bill/tariff-workbench/master/edit/1");

    act(() => {
      result.current.handleFormClose();
    });
    expect(mockPush).toHaveBeenCalledWith("/en/water-bill/tariff-workbench/master");
  });

  it("should handle navigation routes for view rate slabs with and without id", () => {
    const { result } = renderHook(() =>
      useTariffWorkbench({
        locale: "en",
        pagedData: samplePagedData,
      })
    );

    act(() => {
      result.current.handleViewRateSlabs(sampleRecords[0]);
    });
    expect(mockPush).toHaveBeenCalledWith("/en/water-bill/tariff-workbench/slabs?tariffId=1");

    act(() => {
      result.current.handleViewRateSlabs({ ...sampleRecords[0], id: 0 });
    });
    expect(mockPush).toHaveBeenCalledWith("/en/water-bill/tariff-workbench/slabs");
  });

  it("should handle search change and manual search submit", () => {
    const { result } = renderHook(() =>
      useTariffWorkbench({
        locale: "en",
        pagedData: samplePagedData,
      })
    );

    act(() => {
      result.current.handleSearchChange("RES-MTR");
    });
    expect(result.current.search).toBe("RES-MTR");

    act(() => {
      result.current.handleSearchSubmit();
    });
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("searchTerm=RES-MTR"));
  });

  it("should handle sorting toggle", () => {
    const { result } = renderHook(() =>
      useTariffWorkbench({
        locale: "en",
        pagedData: samplePagedData,
      })
    );

    act(() => {
      result.current.handleSort("tariffCode");
    });
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("sortBy=tariffCode&sortOrder=asc"));
  });

  it("should handle page change and page size change", () => {
    const { result } = renderHook(() =>
      useTariffWorkbench({
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
      useTariffWorkbench({
        locale: "en",
        drawer: "add",
        createAction: createActionMock,
      })
    );

    const formData: CreateTariffWorkbenchDto = {
      tariffCode: "RES-MTR-2027",
      tariffName: "Residential Metered 2027",
      financialYearId: 1,
      connectionTypeId: 1,
      connectionCategoryId: 1,
      effectiveFrom: "2027-04-01",
      effectiveTo: "2028-03-31",
      versionNo: 1,
      status: "Draft",
      description: "New Tariff",
      isActive: true,
    };

    await act(async () => {
      await result.current.handleFormSubmit(formData);
    });

    expect(createActionMock).toHaveBeenCalledWith({ success: false }, formData);
    expect(mockToastSuccess).toHaveBeenCalledWith("tariffWorkbench.messages.createSuccess");
    expect(mockPush).toHaveBeenCalledWith("/en/water-bill/tariff-workbench/master");
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("should handle create submission error response gracefully", async () => {
    const createActionMock = vi.fn().mockResolvedValue({
      success: false,
      message: "Tariff code already exists",
    });

    const { result } = renderHook(() =>
      useTariffWorkbench({
        locale: "en",
        drawer: "add",
        createAction: createActionMock,
      })
    );

    await act(async () => {
      await result.current.handleFormSubmit({
        tariffCode: "RES-MTR-2026",
        tariffName: "Residential Metered 2026",
        financialYearId: 1,
        connectionTypeId: 1,
        connectionCategoryId: 1,
        effectiveFrom: "2026-04-01",
        versionNo: 1,
        status: "Draft",
        isActive: true,
      });
    });

    expect(mockToastError).toHaveBeenCalledWith("Tariff code already exists");
  });

  it("should handle successful update submission in edit mode", async () => {
    const updateActionMock = vi.fn().mockResolvedValue({ success: true });

    const { result } = renderHook(() =>
      useTariffWorkbench({
        locale: "en",
        drawer: "edit",
        initialEditingData: sampleRecords[0],
        updateAction: updateActionMock,
      })
    );

    const formData: CreateTariffWorkbenchDto = {
      tariffCode: "RES-MTR-2026-UPD",
      tariffName: "Residential Metered Updated",
      financialYearId: 1,
      connectionTypeId: 1,
      connectionCategoryId: 1,
      effectiveFrom: "2026-04-01",
      versionNo: 1,
      status: "Published",
      isActive: true,
    };

    await act(async () => {
      await result.current.handleFormSubmit(formData);
    });

    expect(updateActionMock).toHaveBeenCalledWith(1, { success: false }, formData);
    expect(mockToastSuccess).toHaveBeenCalledWith("tariffWorkbench.messages.updateSuccess");
    expect(mockPush).toHaveBeenCalledWith("/en/water-bill/tariff-workbench/master");
  });

  it("should handle delete flow with confirmation modal and execution", async () => {
    const deleteActionMock = vi.fn().mockResolvedValue({ success: true });

    mockConfirm.mockImplementation(({ onConfirm }) => {
      onConfirm();
    });

    const { result } = renderHook(() =>
      useTariffWorkbench({
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
        meta: { name: "RES-MTR-2026", id: 1 },
      })
    );
    expect(deleteActionMock).toHaveBeenCalledWith(1);
    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith("tariffWorkbench.messages.deleteSuccess");
    });
  });
});
