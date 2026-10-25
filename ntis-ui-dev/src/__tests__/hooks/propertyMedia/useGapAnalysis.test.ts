import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useGapAnalysis, sanitizeSearchInput } from "@/hooks/PropertyMedia/useGapAnalysis";
import { PropertyMediaCategoryEnum } from "@/lib/constants/propertyMedia.constants";

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
    usePathname: () => "/en/property-tax/property-media",
    useSearchParams: () => ({
        get: (key: string) => mockSearchParams.get(key) ?? null,
        toString: () => {
            const entries = Array.from(mockSearchParams.entries());
            return new URLSearchParams(entries).toString();
        },
    }),
}));

vi.mock("next-intl", () => ({
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

describe("useGapAnalysis", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockSearchParams = new Map<string, string>();
    });

    describe("Initialization", () => {
        it("initializes with default empty values when URL has no params", () => {
            const { result } = renderHook(() => useGapAnalysis());

            expect(result.current.activeCategory).toBe("");
            expect(result.current.searchQuery).toBe("");
            expect(result.current.searchTerm).toBe("");
            expect(result.current.isShowAllDisabled).toBe(true);
            expect(result.current.currentCategoryLabel).toBe("detailedCoverageHeader.allItems");
        });

        it("reads category and search params from URL", () => {
            mockSearchParams.set("category", "1");
            mockSearchParams.set("q", "Sector 4");

            const { result } = renderHook(() => useGapAnalysis());

            expect(result.current.activeCategory).toBe("1");
            expect(result.current.searchQuery).toBe("Sector 4");
            expect(result.current.searchTerm).toBe("Sector 4");
            expect(result.current.isShowAllDisabled).toBe(false);
            expect(result.current.currentCategoryLabel).toBe("gapAnalysis.categories.photo");
        });

        it("falls back to search parameter if q is absent", () => {
            mockSearchParams.set("search", "Plot 12");

            const { result } = renderHook(() => useGapAnalysis());

            expect(result.current.searchQuery).toBe("Plot 12");
            expect(result.current.searchTerm).toBe("Plot 12");
        });

        it("maps plan and document category labels correctly", () => {
            mockSearchParams.set("category", String(PropertyMediaCategoryEnum.PLAN));
            const { result: planResult } = renderHook(() => useGapAnalysis());
            expect(planResult.current.currentCategoryLabel).toBe("gapAnalysis.categories.plan");

            mockSearchParams.set("category", String(PropertyMediaCategoryEnum.DOCUMENT));
            const { result: docResult } = renderHook(() => useGapAnalysis());
            expect(docResult.current.currentCategoryLabel).toBe("gapAnalysis.categories.document");

            mockSearchParams.set("category", "custom_category");
            const { result: customResult } = renderHook(() => useGapAnalysis());
            expect(customResult.current.currentCategoryLabel).toBe("custom_category");
        });
    });

    describe("Search Input and URL Sync", () => {
        it("updates searchTerm with sanitized value on handleSearchChange", () => {
            const { result } = renderHook(() => useGapAnalysis());

            act(() => {
                result.current.handleSearchChange("  Test@123  ");
            });

            expect(result.current.searchTerm).toBe("Test123 ");
            expect(mockPush).toHaveBeenCalledWith(
                "/en/property-tax/property-media?q=Test123",
                { scroll: false }
            );
        });

        it("removes q param when search is cleared", () => {
            mockSearchParams.set("q", "Initial");
            const { result } = renderHook(() => useGapAnalysis());

            act(() => {
                result.current.handleSearchChange("");
            });

            expect(mockPush).toHaveBeenCalledWith(
                "/en/property-tax/property-media",
                { scroll: false }
            );
        });
    });

    describe("Category and Show All Actions", () => {
        it("updates category query and removes page, and pageSize when handleCategoryClick is called", () => {
            mockSearchParams.set("category", "1");
            mockSearchParams.set("page", "3");
            mockSearchParams.set("pageSize", "20");
            const { result } = renderHook(() => useGapAnalysis());

            act(() => {
                result.current.handleCategoryClick("2");
            });

            // Instant effectiveCategory and label reflection
            expect(result.current.effectiveCategory).toBe("2");
            expect(result.current.currentCategoryLabel).toBe("gapAnalysis.categories.plan");

            // Router navigation transition
            expect(mockPush).toHaveBeenCalledWith(
                "/en/property-tax/property-media?category=2",
                { scroll: false }
            );
        });

        it("clears category and removes page, and pageSize when handleShowAll is called", () => {
            mockSearchParams.set("category", "2");
            mockSearchParams.set("q", "Sector");
            mockSearchParams.set("page", "4");
            mockSearchParams.set("pageSize", "50");
            const { result } = renderHook(() => useGapAnalysis());

            act(() => {
                result.current.handleShowAll();
            });

            expect(result.current.effectiveCategory).toBe("");
            expect(result.current.currentCategoryLabel).toBe("detailedCoverageHeader.allItems");
            expect(mockPush).toHaveBeenCalledWith(
                "/en/property-tax/property-media?q=Sector",
                { scroll: false }
            );
        });
    });

    describe("Pagination Handlers", () => {
        it("updates page param on handlePageChange", () => {
            const { result } = renderHook(() => useGapAnalysis());

            act(() => {
                result.current.handlePageChange(3);
            });

            expect(mockPush).toHaveBeenCalledWith(
                "/en/property-tax/property-media?page=3",
                { scroll: false }
            );
        });

        it("updates pageSize and resets page to 1 on handlePageSizeChange", () => {
            mockSearchParams.set("page", "4");
            const { result } = renderHook(() => useGapAnalysis());

            act(() => {
                result.current.handlePageSizeChange(25);
            });

            expect(mockPush).toHaveBeenCalledWith(
                "/en/property-tax/property-media?page=1&pageSize=25",
                { scroll: false }
            );
        });
    });

    describe("Focus Handling", () => {
        it("focuses search input when handleFilterClick is invoked", () => {
            const { result } = renderHook(() => useGapAnalysis());
            const mockFocus = vi.fn();

            (result.current.searchInputRef as unknown as { current: HTMLInputElement }).current = {
                focus: mockFocus,
            } as unknown as HTMLInputElement;

            act(() => {
                result.current.handleFilterClick();
            });

            expect(mockFocus).toHaveBeenCalled();
        });
    });
});
