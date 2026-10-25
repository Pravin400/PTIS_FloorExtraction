import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { NextIntlClientProvider } from "next-intl";
import { ConnectionTypeMaster } from "@/components/modules/water-bill/connection-type-master/ConnectionTypeMaster";
import type { ConnectionType, PagedResponse } from "@/types/waterBill/connectionTypeMaster.types";
import { toast } from "sonner";

beforeAll(() => {
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
});

const mockRouterPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush }),
  useSearchParams: () => new URLSearchParams(""),
  usePathname: () => "/en/water-bill/connection-type-master",
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

vi.mock("@/app/[locale]/water-bill/connection-type-master/actions", () => ({
  deleteConnectionTypeAction: vi.fn(),
}));

vi.mock("@/components/common/ConfirmProvider", () => ({
  useConfirm: () => ({
    confirm: vi.fn((opts) => opts.onConfirm?.()),
  }),
}));

import { deleteConnectionTypeAction } from "@/app/[locale]/water-bill/connection-type-master/actions";
const mockDeleteAction = vi.mocked(deleteConnectionTypeAction);

const mockMessages = {
  connectionTypeMaster: {
    connectionType: {
      title: "Connection Type Master",
      description: "Manage connection types and descriptions",
      searchPlaceholder: "Search connection types...",
      addButton: "Add Connection Type",
      userManualBtn: "User Manual",
      userManual: {
        title: "User Manual",
        desc1: "Desc 1",
        desc2: "Desc 2",
        desc3: "Desc 3",
        desc4: "Desc 4",
        warning: "Warning",
      },
      filters: {
        all: "All records",
        active: "Active",
        inactive: "Inactive",
      },
      table: {
        connectionTypeCode: "Code",
        connectionType: "Connection Type",
        description: "Description",
        statusName: "Status",
      },
      confirm: {
        deleteTitle: "Delete Connection Type",
        deleteDescription: "Are you sure you want to permanently delete this connection type?",
      },
      messages: {
        deleteSuccess: "Connection Type deleted successfully",
        deleteError: "Failed to delete connection type",
      },
    },
  },
  common: {
    table: {
      columns: { actions: "Actions" },
      showing: "Showing",
      to: "to",
      of: "of",
      rowsPerPage: "Rows per page",
      showingEntries: "Showing {start} to {end} of {total}",
      page: "Page",
      actions: {
        edit: "Edit",
        delete: "Delete",
      },
    },
    status: {
      active: "Active",
      inactive: "Inactive",
    },
  },
};

const mockItems: ConnectionType[] = [
  {
    id: 1,
    connectionTypeCode: "RES",
    connectionType: "Residential",
    description: "Standard residential water connection",
    isActive: true,
    createdBy: 1,
    updatedBy: 1,
  },
  {
    id: 2,
    connectionTypeCode: "COM",
    connectionType: "Commercial",
    description: "Commercial water connection",
    isActive: false,
    createdBy: 1,
    updatedBy: 1,
  },
];

const mockPagedData: PagedResponse<ConnectionType> = {
  items: mockItems,
  totalCount: 2,
  pageNumber: 1,
  pageSize: 10,
  totalPages: 1,
  hasPrevious: false,
  hasNext: false,
};

function renderComponent(data: PagedResponse<ConnectionType> = mockPagedData) {
  return render(
    <NextIntlClientProvider locale="en" messages={mockMessages}>
      <ConnectionTypeMaster data={data} />
    </NextIntlClientProvider>
  );
}

describe("ConnectionTypeMaster Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders search bar, status filter, and add button", () => {
    renderComponent();

    expect(screen.getByPlaceholderText("Search connection types...")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /all records/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Add Connection Type/i })).toBeInTheDocument();
  });

  it("renders table columns and data rows accurately", () => {
    renderComponent();

    expect(screen.getByText("Code")).toBeInTheDocument();
    expect(screen.getByText("RES")).toBeInTheDocument();
    expect(screen.getByText("Residential")).toBeInTheDocument();
    expect(screen.getByText("Standard residential water connection")).toBeInTheDocument();
    expect(screen.getByText("COM")).toBeInTheDocument();
    expect(screen.getByText("Commercial")).toBeInTheDocument();
    expect(screen.getByText("Commercial water connection")).toBeInTheDocument();
  });

  it("navigates to add page when Add Connection Type button is clicked", () => {
    renderComponent();

    const addButton = screen.getByRole("button", { name: /Add Connection Type/i });
    fireEvent.click(addButton);

    expect(mockRouterPush).toHaveBeenCalledWith("/en/water-bill/connection-type-master/add");
  });

  it("navigates to edit page when Edit button is clicked on a row", () => {
    renderComponent();

    const editButtons = screen.getAllByRole("button", { name: /edit/i });
    expect(editButtons.length).toBeGreaterThan(0);
    fireEvent.click(editButtons[0]);

    expect(mockRouterPush).toHaveBeenCalledWith("/en/water-bill/connection-type-master/edit/1");
  });

  it("calls delete action and displays toast on Delete confirmation", async () => {
    mockDeleteAction.mockResolvedValueOnce({ success: true, statusCode: 200 });
    renderComponent();

    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
    expect(deleteButtons.length).toBeGreaterThan(0);
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(mockDeleteAction).toHaveBeenCalledWith(1);
      expect(toast.success).toHaveBeenCalledWith("Connection Type deleted successfully");
    });
  });

  it("displays error toast when delete action fails", async () => {
    mockDeleteAction.mockResolvedValueOnce({ success: false, statusCode: 500, error: "Cannot delete record" });
    renderComponent();

    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(mockDeleteAction).toHaveBeenCalledWith(1);
      expect(toast.error).toHaveBeenCalledWith("Cannot delete record");
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

    const searchInput = screen.getByPlaceholderText("Search connection types...");
    fireEvent.change(searchInput, { target: { value: "Residential" } });

    await waitFor(
      () => {
        expect(mockRouterPush).toHaveBeenCalledWith(
          expect.stringContaining("q=Residential")
        );
      },
      { timeout: 1000 }
    );
  });
});
