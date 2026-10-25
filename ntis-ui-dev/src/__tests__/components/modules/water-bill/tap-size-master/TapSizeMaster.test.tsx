import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { NextIntlClientProvider } from "next-intl";
import { TapSizeMaster } from "@/components/modules/water-bill/tap-size-master/TapSizeMaster";
import type { TapSize, PagedResponse } from "@/types/waterBill/tapSizeMaster.types";
import { toast } from "sonner";
import { deleteTapSizeAction } from "@/app/[locale]/water-bill/tap-size-master/actions";
import { mockMessages } from "./mockMessages";

beforeAll(() => {
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
});

const mockRouterPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush }),
  useSearchParams: () => new URLSearchParams(""),
  usePathname: () => "/en/water-bill/tap-size-master",
}));

vi.mock("next-intl", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next-intl")>();
  return {
    ...actual,
    useLocale: () => "en",
  };
});

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/app/[locale]/water-bill/tap-size-master/actions", () => ({
  deleteTapSizeAction: vi.fn(),
}));

vi.mock("@/components/common/ConfirmProvider", () => ({
  useConfirm: () => ({
    confirm: vi.fn((opts) => opts.onConfirm?.()),
  }),
}));

const mockDeleteAction = vi.mocked(deleteTapSizeAction);

const mockItems: TapSize[] = [
  {
    id: 1,
    tapSizeCode: "TAP01",
    tapSize: "1/2 Inch",
    nominalSizeValue: 0.5,
    sizeUnit: "Inch",
    isActive: true,
    createdBy: 1,
    updatedBy: 1,
  },
  {
    id: 2,
    tapSizeCode: "TAP02",
    tapSize: "3/4 Inch",
    nominalSizeValue: 0.75,
    sizeUnit: "Inch",
    isActive: false,
    createdBy: 1,
    updatedBy: 1,
  },
];

const mockPagedData: PagedResponse<TapSize> = {
  items: mockItems,
  totalCount: 2,
  pageNumber: 1,
  pageSize: 10,
  totalPages: 1,
  hasPrevious: false,
  hasNext: false,
};

function renderComponent(data: PagedResponse<TapSize> = mockPagedData) {
  return render(
    <NextIntlClientProvider locale="en" messages={mockMessages}>
      <TapSizeMaster data={data} />
    </NextIntlClientProvider>
  );
}

describe("TapSizeMaster Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders search bar, status filter, and add button", () => {
    renderComponent();

    expect(screen.getByPlaceholderText("Search tap sizes...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Add Tap Size/i })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /all records/i })).toBeInTheDocument();
  });

  it("renders table columns and data rows accurately", () => {
    renderComponent();

    expect(screen.getByText("Code")).toBeInTheDocument();
    expect(screen.getByText("TAP01")).toBeInTheDocument();
    expect(screen.getByText("1/2 Inch")).toBeInTheDocument();
    expect(screen.getByText("0.5")).toBeInTheDocument();
    expect(screen.getByText("TAP02")).toBeInTheDocument();
    expect(screen.getByText("3/4 Inch")).toBeInTheDocument();
    expect(screen.getByText("0.75")).toBeInTheDocument();
  });

  it("navigates to add page when Add Tap Size button is clicked", () => {
    renderComponent();

    const addButton = screen.getByRole("button", { name: /Add Tap Size/i });
    fireEvent.click(addButton);

    expect(mockRouterPush).toHaveBeenCalledWith("/en/water-bill/tap-size-master/add");
  });

  it("navigates to edit page when Edit button is clicked on a row", () => {
    renderComponent();

    const editButtons = screen.getAllByRole("button", { name: /edit/i });
    expect(editButtons.length).toBeGreaterThan(0);
    fireEvent.click(editButtons[0]);

    expect(mockRouterPush).toHaveBeenCalledWith("/en/water-bill/tap-size-master/edit/1");
  });

  it("calls delete action and displays toast on Delete confirmation", async () => {
    mockDeleteAction.mockResolvedValueOnce({ success: true, statusCode: 200 });
    renderComponent();

    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
    expect(deleteButtons.length).toBeGreaterThan(0);
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(mockDeleteAction).toHaveBeenCalledWith(1);
      expect(toast.success).toHaveBeenCalledWith("Tap Size deleted successfully");
    });
  });

  it("displays error toast when delete action fails", async () => {
    mockDeleteAction.mockResolvedValueOnce({ success: false, statusCode: 500, error: "Cannot delete tap size" });
    renderComponent();

    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(mockDeleteAction).toHaveBeenCalledWith(1);
      expect(toast.error).toHaveBeenCalledWith("Cannot delete tap size");
    });
  });

  it("handles status filter changes and pushes new status to router", () => {
    renderComponent();

    const select = screen.getByRole("combobox", { name: /all records/i });
    fireEvent.click(select);
    fireEvent.click(screen.getByRole("option", { name: "Active" }));

    expect(mockRouterPush).toHaveBeenCalledWith(
      expect.stringContaining("status=active")
    );
  });

  it("handles search input change with debouncing", async () => {
    renderComponent();

    const searchInput = screen.getByPlaceholderText("Search tap sizes...");
    fireEvent.change(searchInput, { target: { value: "1/2 Inch" } });

    await waitFor(
      () => {
        expect(mockRouterPush).toHaveBeenCalledWith(
          expect.stringContaining("q=12+Inch")
        );
      },
      { timeout: 1000 }
    );
  });
});
