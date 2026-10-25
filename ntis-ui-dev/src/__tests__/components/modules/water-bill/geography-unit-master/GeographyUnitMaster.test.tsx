import { render, screen, fireEvent, act } from "@testing-library/react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useConfirm } from "@/components/common/ConfirmProvider";
import type { GeographyUnit } from "@/types/water-bill/geographyUnit.types";
import { GeographyUnitMaster } from "@/components/modules/water-bill/geography-unit-master";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(() => "/en/water-bill/geography-unit-master"),
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
      geographyTypeId: 1,
      geographyType: "Zone",
      parentGeographyUnitId: null,
      parentGeographyUnitName: null,
      geographyUnitCode: "UT",
      geographyUnitName: "उथळसर",
      searchSequence: 1,
      markedForDeletion: false,
      markedForDeletionDate: null,
      isActive: true,
      createdDate: "2026-09-19T12:53:47",
      updatedDate: null,
    },
    {
      id: 10,
      geographyTypeId: 2,
      geographyType: "Ward",
      parentGeographyUnitId: 1,
      parentGeographyUnitName: "Zone Parent",
      geographyUnitCode: "UT1",
      geographyUnitName: "Ward One",
      searchSequence: 1,
      markedForDeletion: false,
      markedForDeletionDate: null,
      isActive: false,
      createdDate: "2026-09-19T12:53:47",
      updatedDate: null,
    },
  ] as GeographyUnit[],
  pageNumber: 1,
  pageSize: 10,
  totalCount: 2,
  totalPages: 1,
};

describe("GeographyUnitMaster", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(usePathname).mockReturnValue("/en/water-bill/geography-unit-master");
    vi.mocked(useSearchParams).mockReturnValue({
      toString: vi.fn(() => ""),
      get: vi.fn(() => ""),
    } as unknown as ReturnType<typeof useSearchParams>);
  });

  it("renders table with data", () => {
    render(<GeographyUnitMaster {...defaultProps} />);
    expect(screen.getByRole("heading", { name: "geographyUnitMaster.list.title" })).toBeInTheDocument();
    expect(screen.getByText("उथळसर")).toBeInTheDocument();
    expect(screen.getByText("Ward One")).toBeInTheDocument();
  });

  it("calls router.push on add button click", () => {
    render(<GeographyUnitMaster {...defaultProps} />);
    const addButton = screen.getByRole("button", { name: "geographyUnitMaster.list.buttons.add" });
    fireEvent.click(addButton);
    expect(mockRouterPush).toHaveBeenCalledWith("/en/water-bill/geography-unit-master/add");
  });

  it("navigates to the geography type master tab", () => {
    render(<GeographyUnitMaster {...defaultProps} />);
    fireEvent.click(screen.getByRole("tab", { name: "geographyTypeMaster.list.title" }));
    expect(mockRouterPush).toHaveBeenCalledWith("/en/water-bill/geography-type-master?page=1&pageSize=10");
  });

  it("updates URL on search via debounced router.push", () => {
    vi.useFakeTimers();
    try {
      mockRouterPush.mockClear();
      render(<GeographyUnitMaster {...defaultProps} />);
      const searchInput = screen.getByPlaceholderText("geographyUnitMaster.list.filters.search");
      fireEvent.change(searchInput, { target: { value: "UT1" } });
      act(() => {
        vi.runAllTimers();
      });
      expect(mockRouterPush).toHaveBeenCalled();
      const pushedUrl = mockRouterPush.mock.calls[0][0];
      expect(typeof pushedUrl).toBe("string");
      expect(pushedUrl).toContain("UT1");
      expect(pushedUrl).toContain("/en/water-bill/geography-unit-master");
    } finally {
      vi.useRealTimers();
    }
  });

  it("calls confirm on delete with correct code", () => {
    const confirmMock = vi.fn();
    vi.mocked(useConfirm).mockImplementation(() => ({ confirm: confirmMock }));
    render(<GeographyUnitMaster {...defaultProps} />);
    const deleteButtons = screen.getAllByRole("button", { name: "common.table.actions.delete" });
    fireEvent.click(deleteButtons[0]);
    expect(confirmMock).toHaveBeenCalled();
    const confirmArgs = confirmMock.mock.calls[0][0];
    expect(confirmArgs.title).toContain("UT");
  });

  it("navigates to edit page on edit button click", () => {
    render(<GeographyUnitMaster {...defaultProps} />);
    const editButtons = screen.getAllByRole("button", { name: "common.table.actions.edit" });
    fireEvent.click(editButtons[0]);
    expect(mockRouterPush).toHaveBeenCalledWith("/en/water-bill/geography-unit-master/edit/1");
  });

  it("changes page size", async () => {
    mockRouterPush.mockClear();
    render(<GeographyUnitMaster {...defaultProps} />);
    const pageSizeButton = screen.getByLabelText("common.table.rowsPerPage");
    fireEvent.click(pageSizeButton);
    const option20 = await screen.findByRole("option", { name: "20" });
    fireEvent.click(option20);
    expect(mockRouterPush).toHaveBeenCalledWith("/en/water-bill/geography-unit-master?page=1&pageSize=20");
  });

  it("clears search", async () => {
    render(<GeographyUnitMaster {...defaultProps} />);
    const searchInput = screen.getByPlaceholderText("geographyUnitMaster.list.filters.search");
    fireEvent.change(searchInput, { target: { value: "UT1" } });
    const clearButton = await screen.findByLabelText("Clear search");
    fireEvent.click(clearButton);
    expect(searchInput).toHaveValue("");
  });

  it("opens the user manual on button click", () => {
    mockRouterPush.mockClear();
    render(<GeographyUnitMaster {...defaultProps} />);
    const manualButton = screen.getByRole("button", { name: "common.buttons.userManual" });
    fireEvent.click(manualButton);
    expect(mockRouterPush).toHaveBeenCalled();
    const pushedUrl = mockRouterPush.mock.calls[0][0];
    expect(pushedUrl).toContain("showUserManual=true");
  });

  it("displays correct pagination info", () => {
    render(<GeographyUnitMaster {...defaultProps} />);
    expect(screen.getByText(/common.table.showing/)).toBeInTheDocument();
  });

  it("shows a placeholder for units without a parent", () => {
    render(<GeographyUnitMaster {...defaultProps} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
