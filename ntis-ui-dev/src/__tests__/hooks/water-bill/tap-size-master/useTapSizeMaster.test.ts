import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useTapSizeMaster } from "@/hooks/water-bill/tap-size-master/useTapSizeMaster";
import type { TapSize, PagedResponse } from "@/types/waterBill/tapSizeMaster.types";

const mockRouterPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush }),
  useSearchParams: () => new URLSearchParams(""),
  usePathname: () => "/en/water-bill/tap-size-master",
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/components/common/ConfirmProvider", () => ({
  useConfirm: () => ({
    confirm: vi.fn(),
  }),
}));

const mockData: PagedResponse<TapSize> = {
  items: [
    {
      id: 1,
      tapSizeCode: "TAP01",
      tapSize: "1/2 Inch",
      nominalSizeValue: 0.5,
      sizeUnit: "Inch",
      isActive: true,
      createdBy: 1,
      updatedBy: 1,
    },
  ],
  totalCount: 25,
  pageNumber: 2,
  pageSize: 10,
  totalPages: 3,
  hasPrevious: true,
  hasNext: true,
};

describe("useTapSizeMaster Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initializes state correctly from props and default params", () => {
    const { result } = renderHook(() => useTapSizeMaster(mockData));

    expect(result.current.items).toEqual(mockData.items);
    expect(result.current.pageNumber).toBe(2);
    expect(result.current.pageSize).toBe(10);
    expect(result.current.totalCount).toBe(25);
    expect(result.current.totalPages).toBe(3);
    expect(result.current.start).toBe(11);
    expect(result.current.end).toBe(20);
    expect(result.current.statusFilter).toBe("all");
    expect(result.current.search).toBe("");
  });

  it("handles page change and navigates to the correct URL", () => {
    const { result } = renderHook(() => useTapSizeMaster(mockData));

    act(() => {
      result.current.changePage(3);
    });

    expect(mockRouterPush).toHaveBeenCalledWith(
      expect.stringContaining("page=3&pageSize=10")
    );
  });

  it("handles page size change and resets page to 1", () => {
    const { result } = renderHook(() => useTapSizeMaster(mockData));

    act(() => {
      result.current.handlePageSizeChange(20);
    });

    expect(mockRouterPush).toHaveBeenCalledWith(
      expect.stringContaining("page=1&pageSize=20")
    );
  });

  it("handles status filter change and updates route", () => {
    const { result } = renderHook(() => useTapSizeMaster(mockData));

    act(() => {
      result.current.handleStatusFilterChange("active");
    });

    expect(mockRouterPush).toHaveBeenCalledWith(
      expect.stringContaining("status=active")
    );
  });

  it("sanitizes invalid characters on search input change", () => {
    const { result } = renderHook(() => useTapSizeMaster(mockData));

    act(() => {
      result.current.handleSearchChange("1/2 Inch @#$% 123");
    });

    // Special characters like @#$% should be stripped out
    expect(result.current.search).toBe("12 Inch 123");
  });

  it("navigates to add route when handleAdd is called", () => {
    const { result } = renderHook(() => useTapSizeMaster(mockData));

    act(() => {
      result.current.handleAdd();
    });

    expect(mockRouterPush).toHaveBeenCalledWith("/en/water-bill/tap-size-master/add");
  });

  it("navigates to edit route when handleEdit is called", () => {
    const { result } = renderHook(() => useTapSizeMaster(mockData));

    act(() => {
      result.current.handleEdit(mockData.items[0]);
    });

    expect(mockRouterPush).toHaveBeenCalledWith("/en/water-bill/tap-size-master/edit/1");
  });
});
