import { describe, it, expect, vi, beforeEach } from "vitest";
import { filterPropertiesAction } from "@/app/[locale]/property-tax/search-property/action";
import { searchProperties } from "@/lib/api/property-search";
import type { SearchResult } from "@/types/property-search";
import { INITIAL_SEARCH_CRITERIA } from "@/components/modules/property-tax/search-property/constants";

// Mock the API client
vi.mock("@/lib/api/property-search", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/property-search")>();
  return {
    ...actual,
    searchProperties: vi.fn(),
  };
});

describe("filterPropertiesAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should keep property 10-C when searching for 10-C", async () => {
    const mockResults: SearchResult[] = [
      {
        id: "prop-1",
        propertyId: 1,
        upicId: "UPIC001",
        zone: "Z1",
        ward: "W1",
        propertyNo: "10",
        partitionNo: "0",
        oldPropertyNo: "",
        citySurveyNo: "",
        plotNo: "",
        wingFlatNo: "",
        propertyCount: 1,
        category: "Residential",
        description: "",
        mobile: "",
        alternateMobile: "",
        holderName: "John",
        holderNameMarathi: "",
        occupierName: "",
        occupierNameMarathi: "",
        shopBuildingName: "",
        societyName: "",
        address: "",
        rv: 1000,
        cv: null,
        totalTax: 100,
        status: "Register Property",
      },
      {
        id: "prop-2",
        propertyId: 2,
        upicId: "UPIC002",
        zone: "Z1",
        ward: "W1",
        propertyNo: "10",
        partitionNo: "C",
        oldPropertyNo: "",
        citySurveyNo: "",
        plotNo: "",
        wingFlatNo: "",
        propertyCount: 1,
        category: "Residential",
        description: "",
        mobile: "",
        alternateMobile: "",
        holderName: "Jane",
        holderNameMarathi: "",
        occupierName: "",
        occupierNameMarathi: "",
        shopBuildingName: "",
        societyName: "",
        address: "",
        rv: 2000,
        cv: null,
        totalTax: 200,
        status: "Register Property",
      },
    ];

    vi.mocked(searchProperties).mockResolvedValue({
      items: mockResults,
      totalCount: 2,
      pageNumber: 1,
      pageSize: -1,
      totalPages: 1,
      hasPrevious: false,
      hasNext: false,
    });

    const criteria = {
      ...INITIAL_SEARCH_CRITERIA,
      propertyNoFrom: "10-C",
      propertyNoTo: "",
    };

    const response = await filterPropertiesAction(null, criteria, true, "quick-search");

    expect(response.error).toBeNull();
    expect(response.results).toHaveLength(1);
    expect(response.results[0].propertyNo).toBe("10");
    expect(response.results[0].partitionNo).toBe("C");
  });

  it("should combine and deduplicate results when searching by Owner/Occupier Name on the kyc tab", async () => {
    const mockResultsOwner: SearchResult[] = [
      {
        id: "prop-1",
        propertyId: 1,
        upicId: "UPIC001",
        zone: "Z1",
        ward: "W1",
        propertyNo: "10",
        partitionNo: "0",
        oldPropertyNo: "",
        citySurveyNo: "",
        plotNo: "",
        wingFlatNo: "",
        propertyCount: 1,
        category: "Residential",
        description: "",
        mobile: "",
        alternateMobile: "",
        holderName: "रमेश पटेल",
        holderNameMarathi: "",
        occupierName: "aditya kamble",
        occupierNameMarathi: "",
        shopBuildingName: "",
        societyName: "",
        address: "",
        rv: 1000,
        cv: null,
        totalTax: 100,
        status: "Register Property",
      },
    ];

    const mockResultsOccupier: SearchResult[] = [
      {
        id: "prop-1",
        propertyId: 1, // Same property ID to test deduplication
        upicId: "UPIC001",
        zone: "Z1",
        ward: "W1",
        propertyNo: "10",
        partitionNo: "0",
        oldPropertyNo: "",
        citySurveyNo: "",
        plotNo: "",
        wingFlatNo: "",
        propertyCount: 1,
        category: "Residential",
        description: "",
        mobile: "",
        alternateMobile: "",
        holderName: "रमेश पटेल",
        holderNameMarathi: "",
        occupierName: "aditya kamble",
        occupierNameMarathi: "",
        shopBuildingName: "",
        societyName: "",
        address: "",
        rv: 1000,
        cv: null,
        totalTax: 100,
        status: "Register Property",
      },
      {
        id: "prop-3",
        propertyId: 3,
        upicId: "UPIC003",
        zone: "Z1",
        ward: "W1",
        propertyNo: "12",
        partitionNo: "0",
        oldPropertyNo: "",
        citySurveyNo: "",
        plotNo: "",
        wingFlatNo: "",
        propertyCount: 1,
        category: "Residential",
        description: "",
        mobile: "",
        alternateMobile: "",
        holderName: "aditya kamble",
        holderNameMarathi: "",
        occupierName: "रमेश पटेल",
        occupierNameMarathi: "",
        shopBuildingName: "",
        societyName: "",
        address: "",
        rv: 3000,
        cv: null,
        totalTax: 300,
        status: "Register Property",
      },
    ];

    vi.mocked(searchProperties)
      .mockResolvedValueOnce({
        items: mockResultsOwner,
        totalCount: 1,
        pageNumber: 1,
        pageSize: -1,
        totalPages: 1,
        hasPrevious: false,
        hasNext: false,
      })
      .mockResolvedValueOnce({
        items: mockResultsOccupier,
        totalCount: 2,
        pageNumber: 1,
        pageSize: -1,
        totalPages: 1,
        hasPrevious: false,
        hasNext: false,
      });

    const criteria = {
      ...INITIAL_SEARCH_CRITERIA,
      occupierName: "रमेश पटेल",
    };

    const response = await filterPropertiesAction(null, criteria, true, "kyc");

    expect(response.error).toBeNull();
    expect(response.results).toHaveLength(2); // propertyId 1 and 3
    expect(response.results[0].propertyId).toBe(1);
    expect(response.results[1].propertyId).toBe(3);
  });

  it("should request unpaged results and slice them locally for Values & Dues top count search", async () => {
    const mockResults: SearchResult[] = [
      {
        id: "prop-1",
        propertyId: 1,
        upicId: "UPIC001",
        zone: "Z1",
        ward: "W1",
        propertyNo: "10",
        partitionNo: "0",
        oldPropertyNo: "",
        citySurveyNo: "",
        plotNo: "",
        wingFlatNo: "",
        propertyCount: 1,
        category: "Residential",
        description: "",
        mobile: "",
        alternateMobile: "",
        holderName: "John",
        holderNameMarathi: "",
        occupierName: "",
        occupierNameMarathi: "",
        shopBuildingName: "",
        societyName: "",
        address: "",
        rv: 1000,
        cv: null,
        totalTax: 100,
        status: "Register Property",
      },
    ];

    vi.mocked(searchProperties).mockResolvedValue({
      items: mockResults,
      totalCount: 1,
      pageNumber: 1,
      pageSize: -1,
      totalPages: 1,
      hasPrevious: false,
      hasNext: false,
    });

    const criteria = {
      ...INITIAL_SEARCH_CRITERIA,
      valuationMethod: "totalTax",
      rateableValueFilter: "top",
      rateableValueFrom: "1",
    };

    const response = await filterPropertiesAction(null, criteria, true, "values-dues", 1, 10);

    expect(response.error).toBeNull();
    expect(response.results).toHaveLength(1);
    expect(response.results[0].propertyId).toBe(1);

    // Verify searchProperties was called with pageSize matching topCount
    expect(searchProperties).toHaveBeenCalledWith(expect.objectContaining({
      pageSize: 1,
      filterType: "top",
      topCount: 1,
    }));
  });
});
