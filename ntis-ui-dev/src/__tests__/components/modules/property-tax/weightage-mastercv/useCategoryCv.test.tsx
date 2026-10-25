import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

// Mock next/navigation
const mockPush = vi.fn();
const mockRefresh = vi.fn();
const mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
  useSearchParams: () => mockSearchParams,
}));

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));

// Mock server actions
vi.mock("@/app/[locale]/property-tax/weightage-master/sub-type-weightage/action", () => ({
  updateUseFactorCVMasterAction: vi.fn().mockResolvedValue({ success: true }),
  createUseFactorCVMasterAction: vi.fn().mockResolvedValue({ success: true }),
  bulkCreateUseFactorCVMasterAction: vi.fn().mockResolvedValue({ success: true }),
  bulkUpdateUseFactorCVMasterAction: vi.fn().mockResolvedValue({ success: true }),
  fetchUseFactorCVMasterPagedServerAction: vi.fn().mockResolvedValue({
    items: [],
    pageNumber: 1,
    pageSize: -1,
    totalCount: 0,
    totalPages: 1,
    hasPrevious: false,
    hasNext: false,
  }),
}));

import { useCategoryCv } from "@/hooks/weightageMaster/useCategoryCv/useCategoryCv";
import { UseFactorCVMaster } from "@/types/useCategoryCvFactor.types";

describe("useCategoryCv", () => {
  const mockData: UseFactorCVMaster[] = [
    {
      id: 1,
      typeOfUseId: 1,
      subTypeOfUseId: 1,
      factor: 1.5,
      yearRangeCVId: 1,
      fromYear: 2023,
      toYear: 2024,
      isActive: true,
      typeOfUseCode: "T1",
      typeOfUseDescription: "Type 1",
      subTypeOfUseDescription: "Sub 1"
    },
    {
      id: 0, // Pending record
      typeOfUseId: 1,
      subTypeOfUseId: 2,
      factor: 1.0,
      yearRangeCVId: 1,
      fromYear: 2023,
      toYear: 2024,
      isActive: true,
      typeOfUseCode: "T1",
      typeOfUseDescription: "Type 1",
      subTypeOfUseDescription: "Sub 2"
    }
  ];

  const defaultProps = {
    data: mockData,
    pageSize: 10,
    pageNumber: 1,
    typeOfUsePageSize: 10,
    typeOfUsePageNumber: 1,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.delete("selectedYearRange");
    mockSearchParams.delete("typeOfUseId");
    mockSearchParams.delete("q");
  });

  it("initializes with default values", () => {
    const { result } = renderHook(() => useCategoryCv(defaultProps));

    expect(result.current.selectedYear).toBe("");
    expect(result.current.typeOfUseId).toBe("");
    expect(result.current.factorValue).toBe("1.00");
    // No assessment year selected yet, so the missing-records count is
    // meaningless (and not fetched) until one is picked.
    expect(result.current.newRecordsCount).toBe(0);
    expect(result.current.hasNewRecords).toBe(false);
  });

  it("computes newRecordsCount from the full dataset for the selected year, not just the current page", async () => {
    mockSearchParams.set("selectedYearRange", "1");
    const { fetchUseFactorCVMasterPagedServerAction } = await import(
      "@/app/[locale]/property-tax/weightage-master/sub-type-weightage/action"
    );
    vi.mocked(fetchUseFactorCVMasterPagedServerAction).mockResolvedValueOnce({
      items: mockData,
      pageNumber: 1,
      pageSize: -1,
      totalCount: mockData.length,
      totalPages: 1,
      hasPrevious: false,
      hasNext: false,
    });

    const { result } = renderHook(() => useCategoryCv(defaultProps));

    await waitFor(() => {
      expect(result.current.newRecordsCount).toBe(1);
    });
    expect(result.current.hasNewRecords).toBe(true);
  });

  it("handles cell changes correctly", () => {
    const { result } = renderHook(() => useCategoryCv(defaultProps));
    const rowUid = result.current.getRowUid(mockData[0]);

    act(() => {
      result.current.handleCellChange(rowUid, "factor", 2.5);
    });

    expect(result.current.editableRows[rowUid].factor).toBe(2.5);
  });

  it("prevents negative values in cell changes", () => {
    const { result } = renderHook(() => useCategoryCv(defaultProps));
    const rowUid = result.current.getRowUid(mockData[0]);

    act(() => {
      result.current.handleCellChange(rowUid, "factor", -1);
    });

    // Should not update editableRows with negative value
    expect(result.current.editableRows[rowUid]).toBeUndefined();
  });

  it("handles apply filter (bulk factor application)", () => {
    const { result } = renderHook(() => useCategoryCv(defaultProps));

    act(() => {
      result.current.setFactorValue("2.00");
    });

    act(() => {
      result.current.handleApplyFilter();
    });

    const row1Uid = result.current.getRowUid(mockData[0]);
    const row2Uid = result.current.getRowUid(mockData[1]);

    expect(result.current.editableRows[row1Uid].factor).toBe(2);
    expect(result.current.editableRows[row2Uid].factor).toBe(2);
  });

  it("handles clear all", () => {
    const { result } = renderHook(() => useCategoryCv(defaultProps));
    const rowUid = result.current.getRowUid(mockData[0]);

    act(() => {
      result.current.handleCellChange(rowUid, "factor", 2.5);
      result.current.setFactorValue("2.00");
    });

    expect(Object.keys(result.current.editableRows).length).toBe(1);

    act(() => {
      result.current.handleClearAll();
    });

    expect(Object.keys(result.current.editableRows).length).toBe(0);
    expect(result.current.factorValue).toBe("1.00");
    expect(mockPush).toHaveBeenCalled();
  });

  it("generates all pending records including edits", async () => {
    const { bulkCreateUseFactorCVMasterAction, fetchUseFactorCVMasterPagedServerAction } =
      await import("@/app/[locale]/property-tax/weightage-master/sub-type-weightage/action");
    // Not "Once": the "refresh missing count" effect also calls this on mount
    // (and again whenever the selection changes), so it needs to keep resolving
    // to the same data for the later, explicit handleGenerateAll() call too.
    vi.mocked(fetchUseFactorCVMasterPagedServerAction).mockResolvedValue({
      items: mockData,
      pageNumber: 1,
      pageSize: -1,
      totalCount: mockData.length,
      totalPages: 1,
      hasPrevious: false,
      hasNext: false,
    });

    const { result } = renderHook(() => useCategoryCv(defaultProps));
    const pendingRowUid = result.current.getRowUid(mockData[1]);

    // Edit the pending record
    act(() => {
      result.current.handleCellChange(pendingRowUid, "factor", 3.0);
    });

    await act(async () => {
      await result.current.handleGenerateAll();
    });
    
    // Should have been called with the edited factor
    expect(bulkCreateUseFactorCVMasterAction).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({
        factor: 3.0
      })
    ]));
  });

  it("handles single row update", async () => {
    const { result } = renderHook(() => useCategoryCv(defaultProps));
    const rowUid = result.current.getRowUid(mockData[0]);

    act(() => {
      result.current.handleCellChange(rowUid, "factor", 2.5);
    });

    await act(async () => {
      await result.current.handleUpdate(mockData[0]);
    });

    const { updateUseFactorCVMasterAction } = await import("@/app/[locale]/property-tax/weightage-master/sub-type-weightage/action");
    expect(updateUseFactorCVMasterAction).toHaveBeenCalled();
  });

  it("handles bulk update", async () => {
    const { result } = renderHook(() => useCategoryCv(defaultProps));
    const rowUid = result.current.getRowUid(mockData[0]);

    act(() => {
      result.current.handleCellChange(rowUid, "factor", 2.5);
    });

    await act(async () => {
      await result.current.handleBulkUpdate();
    });

    const { bulkUpdateUseFactorCVMasterAction } = await import("@/app/[locale]/property-tax/weightage-master/sub-type-weightage/action");
    expect(bulkUpdateUseFactorCVMasterAction).toHaveBeenCalled();
  });
});
