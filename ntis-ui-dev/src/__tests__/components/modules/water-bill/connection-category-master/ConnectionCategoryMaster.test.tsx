import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { NextIntlClientProvider } from "next-intl";
import { ConnectionCategoryMaster } from "@/components/modules/water-bill/connection-category-master/ConnectionCategoryMaster";
import type { ConnectionCategory, PagedResponse } from "@/types/waterBill/connectionCategoryMaster.types";
import { toast } from "sonner";

beforeAll(() => {
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
});

const mockRouterPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush }),
  useSearchParams: () => new URLSearchParams(""),
  usePathname: () => "/en/water-bill/connection-category-master",
}));

vi.mock("next-intl", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next-intl")>();
  return { ...actual, useLocale: () => "en" };
});

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/app/[locale]/water-bill/connection-category-master/actions", () => ({
  deleteConnectionCategoryAction: vi.fn(),
}));

vi.mock("@/components/common/ConfirmProvider", () => ({
  useConfirm: () => ({ confirm: vi.fn((opts) => opts.onConfirm?.()) }),
}));

import { deleteConnectionCategoryAction } from "@/app/[locale]/water-bill/connection-category-master/actions";
const mockDeleteAction = vi.mocked(deleteConnectionCategoryAction);

const mockMessages = {
  connectionCategoryMaster: {
    connectionCategory: {
      title: "Connection Category Master",
      description: "Manage connection categories, billing frequencies, and billing methods",
      searchPlaceholder: "Search connection categories...",
      addButton: "Add Connection Category",
      userManualBtn: "User Manual",
      userManual: {
        title: "Connection Category Master — How It Works",
        desc1: "Desc 1", desc2: "Desc 2", desc3: "Desc 3", desc4: "Desc 4", warning: "Warning note",
      },
      filters: {
        all: "All records",
        active: "Active",
        inactive: "Inactive",
        allMetered: "All Meter Types",
        metered: "Metered",
        nonMetered: "Non-Metered",
      },
      table: {
        connectionCategoryCode: "Category Type Code",
        connectionCategory: "Connection Category",
        billingFrequency: "Billing Frequency",
        isMetered: "Metered Type",
        metered: "Metered",
        unmetered: "Non-Metered",
        billingMethod: "Billing Method",
        description: "Description",
        statusName: "Status",
      },
      billingMethods: { Metered: "Metered", Flat: "Flat" },
      confirm: { deleteTitle: "Delete Category", deleteDescription: "Are you sure?" },
      messages: { deleteSuccess: "Deleted successfully", deleteError: "Delete error" },
    },
  },
  common: {
    buttons: { ok: "OK", close: "Close" },
    table: {
      showingEntries: "Showing {start} to {end} of {total} entries",
      columns: { actions: "Actions" },
    },
    messages: { noData: "No data available" },
    actions: { loading: "Loading..." },
    status: {
      active: "Active",
      inactive: "Inactive",
    },
  },
};

const mockData: PagedResponse<ConnectionCategory> = {
  items: [
    {
      id: 1, connectionCategoryCode: "REGULAR", connectionCategory: "Regular Metered",
      billingFrequencyId: 2, billingFrequencyCode: "QUARTERLY", billingFrequency: "Quarterly",
      isMetered: true, billingMethod: "Metered", description: "Standard metered connection",
      isActive: true, createdBy: 1, updatedBy: 1,
    },
    {
      id: 2, connectionCategoryCode: "FLAT", connectionCategory: "Flat Rate",
      billingFrequencyId: 4, billingFrequencyCode: "ANNUAL", billingFrequency: "Annual",
      isMetered: false, billingMethod: "Flat", description: "Flat unmetered connection",
      isActive: false, createdBy: 1, updatedBy: 1,
    },
  ],
  totalCount: 2, pageNumber: 1, pageSize: 10, totalPages: 1, hasPrevious: false, hasNext: false,
};

describe("ConnectionCategoryMaster Component", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  const renderComponent = (data = mockData) =>
    render(
      <NextIntlClientProvider locale="en" messages={mockMessages}>
        <ConnectionCategoryMaster data={data} />
      </NextIntlClientProvider>
    );

  it("renders search bar and filters", () => {
    renderComponent();
    expect(screen.getByPlaceholderText("Search connection categories...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Add Connection Category/i })).toBeInTheDocument();
  });

  it("renders table headers and rows accurately", () => {
    renderComponent();
    expect(screen.getByText("Category Type Code")).toBeInTheDocument();
    expect(screen.getByText("Connection Category")).toBeInTheDocument();
    expect(screen.getByText("REGULAR")).toBeInTheDocument();
    expect(screen.getByText("Regular Metered")).toBeInTheDocument();
    expect(screen.getByText("Quarterly")).toBeInTheDocument();
    expect(screen.getAllByText("Metered")).toHaveLength(2);
  });

  it("navigates to Add page on add button click", () => {
    renderComponent();
    fireEvent.click(screen.getByText("Add Connection Category"));
    expect(mockRouterPush).toHaveBeenCalledWith("/en/water-bill/connection-category-master/add");
  });

  it("opens User Manual modal on click and closes it", () => {
    renderComponent();
    fireEvent.click(screen.getByText("User Manual"));
    expect(screen.getByText("Connection Category Master — How It Works")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /ok/i }));
    expect(screen.queryByText("Connection Category Master — How It Works")).not.toBeInTheDocument();
  });

  it("renders status and meter filter dropdowns", () => {
    renderComponent();
    expect(screen.getByText("All records")).toBeInTheDocument();
    expect(screen.getByText("All Meter Types")).toBeInTheDocument();
  });

  it("handles delete action correctly", async () => {
    mockDeleteAction.mockResolvedValueOnce({ success: true });
    renderComponent();
    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(mockDeleteAction).toHaveBeenCalledWith(1);
      expect(toast.success).toHaveBeenCalledWith("Deleted successfully");
    });
  });
});
