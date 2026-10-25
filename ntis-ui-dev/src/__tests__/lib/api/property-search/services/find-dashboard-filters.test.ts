import { vi, describe, it, expect, beforeEach } from "vitest";
import { searchProperties } from "@/lib/api/property-search/services/search.service";

vi.mock("@/lib/api/property-search/services/search.service", () => ({
  searchProperties: vi.fn(),
}));

describe("Find Dashboard Filter values", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should query grid with DashboardFilters 1 to 10", async () => {
    type SearchPropertiesResult = Awaited<ReturnType<typeof searchProperties>>;

    const mockResponse = {
      totalCount: 42,
      items: [],
      pageNumber: 1,
      pageSize: 1,
      totalPages: 1,
      hasPrevious: false,
      hasNext: false,
    } satisfies SearchPropertiesResult;

    vi.mocked(searchProperties).mockResolvedValue(mockResponse);
    
    for (let i = 1; i <= 10; i++) {
      const response = await searchProperties({
        dashboardFilter: i,
        pageNumber: 1,
        pageSize: 1,
      });
      expect(response.totalCount).toBe(42);
    }

    expect(searchProperties).toHaveBeenCalledTimes(10);
  });
});
