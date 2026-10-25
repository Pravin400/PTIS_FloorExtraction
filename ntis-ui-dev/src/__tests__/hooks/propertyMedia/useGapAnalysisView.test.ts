import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useGapAnalysisView } from "@/hooks/PropertyMedia/useGapAnalysisView";
import { sanitizeSearchInput } from "@/hooks/PropertyMedia/useGapAnalysis";

let mockSearchParams = new Map<string, string>();
const mockPush = vi.fn((url: string) => {
  const queryIndex = url.indexOf("?");
  mockSearchParams.clear();
  if (queryIndex !== -1) {
    const qStr = url.substring(queryIndex + 1);
    const params = new URLSearchParams(qStr);
    params.forEach((val, key) => mockSearchParams.set(key, val));
  }
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => "/en/property-tax/property-media/view/101",
  useSearchParams: () => ({
    get: (key: string) => mockSearchParams.get(key) ?? null,
    toString: () => {
      const entries = Array.from(mockSearchParams.entries());
      return new URLSearchParams(entries).toString();
    },
  }),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/hooks/useDebounce", () => ({
  useDebounce: (val: string) => val,
}));

describe("sanitizeSearchInput", () => {
  it("removes special characters and keeps alphanumeric text", () => {
    expect(sanitizeSearchInput("Property#123@!")).toBe("Property123");
  });

  it("removes leading spaces", () => {
    expect(sanitizeSearchInput("   hello world")).toBe("hello world");
  });

  it("collapses multiple consecutive spaces to a single space", () => {
    expect(sanitizeSearchInput("hello     world   test")).toBe("hello world test");
  });

  it("supports Unicode multilingual letters and marks", () => {
    expect(sanitizeSearchInput("संपत्ती 123")).toBe("संपत्ती 123");
  });
});

describe("useGapAnalysisView", () => {
  const mockDivisionOptions = [
    { value: "1", label: "Zone North" },
    { value: "2", label: "Zone South" },
  ];
  const mockWardOptions = [
    { value: "10", label: "Ward 10" },
    { value: "11", label: "Ward 11" },
  ];
  const mockPropertyTypeOptions = [
    { value: "100", label: "Residential" },
    { value: "101", label: "Commercial" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new Map<string, string>();
  });

  describe("Initialization", () => {
    it("initializes with default empty filters and ward disabled", () => {
      const { result } = renderHook(() =>
        useGapAnalysisView({
          divisionOptions: mockDivisionOptions,
          wardOptions: mockWardOptions,
          propertyTypeOptions: mockPropertyTypeOptions,
        })
      );

      expect(result.current.isDrawerOpen).toBe(true);
      expect(result.current.isWardDisabled).toBe(true);
      expect(result.current.divisionId).toBe("");
      expect(result.current.wardId).toBe("");
      expect(result.current.workflowStageId).toBe("");
      expect(result.current.propertyTypeId).toBe("");
      expect(result.current.searchTerm).toBe("");
      expect(result.current.pageNumber).toBe(1);
      expect(result.current.pageSize).toBe(10);
      expect(result.current.isFilterEnabled).toBe(false);
    });

    it("parses URL params into filters correctly", () => {
      mockSearchParams.set("divisionId", "1");
      mockSearchParams.set("wardId", "10");
      mockSearchParams.set("workflowStageId", "3");
      mockSearchParams.set("propertyTypeId", "100");
      mockSearchParams.set("q", "Prop123");
      mockSearchParams.set("page", "2");
      mockSearchParams.set("pageSize", "25");

      const { result } = renderHook(() =>
        useGapAnalysisView({
          divisionOptions: mockDivisionOptions,
          wardOptions: mockWardOptions,
          propertyTypeOptions: mockPropertyTypeOptions,
        })
      );

      expect(result.current.divisionId).toBe("1");
      expect(result.current.wardId).toBe("10");
      expect(result.current.workflowStageId).toBe("3");
      expect(result.current.propertyTypeId).toBe("100");
      expect(result.current.searchTerm).toBe("Prop123");
      expect(result.current.isWardDisabled).toBe(false);
      expect(result.current.pageNumber).toBe(2);
      expect(result.current.pageSize).toBe(25);
    });
  });

  describe("Dependent Dropdown and Filter Cascading", () => {
    it("clears wardId automatically when divisionId changes", () => {
      mockSearchParams.set("divisionId", "1");
      mockSearchParams.set("wardId", "10");

      const { result } = renderHook(() =>
        useGapAnalysisView({
          divisionOptions: mockDivisionOptions,
          wardOptions: mockWardOptions,
        })
      );

      act(() => {
        result.current.handleFilterChange("divisionId", "2");
      });

      expect(mockPush).toHaveBeenCalledWith(
        "/en/property-tax/property-media/view/101?divisionId=2",
        { scroll: false }
      );
    });

    it("updates the selected division optimistically before navigation completes", () => {
      const { result } = renderHook(() =>
        useGapAnalysisView({
          divisionOptions: mockDivisionOptions,
          wardOptions: mockWardOptions,
        })
      );

      act(() => {
        result.current.handleFilterChange("divisionId", "2");
      });

      expect(result.current.divisionId).toBe("2");
      expect(result.current.wardId).toBe("");
      expect(result.current.isWardDisabled).toBe(false);
    });

    it("updates other filter fields directly in URL", () => {
      const { result } = renderHook(() => useGapAnalysisView());

      act(() => {
        result.current.handleFilterChange("workflowStageId", "5");
      });

      expect(mockPush).toHaveBeenCalledWith(
        "/en/property-tax/property-media/view/101?workflowStageId=5",
        { scroll: false }
      );
    });

    it("toggles filter section visibility on handleFilter", () => {
      const { result } = renderHook(() => useGapAnalysisView());
      expect(result.current.isFilterEnabled).toBe(false);

      act(() => {
        result.current.handleFilter();
      });
      expect(result.current.isFilterEnabled).toBe(true);

      act(() => {
        result.current.handleFilter();
      });
      expect(result.current.isFilterEnabled).toBe(false);
    });
  });

  describe("Search and Clear", () => {
    it("updates search term and syncs to URL with q param", () => {
      const { result } = renderHook(() => useGapAnalysisView());

      act(() => {
        result.current.handleSearchChange("12345");
      });

      expect(result.current.searchTerm).toBe("12345");
      expect(mockPush).toHaveBeenCalledWith(
        "/en/property-tax/property-media/view/101?q=12345",
        { scroll: false }
      );
    });

    it("sanitizes search input by removing special characters and leading spaces", () => {
      const { result } = renderHook(() => useGapAnalysisView());

      act(() => {
        result.current.handleSearchChange("   #123@!  abc  ");
      });

      expect(result.current.searchTerm).toBe("123 abc ");
    });

    it("clears search and navigates to clean pathname on handleClear", () => {
      mockSearchParams.set("q", "OldSearch");
      const { result } = renderHook(() => useGapAnalysisView());

      act(() => {
        result.current.handleClear();
      });

      expect(result.current.searchTerm).toBe("");
      expect(mockPush).toHaveBeenCalledWith(
        "/en/property-tax/property-media/view/101",
        { scroll: false }
      );
    });
  });

  describe("Pagination", () => {
    it("updates page number on handlePageChange without resetting page", () => {
      const { result } = renderHook(() => useGapAnalysisView());

      act(() => {
        result.current.handlePageChange(3);
      });

      expect(mockPush).toHaveBeenCalledWith(
        "/en/property-tax/property-media/view/101?page=3",
        { scroll: false }
      );
    });

    it("updates pageSize on handlePageSizeChange", () => {
      const { result } = renderHook(() => useGapAnalysisView());

      act(() => {
        result.current.handlePageSizeChange(20);
      });

      expect(mockPush).toHaveBeenCalledWith(
        "/en/property-tax/property-media/view/101?pageSize=20",
        { scroll: false }
      );
    });
  });

  describe("Summary Items Generation", () => {
    it("generates summary items matching selected filters with labels or fallback All", () => {
      mockSearchParams.set("divisionId", "1");
      const { result } = renderHook(() =>
        useGapAnalysisView({
          divisionOptions: mockDivisionOptions,
          wardOptions: mockWardOptions,
          propertyTypeOptions: mockPropertyTypeOptions,
          missingPropertyTableData: {
            items: [],
            totalCount: 42,
            totalPages: 5,
            pageNumber: 1,
            pageSize: 10,
            hasPrevious: false,
            hasNext: true,
            gapRecords: 42,
          },
        })
      );

      const items = result.current.summaryItems;
      expect(items).toHaveLength(4);

      // Gap Records
      expect(items[0].value).toBe("42");
      // Division matches option label
      expect(items[1].value).toBe("Zone North");
      // Ward is unselected -> fallback All
      expect(items[2].value).toBe("propertyMediaViewDrawer.summary.all");
      // Property type is unselected -> fallback All
      expect(items[3].value).toBe("propertyMediaViewDrawer.summary.all");
    });
  });

  describe("Drawer Close", () => {
    it("closes drawer and navigates to main screen after timeout", () => {
      vi.useFakeTimers();
      const { result } = renderHook(() => useGapAnalysisView());

      act(() => {
        result.current.handleCancel();
      });

      expect(result.current.isDrawerOpen).toBe(false);

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(mockPush).toHaveBeenCalledWith("/en/property-tax/property-media");
      vi.useRealTimers();
    });
  });
});
