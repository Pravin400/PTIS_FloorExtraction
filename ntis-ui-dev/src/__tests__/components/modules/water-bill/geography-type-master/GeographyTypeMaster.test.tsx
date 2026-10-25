import { render, screen, fireEvent, act } from "@testing-library/react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useConfirm } from "@/components/common/ConfirmProvider";
import type { GeographyType } from "@/types/water-bill/geographyType.types";
import { GeographyTypeMaster } from "@/components/modules/water-bill/geography-type-master";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(() => "/en/water-bill/geography-type-master"),
  useSearchParams: vi.fn(() => ({
    toString: vi.fn(() => ""),
    get: vi.fn(() => ""),
  })),
  redirect: vi.fn(),
}));

vi.mock("next-intl", () => ({
  useTranslations: vi.fn((ns?: string) => {
    const t = (key: string, values?: Record<string, string>) => {
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
}));

vi.mock("@/components/common/ConfirmProvider", () => ({
  useConfirm: vi.fn(() => ({ confirm: vi.fn() })),
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

vi.mock("../geography-shared/GeographyUserManualModal", () => ({
  GeographyUserManualModal: () => <div data-testid="user-manual-modal" />,
}));

const mockRouterPush = vi.fn();
const mockRouterRefresh = vi.fn();
vi.mocked(useRouter).mockImplementation(() => ({
  push: mockRouterPush,
  refresh: mockRouterRefresh,
  back: vi.fn(),
  forward: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
} as unknown as ReturnType<typeof useRouter>));

const defaultProps = {
  data: [
    {
      id: 1,
      geographyTypeCode: "ZONE",
      geographyType: "Zone",
      levelNo: 1,
      isActive: true,
      createdDate: "2026-09-16T10:20:18",
      updatedDate: null,
    },
    {
      id: 2,
      geographyTypeCode: "WARD",
      geographyType: "Ward",
      levelNo: 2,
      isActive: false,
      createdDate: "2026-09-16T10:20:18",
      updatedDate: null,
    },
  ] as GeographyType[],
  pageNumber: 1,
  pageSize: 10,
  totalCount: 2,
  totalPages: 1,
};

describe("GeographyTypeMaster", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(usePathname).mockReturnValue("/en/water-bill/geography-type-master");
    vi.mocked(useSearchParams).mockReturnValue({
      toString: vi.fn(() => ""),
      get: vi.fn(() => ""),
    } as unknown as ReturnType<typeof useSearchParams>);
  });

  it("renders table with data", () => {
    render(<GeographyTypeMaster {...defaultProps} />);
    expect(screen.getByRole("heading", { name: "geographyTypeMaster.list.title" })).toBeInTheDocument();
    expect(screen.getByText("Zone")).toBeInTheDocument();
    expect(screen.getByText("Ward")).toBeInTheDocument();
  });

  it("calls router.push on add button click", () => {
    render(<GeographyTypeMaster {...defaultProps} />);
    const addButton = screen.getByRole("button", { name: "geographyTypeMaster.list.buttons.add" });
    fireEvent.click(addButton);
    expect(mockRouterPush).toHaveBeenCalledWith("/en/water-bill/geography-type-master/add");
  });

  it("navigates to the geography unit master tab", () => {
    render(<GeographyTypeMaster {...defaultProps} />);
    fireEvent.click(screen.getByRole("tab", { name: "geographyUnitMaster.list.title" }));
    expect(mockRouterPush).toHaveBeenCalledWith("/en/water-bill/geography-unit-master?page=1&pageSize=10");
  });

  it("updates URL on search via debounced router.push", () => {
    vi.useFakeTimers();
    try {
      mockRouterPush.mockClear();
      render(<GeographyTypeMaster {...defaultProps} />);
      const searchInput = screen.getByPlaceholderText("geographyTypeMaster.list.filters.search");
      fireEvent.change(searchInput, { target: { value: "Zone" } });
      act(() => {
        vi.runAllTimers();
      });
      expect(mockRouterPush).toHaveBeenCalled();
      const pushedUrl = mockRouterPush.mock.calls[0][0];
      expect(typeof pushedUrl).toBe("string");
      expect(pushedUrl).toContain("Zone");
      expect(pushedUrl).toContain("/en/water-bill/geography-type-master");
    } finally {
      vi.useRealTimers();
    }
  });

  it("calls confirm on delete with correct code", () => {
    const confirmMock = vi.fn();
    vi.mocked(useConfirm).mockImplementation(() => ({ confirm: confirmMock }));
    render(<GeographyTypeMaster {...defaultProps} />);
    const deleteButtons = screen.getAllByRole("button", { name: "common.table.actions.delete" });
    fireEvent.click(deleteButtons[0]);
    expect(confirmMock).toHaveBeenCalled();
    const confirmArgs = confirmMock.mock.calls[0][0];
    expect(confirmArgs.title).toContain("ZONE");
  });

  it("navigates to edit page on edit button click", () => {
    render(<GeographyTypeMaster {...defaultProps} />);
    const editButtons = screen.getAllByRole("button", { name: "common.table.actions.edit" });
    fireEvent.click(editButtons[0]);
    expect(mockRouterPush).toHaveBeenCalledWith("/en/water-bill/geography-type-master/edit/1");
  });

  it("changes page size", async () => {
    mockRouterPush.mockClear();
    render(<GeographyTypeMaster {...defaultProps} />);
    const pageSizeButton = screen.getByLabelText("common.table.rowsPerPage");
    fireEvent.click(pageSizeButton);
    const option20 = await screen.findByRole("option", { name: "20" });
    fireEvent.click(option20);
    expect(mockRouterPush).toHaveBeenCalledWith("/en/water-bill/geography-type-master?page=1&pageSize=20");
  });

  it("clears search", async () => {
    render(<GeographyTypeMaster {...defaultProps} />);
    const searchInput = screen.getByPlaceholderText("geographyTypeMaster.list.filters.search");
    fireEvent.change(searchInput, { target: { value: "Zone" } });
    const clearButton = await screen.findByLabelText("Clear search");
    fireEvent.click(clearButton);
    expect(searchInput).toHaveValue("");
  });

  it("opens the user manual on button click", () => {
    mockRouterPush.mockClear();
    render(<GeographyTypeMaster {...defaultProps} />);
    const manualButton = screen.getByRole("button", { name: "common.buttons.userManual" });
    fireEvent.click(manualButton);
    expect(mockRouterPush).toHaveBeenCalled();
    const pushedUrl = mockRouterPush.mock.calls[0][0];
    expect(pushedUrl).toContain("showUserManual=true");
  });

  it("displays correct pagination info", () => {
    render(<GeographyTypeMaster {...defaultProps} />);
    expect(screen.getByText(/common.table.showing/)).toBeInTheDocument();
  });

  it("renders no sortable column headers (API does not support sorting)", () => {
    render(<GeographyTypeMaster {...defaultProps} />);
    expect(screen.queryAllByRole("button", { name: /Sort by/i })).toHaveLength(0);
  });
});
