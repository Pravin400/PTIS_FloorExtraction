import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateGisDepartmentKpiMapping } from "@/lib/api/gis-master/gis-kpi-crud.service";
import { apiClient } from "@/services/api.service";
import { ApiError } from "@/lib/utils/api";

vi.mock("@/services/api.service", () => ({
  apiClient: {
    put: vi.fn(),
    get: vi.fn(),
  },
}));

describe("updateGisDepartmentKpiMapping", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should throw ApiError if mapping ID is missing", async () => {
    const payload = {
      departmentId: 1,
      kpiMasterId: 2,
      displayOrder: 1,
      isActive: true,
    };

    await expect(updateGisDepartmentKpiMapping(payload)).rejects.toThrow(
      "Mapping ID is required for update"
    );
  });

  it("should call apiClient.put with correct URL and payload catching mapping ID", async () => {
    vi.mocked(apiClient.put).mockResolvedValueOnce({
      success: true,
      statusCode: 200,
      data: {},
    });

    const payload = {
      id: 42,
      departmentId: 3,
      kpiMasterId: 1,
      customTitle: "Custom Title",
      customIcon: "book-open",
      customColor: "#2563EB",
      displayOrder: 2,
      isActive: true,
    };

    await updateGisDepartmentKpiMapping(payload);

    expect(apiClient.put).toHaveBeenCalledWith(
      "/GisDepartmentKpiMapping/42",
      expect.objectContaining({
        id: 42,
        departmentId: 3,
        kpiMasterId: 1,
        customTitle: "Custom Title",
        customIcon: "book-open",
        customColor: "#2563EB",
        displayOrder: 2,
        isActive: true,
      })
    );
  });

  it("should fallback to base URL if 404 is encountered on route param", async () => {
    vi.mocked(apiClient.put)
      .mockResolvedValueOnce({
        success: false,
        statusCode: 404,
        error: "Not Found",
      })
      .mockResolvedValueOnce({
        success: true,
        statusCode: 200,
        data: {},
      });

    const payload = {
      id: 42,
      departmentId: 3,
      kpiMasterId: 1,
      displayOrder: 1,
      isActive: true,
    };

    await updateGisDepartmentKpiMapping(payload);

    expect(apiClient.put).toHaveBeenCalledTimes(2);
    expect(apiClient.put).toHaveBeenNthCalledWith(
      1,
      "/GisDepartmentKpiMapping/42",
      expect.any(Object)
    );
    expect(apiClient.put).toHaveBeenNthCalledWith(
      2,
      "/GisDepartmentKpiMapping",
      expect.any(Object)
    );
  });

  it("should throw ApiError when update returns non-success", async () => {
    vi.mocked(apiClient.put).mockResolvedValueOnce({
      success: false,
      statusCode: 500,
      error: "Internal Server Error",
    });

    const payload = {
      id: 42,
      departmentId: 3,
      kpiMasterId: 1,
      displayOrder: 1,
      isActive: true,
    };

    await expect(updateGisDepartmentKpiMapping(payload)).rejects.toThrow(ApiError);
  });
});

describe("getGisDepartmentKpiMappings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch mappings with DepartmentId parameter matching swagger endpoint", async () => {
    const { getGisDepartmentKpiMappings } = await import("@/lib/api/gis-master/gis-kpi-crud.service");

    const mockMappings = [
      {
        id: 30,
        departmentId: 1,
        departmentName: "Property Tax",
        kpiMasterId: 18,
        kpiCode: "TOTAL_ROADS",
        defaultTitle: "Total Roads",
        customTitle: "Total Roads",
        customIcon: "route",
        customColor: "#DC2626",
        displayOrder: 1,
        isActive: true,
      },
    ];

    vi.mocked(apiClient.get).mockResolvedValueOnce({
      success: true,
      statusCode: 200,
      data: {
        items: mockMappings,
        totalCount: 1,
        pageNumber: 1,
        pageSize: 10,
        totalPages: 1,
        hasPrevious: false,
        hasNext: false,
      },
    });

    const result = await getGisDepartmentKpiMappings(1);

    expect(apiClient.get).toHaveBeenCalledWith(
      expect.stringContaining("DepartmentId=1"),
      expect.any(Object)
    );
    expect(result).toHaveLength(1);
    expect(result[0].kpiCode).toBe("TOTAL_ROADS");
  });
});
