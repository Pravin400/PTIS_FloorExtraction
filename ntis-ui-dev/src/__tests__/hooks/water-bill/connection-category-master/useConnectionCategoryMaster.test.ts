import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useConnectionCategoryMaster } from "@/hooks/water-bill/connection-category-master/useConnectionCategoryMaster";
import type { ConnectionCategory, PagedResponse } from "@/types/waterBill/connectionCategoryMaster.types";

const mockRouterPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush }),
  useSearchParams: () => new URLSearchParams(""),
  usePathname: () => "/en/water-bill/connection-category-master",
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

const mockData: PagedResponse<ConnectionCategory> = {
  items: [
    {
      id: 1,
      connectionCategoryCode: "REGULAR",
      connectionCategory: "Regular",
      billingFrequencyId: 2,
      billingFrequencyCode: "QUARTERLY",
      billingFrequency: "Quarterly",
      isMetered: true,
      billingMethod: "Metered",
      description: "Regular quarterly metered",
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

describe("useConnectionCategoryMaster Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initializes state correctly from props and default params", () => {
    const { result } = renderHook(() => useConnectionCategoryMaster(mockData));

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
    const { result } = renderHook(() => useConnectionCategoryMaster(mockData));

    act(() => {
      result.current.changePage(3);
    });

    expect(mockRouterPush).toHaveBeenCalledWith(
      "/en/water-bill/connection-category-master?page=3&pageSize=10"
    );
  });

  it("handles page size change and resets page to 1", () => {
    const { result } = renderHook(() => useConnectionCategoryMaster(mockData));

    act(() => {
      result.current.handlePageSizeChange(20);
    });

    expect(mockRouterPush).toHaveBeenCalledWith(
      "/en/water-bill/connection-category-master?page=1&pageSize=20"
    );
  });

  it("handles status filter change and resets page to 1", () => {
    const { result } = renderHook(() => useConnectionCategoryMaster(mockData));

    act(() => {
      result.current.handleStatusFilterChange("active");
    });

    expect(mockRouterPush).toHaveBeenCalledWith(
      "/en/water-bill/connection-category-master?page=1&status=active"
    );
  });

  it("handles metered filter change and resets page to 1", () => {
    const { result } = renderHook(() => useConnectionCategoryMaster(mockData));

    act(() => {
      result.current.handleMeteredFilterChange("metered");
    });

    expect(mockRouterPush).toHaveBeenCalledWith(
      "/en/water-bill/connection-category-master?page=1&metered=metered"
    );
  });

  it("navigates to add page when handleAdd is called", () => {
    const { result } = renderHook(() => useConnectionCategoryMaster(mockData));

    act(() => {
      result.current.handleAdd();
    });

    expect(mockRouterPush).toHaveBeenCalledWith("/en/water-bill/connection-category-master/add");
  });

  it("navigates to edit page when handleEdit is called", () => {
    const { result } = renderHook(() => useConnectionCategoryMaster(mockData));

    act(() => {
      result.current.handleEdit(mockData.items[0]);
    });

    expect(mockRouterPush).toHaveBeenCalledWith(
      "/en/water-bill/connection-category-master/edit/1"
    );
  });
});
