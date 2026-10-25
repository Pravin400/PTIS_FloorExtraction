import { render, screen, fireEvent, act } from "@testing-library/react";

import { usePathname, useRouter } from "next/navigation";
import { useConfirm } from "@/components/common/ConfirmProvider";
import type { ConstructionType } from "@/types/construction.types";
import { ConstructionTypeMaster } from "@/components/modules/property-tax/construction-type-master";

vi.mock("next/navigation", () => ({
    useRouter: vi.fn(),
    usePathname: vi.fn(() => "/en/property-tax/constructiontype"),
    useSearchParams: vi.fn(() => ({
        get: vi.fn(() => ""),
    })),
    redirect: vi.fn(),
}));
vi.mock("next-intl", () => {
    // Real EN translations for sort-button keys (mirrors en/common.json table.sort.*)
    const COMMON_SORT_STRINGS: Record<string, string> = {
        "table.sort.verb": "Sort",
        "table.sort.ascending": "ascending",
        "table.sort.descending": "descending",
        "table.sort.by": "Sort by",
    };
    return {
        useTranslations: vi.fn((ns?: string) => {
            const t = (key: string, values?: Record<string, string>) => {
                // For the "common" namespace, return real strings for sort keys
                if (ns === "common" && key in COMMON_SORT_STRINGS) {
                    return COMMON_SORT_STRINGS[key];
                }
                let result = ns ? `${ns}.${key}` : key;
                if (values) {
                    Object.entries(values).forEach(([k, v]) => {
                        result = result.replace(`{${k}}`, v);
                    });
                }
                return result;
            };
            return t;
        }),
        useLocale: vi.fn(() => "en"),
    };
});

vi.mock("@/components/common/ConfirmProvider", () => ({
    useConfirm: vi.fn(() => ({ confirm: vi.fn() })),
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const mockRouterPush = vi.fn();
const mockRouterRefresh = vi.fn();
vi.mocked(useRouter).mockImplementation(() => ({
    push: mockRouterPush,
    refresh: mockRouterRefresh,
    back: vi.fn(),
    forward: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn()
} as unknown as ReturnType<typeof useRouter>));

const defaultProps = {
    data: [
        {
            id: 1,
            constructionCode: "C1",
            description: "Concrete",
            searchSequence: 1,
            isActive: true,
            createdDate: "2024-01-01T00:00:00Z",
            updatedDate: "2024-01-01T00:00:00Z",
        },
        {
            id: 2,
            constructionCode: "B1",
            description: "Brick",
            searchSequence: 2,
            isActive: false,
            createdDate: "2024-01-01T00:00:00Z",
            updatedDate: "2024-01-01T00:00:00Z",
        },
    ] as ConstructionType[],
    pageNumber: 1,
    pageSize: 10,
    totalCount: 2,
    totalPages: 1,
    sortBy: undefined,
    sortOrder: undefined,
};

describe("ConstructionTypeMaster", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(usePathname).mockReturnValue("/en/property-tax/constructiontype");
    });

    it("renders table with data", () => {
        render(<ConstructionTypeMaster {...defaultProps} />);
        expect(screen.getByText("construction.constructionType.list.title")).toBeInTheDocument();
        expect(screen.getByText("Concrete")).toBeInTheDocument();
        expect(screen.getByText("Brick")).toBeInTheDocument();
    });

    it("calls router.push on add button click", () => {
        render(<ConstructionTypeMaster {...defaultProps} />);
        const addButton = screen.getByRole("button", { name: "construction.constructionType.list.buttons.add" });
        fireEvent.click(addButton);
        expect(mockRouterPush).toHaveBeenCalledWith("/en/property-tax/constructiontype/add");
    });

    it("updates URL on search via debounced router.push", () => {
        vi.useFakeTimers();
        try {
            mockRouterPush.mockClear();
            render(<ConstructionTypeMaster {...defaultProps} />);
            const searchInput = screen.getByPlaceholderText("construction.constructionType.list.filters.search");
            fireEvent.change(searchInput, { target: { value: "Brick" } });
            act(() => {
                vi.runAllTimers();
            });
            expect(mockRouterPush).toHaveBeenCalled();
            const pushedUrl = mockRouterPush.mock.calls[0][0];
            expect(typeof pushedUrl).toBe("string");
            expect(pushedUrl).toContain("Brick");
            expect(pushedUrl).toContain("/en/property-tax/constructiontype");
        } finally {
            vi.useRealTimers();
        }
    });

    it("calls confirm on delete", () => {
        const confirmMock = vi.fn();
        vi.mocked(useConfirm).mockImplementation(() => ({ confirm: confirmMock }));
        render(<ConstructionTypeMaster {...defaultProps} />);
        const deleteButtons = screen.getAllByRole("button", { name: "common.table.actions.delete" });
        fireEvent.click(deleteButtons[0]);
        expect(confirmMock).toHaveBeenCalled();
    });

    it("changes page size", async () => {
        mockRouterPush.mockClear();
        render(<ConstructionTypeMaster {...defaultProps} />);
        const pageSizeButton = screen.getByLabelText("common.table.rowsPerPage");
        fireEvent.click(pageSizeButton);
        const option20 = await screen.findByRole("option", { name: "20" });
        fireEvent.click(option20);
        expect(mockRouterPush).toHaveBeenCalledWith("/en/property-tax/constructiontype?page=1&pageSize=20");
    });

    it("clears search", async () => {
        render(<ConstructionTypeMaster {...defaultProps} />);
        const searchInput = screen.getByPlaceholderText("construction.constructionType.list.filters.search");
        fireEvent.change(searchInput, { target: { value: "Brick" } });
        const clearButton = await screen.findByLabelText("Clear search");
        fireEvent.click(clearButton);
        expect(searchInput).toHaveValue("");
    });

    it("renders page size dropdown with correct options", async () => {
        render(<ConstructionTypeMaster {...defaultProps} />);
        const pageSizeButton = screen.getByLabelText("common.table.rowsPerPage");
        expect(pageSizeButton).toBeInTheDocument();
        fireEvent.click(pageSizeButton);
        const options = await screen.findAllByRole("option");
        const optionTexts = options.map(option => option.textContent);
        // Updated to match actual options in ConstructionTypeMaster: [10, 20, 30, 40, 50]
        expect(optionTexts).toEqual(["10", "20", "30", "40", "50"]);
    });

    it("navigates to edit page on edit button click", () => {
        render(<ConstructionTypeMaster {...defaultProps} />);
        const editButtons = screen.getAllByRole("button", { name: "common.table.actions.edit" });
        fireEvent.click(editButtons[0]);
        expect(mockRouterPush).toHaveBeenCalledWith("/en/property-tax/constructiontype/edit/1");
    });

    it("displays correct pagination info", () => {
        render(<ConstructionTypeMaster {...defaultProps} />);
        // Check that showing info is displayed
        expect(screen.getByText(/common.table.showing/)).toBeInTheDocument();
    });

    // ========== SORTING TESTS ==========

    it("renders sortable column headers with sort icons", () => {
        render(<ConstructionTypeMaster {...defaultProps} />);
        // Check for sort buttons in column headers (4 columns are sortable: code, descriptionEnglish, description, searchSequence)
        const sortButtons = screen.getAllByRole("button", { name: /Sort by/i });
        expect(sortButtons.length).toBe(4);
    });

    it("navigates to sorted URL when clicking column header", () => {
        mockRouterPush.mockClear();
        render(<ConstructionTypeMaster {...defaultProps} />);
        const sortButton = screen.getByRole("button", { name: /Sort by construction.constructionType.list.table.constructionCode/i });
        fireEvent.click(sortButton);
        expect(mockRouterPush).toHaveBeenCalled();
        const pushedUrl = mockRouterPush.mock.calls[0][0];
        expect(pushedUrl).toContain("sortBy=constructionCode");
        expect(pushedUrl).toContain("sortOrder=asc");
    });

    it("toggles sort order when clicking same column header twice", () => {
        mockRouterPush.mockClear();
        // Render with existing sort
        render(<ConstructionTypeMaster {...defaultProps} sortBy="constructionCode" sortOrder="asc" />);
        // When already sorted, the aria-label is "Sort {label} ascending" not "Sort by {label}"
        const sortButton = screen.getByRole("button", { name: /Sort construction.constructionType.list.table.constructionCode ascending/i });
        fireEvent.click(sortButton);
        expect(mockRouterPush).toHaveBeenCalled();
        const pushedUrl = mockRouterPush.mock.calls[0][0];
        expect(pushedUrl).toContain("sortBy=constructionCode");
        expect(pushedUrl).toContain("sortOrder=desc");
    });

    it("preserves sort params when changing page size", async () => {
        mockRouterPush.mockClear();
        render(<ConstructionTypeMaster {...defaultProps} sortBy="description" sortOrder="asc" />);
        const pageSizeButton = screen.getByLabelText("common.table.rowsPerPage");
        fireEvent.click(pageSizeButton);
        const option20 = await screen.findByRole("option", { name: "20" });
        fireEvent.click(option20);
        expect(mockRouterPush).toHaveBeenCalled();
        const pushedUrl = mockRouterPush.mock.calls[0][0];
        expect(pushedUrl).toContain("sortBy=description");
        expect(pushedUrl).toContain("sortOrder=asc");
        expect(pushedUrl).toContain("pageSize=20");
    });

    it("preserves sort params when searching", () => {
        vi.useFakeTimers();
        try {
            mockRouterPush.mockClear();
            render(<ConstructionTypeMaster {...defaultProps} sortBy="description" sortOrder="desc" />);
            const searchInput = screen.getByPlaceholderText("construction.constructionType.list.filters.search");
            fireEvent.change(searchInput, { target: { value: "Test" } });
            act(() => {
                vi.runAllTimers();
            });
            expect(mockRouterPush).toHaveBeenCalled();
            const pushedUrl = mockRouterPush.mock.calls[0][0];
            expect(pushedUrl).toContain("sortBy=description");
            expect(pushedUrl).toContain("sortOrder=desc");
            expect(pushedUrl).toContain("q=Test");
        } finally {
            vi.useRealTimers();
        }
    });

    it("can sort by description column", () => {
        mockRouterPush.mockClear();
        render(<ConstructionTypeMaster {...defaultProps} />);
        const sortButton = screen.getByRole("button", { name: /^Sort by construction\.constructionType\.list\.table\.description$/i });
        fireEvent.click(sortButton);
        expect(mockRouterPush).toHaveBeenCalled();
        const pushedUrl = mockRouterPush.mock.calls[0][0];
        expect(pushedUrl).toContain("sortBy=description");
    });

    it("can sort by descriptionEnglish column", () => {
        mockRouterPush.mockClear();
        render(<ConstructionTypeMaster {...defaultProps} />);
        const sortButton = screen.getByRole("button", { name: /^Sort by construction\.constructionType\.list\.table\.descriptionEnglish$/i });
        fireEvent.click(sortButton);
        expect(mockRouterPush).toHaveBeenCalled();
        const pushedUrl = mockRouterPush.mock.calls[0][0];
        expect(pushedUrl).toContain("sortBy=descriptionEnglish");
    });

    it("can sort by searchSequence column", () => {
        mockRouterPush.mockClear();
        render(<ConstructionTypeMaster {...defaultProps} />);
        const sortButton = screen.getByRole("button", { name: /Sort by construction.constructionType.list.table.searchSequence/i });
        fireEvent.click(sortButton);
        expect(mockRouterPush).toHaveBeenCalled();
        const pushedUrl = mockRouterPush.mock.calls[0][0];
        expect(pushedUrl).toContain("sortBy=searchSequence");
    });
});
