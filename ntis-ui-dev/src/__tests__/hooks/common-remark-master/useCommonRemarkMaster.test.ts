import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useCommonRemarkMaster } from "@/hooks/common-remark-master/useCommonRemarkMaster";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { useConfirm } from "@/components/common/ConfirmProvider";
import { deleteCommonRemarkAction } from "@/app/[locale]/configuration-settings/common-remark-master/actions";
import { useSearchNavigation } from "@/hooks/useSearchNavigation";
import type { CommonRemark, RemarkCategory } from "@/types/common-remark-master/common-remark.types";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    refresh: vi.fn(),
  })),
}));

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: vi.fn(() => (key: string) => key),
  useLocale: vi.fn(() => "en"),
}));

// Mock sonner
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock ConfirmProvider
vi.mock("@/components/common/ConfirmProvider", () => ({
  useConfirm: vi.fn(() => ({
    confirm: vi.fn(),
  })),
}));

// Mock server actions
vi.mock("@/app/[locale]/configuration-settings/common-remark-master/actions", () => ({
  deleteCommonRemarkAction: vi.fn(),
}));

// Mock search navigation hook
vi.mock("@/hooks/useSearchNavigation", () => ({
  useSearchNavigation: vi.fn(),
}));

describe("useCommonRemarkMaster", () => {
  const mockRouter = {
    push: vi.fn(),
    refresh: vi.fn(),
  };
  const mockConfirm = vi.fn();

  const mockCategories: RemarkCategory[] = [
    { id: 1, categoryCode: "CAT1", categoryName: "Category 1" },
    { id: 2, categoryCode: "CAT2", categoryName: "Category 2" },
  ];

  const mockRemarks: CommonRemark[] = [
    {
      id: 10,
      remarkTypeId: 1,
      remarkType: "Category 1",
      remark: "Remark 10",
      isActive: true,
      createdDate: "2026-06-09",
      updatedDate: null,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue(mockRouter as unknown as ReturnType<typeof useRouter>);
    vi.mocked(useTranslations).mockReturnValue(((key: string) => key) as unknown as ReturnType<typeof useTranslations>);
    vi.mocked(useLocale).mockReturnValue("en");
    vi.mocked(useConfirm).mockReturnValue({ confirm: mockConfirm });
  });

  const defaultProps = {
    data: mockRemarks,
    pageNumber: 1,
    pageSize: 10,
    totalCount: 1,
    totalPages: 1,
    search: "test",
    filterType: "All",
    sortBy: "remark",
    sortOrder: "asc",
    categories: mockCategories,
  };

  it("should initialize master state and map options", () => {
    const { result } = renderHook(() => useCommonRemarkMaster(defaultProps));

    expect(result.current.searchValue).toBe("test");
    expect(result.current.filterOptions).toEqual([
      { label: "filter.all", value: "All" },
      { label: "Category 1", value: "Category 1" },
      { label: "Category 2", value: "Category 2" },
    ]);
    expect(result.current.paginationInfo).toEqual({
      startIdx: 1,
      endIdx: 1,
    });
  });

  it("should trigger navigation when page is changed", () => {
    const { result } = renderHook(() => useCommonRemarkMaster(defaultProps));

    act(() => {
      result.current.changePage(2);
    });

    expect(mockRouter.push).toHaveBeenCalledWith(
      expect.stringContaining("page=2")
    );
  });

  it("should trigger navigation when page size is changed", () => {
    const { result } = renderHook(() => useCommonRemarkMaster(defaultProps));

    act(() => {
      result.current.changePageSize(20);
    });

    expect(mockRouter.push).toHaveBeenCalledWith(
      expect.stringContaining("pageSize=20")
    );
  });

  it("should trigger navigation when filter is changed", () => {
    const { result } = renderHook(() => useCommonRemarkMaster(defaultProps));

    act(() => {
      result.current.handleFilterChange("Category 1");
    });

    expect(mockRouter.push).toHaveBeenCalledWith(
      expect.stringContaining("filterType=Category+1")
    );
  });

  it("should update searchValue and call debounce search navigation", () => {
    const { result } = renderHook(() => useCommonRemarkMaster(defaultProps));

    act(() => {
      result.current.handleSearchSubmit("New Search term");
    });

    expect(result.current.searchValue).toBe("New Search term");
    expect(useSearchNavigation).toHaveBeenCalledWith(
      expect.objectContaining({
        search: "New Search term",
        currentSearchTerm: "test",
      })
    );
  });

  it("should open delete confirmation and call delete action on confirm", async () => {
    vi.mocked(deleteCommonRemarkAction).mockResolvedValue({ success: true });
    
    // Simulate user confirming
    mockConfirm.mockImplementation((config) => {
      config.onConfirm();
    });

    const { result } = renderHook(() => useCommonRemarkMaster(defaultProps));

    await act(async () => {
      result.current.handleDelete(mockRemarks[0]);
    });

    expect(mockConfirm).toHaveBeenCalled();
    expect(deleteCommonRemarkAction).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith("messages.deleteSuccess");
    expect(mockRouter.refresh).toHaveBeenCalled();
  });
});
