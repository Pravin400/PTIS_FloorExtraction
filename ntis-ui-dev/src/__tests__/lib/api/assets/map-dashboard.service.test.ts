import { describe, it, expect, vi, beforeEach } from "vitest";
import { getDashboardStats } from "@/lib/api/assets/map-dashboard.service";
import { apiClient } from "@/services/api.service";
import { ApiError } from "@/lib/utils/api";

vi.mock("@/services/api.service", () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe("Map Dashboard Service (getDashboardStats)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch dashboard stats without filter parameters", async () => {
    const mockData = {
      summary: {
        totalAssets: 44,
        totalValue: 27567675532.01,
        encroachments: 0,
        monetizedAssetsCount: 17,
        categoryStats: [
          { categoryId: 1, categoryName: "Buildings", registeredAssets: 44, totalValue: 27567675532.01 },
        ],
      },
      types: [],
      locations: [],
    };

    vi.mocked(apiClient.get).mockResolvedValue({
      success: true,
      statusCode: 200,
      data: mockData,
    });

    const result = await getDashboardStats();

    expect(apiClient.get).toHaveBeenCalledWith("/AssetDashboard/dashboard-stats");
    expect(result).toEqual(mockData);
  });

  it("should construct correct query parameters when filter options are provided", async () => {
    const mockData = { summary: { totalAssets: 10 } };
    vi.mocked(apiClient.get).mockResolvedValue({
      success: true,
      statusCode: 200,
      data: mockData,
    });

    await getDashboardStats({ zoneId: "z1", wardId: "w1", districtId: "Akola" });

    expect(apiClient.get).toHaveBeenCalledWith(
      "/AssetDashboard/dashboard-stats?zoneId=z1&wardId=w1&districtId=Akola"
    );
  });

  it("should ignore 'all' value for zoneId and wardId filter parameters", async () => {
    const mockData = { summary: { totalAssets: 5 } };
    vi.mocked(apiClient.get).mockResolvedValue({
      success: true,
      statusCode: 200,
      data: mockData,
    });

    await getDashboardStats({ zoneId: "all", wardId: "all", districtId: "Akola" });

    expect(apiClient.get).toHaveBeenCalledWith(
      "/AssetDashboard/dashboard-stats?districtId=Akola"
    );
  });

  it("should throw ApiError when response success is false", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      success: false,
      statusCode: 500,
      error: "Internal Server Error",
    });

    await expect(getDashboardStats()).rejects.toThrow(ApiError);
  });

  it("should throw ApiError when response data is missing", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      success: true,
      statusCode: 200,
      data: undefined,
    });

    await expect(getDashboardStats()).rejects.toThrow(ApiError);
  });
});
