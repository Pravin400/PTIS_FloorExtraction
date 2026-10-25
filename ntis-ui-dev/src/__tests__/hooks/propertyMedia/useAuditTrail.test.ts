import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAuditTrail } from "@/hooks/PropertyMedia/useAuditTrail";
import { usePropertyMediaExport } from "@/hooks/PropertyMedia/usePropertyMediaExport";

const mockPush = vi.fn();
let mockSearchParams = new Map<string, string>();
const mockExportAuditTrail = vi.fn();

vi.mock("next/navigation", () => ({
    useRouter: () => ({
        push: mockPush,
    }),
    usePathname: () => "/en/property-tax/property-media/audit",
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

vi.mock("@/hooks/PropertyMedia/usePropertyMediaExport", () => ({
    usePropertyMediaExport: vi.fn(),
}));

describe("useAuditTrail", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockSearchParams = new Map<string, string>();
        (usePropertyMediaExport as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            exportAuditTrail: mockExportAuditTrail,
            isExporting: false,
        });
    });

    describe("Initialization & Pagination Calculations", () => {
        it("initializes with default page 1, size 10 when initialData is undefined", () => {
            const { result } = renderHook(() => useAuditTrail());

            expect(result.current.isDrawerOpen).toBe(true);
            expect(result.current.pageNumber).toBe(1);
            expect(result.current.pageSize).toBe(10);
            expect(result.current.totalCount).toBe(0);
            expect(result.current.totalPages).toBe(1);
            expect(result.current.paginatedData).toEqual([]);
        });

        it("calculates totalPages based on initialData totalCount and pageSize", () => {
            const { result } = renderHook(() =>
                useAuditTrail({
                    initialData: {
                        items: [
                            {
                                dateTime: "2026-03-01 10:00",
                                user: "Admin",
                                action: "Upload",
                                category: "Photo",
                                result: 5,
                            },
                        ],
                        totalCount: 35,
                        totalPages: 4,
                        pageNumber: 1,
                        pageSize: 10,
                        hasPrevious: false,
                        hasNext: true,
                    },
                })
            );

            expect(result.current.totalCount).toBe(35);
            expect(result.current.totalPages).toBe(4);
            expect(result.current.paginatedData).toHaveLength(1);
        });

        it("prefers URL search params for pageNumber and pageSize", () => {
            mockSearchParams.set("pageNumber", "3");
            mockSearchParams.set("pageSize", "20");

            const { result } = renderHook(() =>
                useAuditTrail({
                    initialData: {
                        items: [],
                        totalCount: 100,
                        totalPages: 5,
                        pageNumber: 1,
                        pageSize: 10,
                        hasPrevious: false,
                        hasNext: true,
                    },
                })
            );

            expect(result.current.pageNumber).toBe(3);
            expect(result.current.pageSize).toBe(20);
        });
    });

    describe("Query Updates & Pagination Handlers", () => {
        it("updates pageNumber query on handlePageChange without resetting", () => {
            const { result } = renderHook(() => useAuditTrail());

            act(() => {
                result.current.handlePageChange(2);
            });

            expect(mockPush).toHaveBeenCalledWith(
                "/en/property-tax/property-media/audit?pageNumber=2"
            );
        });

        it("updates pageSize query and resets pageNumber to 1 on handlePageSizeChange", () => {
            mockSearchParams.set("pageNumber", "4");
            const { result } = renderHook(() => useAuditTrail());

            act(() => {
                result.current.handlePageSizeChange(50);
            });

            expect(mockPush).toHaveBeenCalledWith(
                "/en/property-tax/property-media/audit?pageNumber=1&pageSize=50"
            );
        });
    });

    describe("Export Triggering", () => {
        it("calls exportAuditTrail with current format, pageNumber, and pageSize", () => {
            mockSearchParams.set("pageNumber", "2");
            mockSearchParams.set("pageSize", "25");

            const { result } = renderHook(() => useAuditTrail());

            act(() => {
                result.current.handleExport(0);
            });

            expect(mockExportAuditTrail).toHaveBeenCalledWith({
                format: 0,
                pageNumber: 2,
                pageSize: 25,
            });
        });
    });

    describe("Drawer Closing", () => {
        it("closes drawer and navigates to main screen after 300ms", () => {
            vi.useFakeTimers();
            const { result } = renderHook(() => useAuditTrail());

            act(() => {
                result.current.handleDrawerClose();
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
