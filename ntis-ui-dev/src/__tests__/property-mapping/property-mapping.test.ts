import { describe, it, expect, vi, beforeEach } from "vitest";
import { ApiResponse } from "@/types/common.types";
import { MappedPropertyApiResponse, SearchOldPropertiesApiResponse } from "@/types/property-mapping";
import { money, percentText, getDifferenceColorClass } from "@/components/modules/property-tax/property-mapping/mappingUtils";
import { getMappedPropertiesAction, searchOldPropertiesAction } from "@/lib/api/property-mapping/property-mapping.service";
import { apiClient } from "@/services/api.service";

vi.mock("@/services/api.service", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe("Property Mapping Utils", () => {
  it("should format currency values using money()", () => {
    expect(money(1000)).toBe("₹1,000");
    expect(money(0)).toBe("₹0");
    expect(money(5500.5)).toBe("₹5,501");
  });

  it("should format percentage strings using percentText()", () => {
    expect(percentText(0)).toBe("0.00%");
    expect(percentText(15.5)).toBe("+15.50%");
    expect(percentText(-10.2)).toBe("-10.20%");
  });

  it("should return correct difference color classes", () => {
    expect(getDifferenceColorClass(0)).toContain("text-amber-500");
    expect(getDifferenceColorClass(15)).toContain("text-emerald-600");
    expect(getDifferenceColorClass(-30)).toContain("text-rose-600");
  });
});

describe("Property Mapping API Service Actions (Real Function Behavior)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should execute getMappedPropertiesAction and process apiClient response", async () => {
    const mockApiResponse = {
      success: true,
      statusCode: 200,
      data: {
        items: [
          {
            propertyId: 101,
            mappingCategory: "ONE_TO_ONE",
            oldPropertyNo: "OLD-101",
            oldTotalTax: 5000,
            oldConstructionArea: 450,
            oldWardNo: "W-1",
            oldZoneNo: "Z-1"
          }
        ],
        totalCount: 1,
        pageNumber: 1,
        pageSize: 10,
        totalPages: 1,
        hasPrevious: false,
        hasNext: false
      }
    };

    vi.mocked(apiClient.get).mockResolvedValueOnce(mockApiResponse as unknown as ApiResponse<MappedPropertyApiResponse>);

    const result = await getMappedPropertiesAction(101);
    expect(apiClient.get).toHaveBeenCalledWith("/PropertyMapMaster/mapped-properties?PropertyId=101&PageSize=-1");
    expect(result).not.toBeNull();
    expect(result?.items[0].oldPropertyNo).toBe("OLD-101");
  });

  it("should execute searchOldPropertiesAction with query parameters", async () => {
    const mockSearchResponse = {
      success: true,
      statusCode: 200,
      data: {
        oldPropertySuggestions: [
          {
            id: 501,
            isMapped: false,
            mappedNewPropertyNo: null,
            oldPropertyNo: "OLD-SEARCH-1",
            oldOwnerName: "John Doe",
            oldTotalTax: 6000,
            oldConstructionArea: 500,
            propertyDetailsOld: [],
            transMastOldRecords: []
          }
        ]
      }
    };

    vi.mocked(apiClient.get).mockResolvedValueOnce(mockSearchResponse as unknown as ApiResponse<SearchOldPropertiesApiResponse>);

    const result = await searchOldPropertiesAction({ searchTerm: "John" });
    expect(apiClient.get).toHaveBeenCalledWith("/PropertyMapMaster/search?SearchTerm=John&PageSize=-1");
    expect(result).not.toBeNull();
    expect(result?.oldPropertySuggestions[0].oldOwnerName).toBe("John Doe");
  });
});
