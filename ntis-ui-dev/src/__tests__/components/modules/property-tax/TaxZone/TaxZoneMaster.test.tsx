import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextIntlClientProvider } from "next-intl";
import TaxZoneMaster from "@/components/modules/property-tax/taxzonemaster/TaxZoneMaster";
import type { TaxZone } from "@/types/taxzone.types";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/property-tax/taxzone",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock the delete action
vi.mock("@/app/[locale]/property-tax/taxzone/action", () => ({
  deleteTaxZoneAction: vi.fn(),
}));

// Mock ConfirmProvider
vi.mock("@/components/common/ConfirmProvider", () => ({
  useConfirm: () => ({
    confirm: vi.fn((options) => {
      if (options.onConfirm) {
        options.onConfirm();
      }
    }),
  }),
}));

const mockMessages = {
  taxZone: {
    list: {
      title: "Tax Zone Master",
      subtitle: "Manage zones and their types",
      buttons: {
        add: "Add Zone",
        edit: "Edit",
        delete: "Delete",
      },
      filters: {
        search: "Search by Zone No, Zone Type, Remark...",
        searching: "Searching...",
        recordsFound: "Found {count} records",
      },
      table: {
        zoneNo: "Zone No",
        zoneType: "Zone Type",
        remark: "Remark",
        status: "Status",
        actions: "Actions",
      },
    },
    delete: {
      success: "Zone deleted successfully",
      error: "Cannot delete zone because it is in use",
    },
  },
  common: {
    buttons: {
      clear: "Clear",
    },
    table: {
      showingEntries: "Showing {start}-{end} of {total}",
      page: "Page {current} of {total}",
      actions: {
        edit: "Edit",
        delete: "Delete",
      },
    },
    messages: {
      noData: "No data available",
    },
    actions: {
      loading: "Loading...",
    },
  },
};

const mockTaxZones: TaxZone[] = [
  {
    id: 1,
    taxZoneNo: "Z1",
    taxZoneType: "Residential",
    remark: "Test zone 1",
    isActive: true,
  },
  {
    id: 2,
    taxZoneNo: "Z2",
    taxZoneType: "Commercial",
    remark: "Test zone 2",
    isActive: false,
  },
];

describe("TaxZoneMaster", () => {
  const defaultProps = {
    data: mockTaxZones,
    pageNumber: 1,
    pageSize: 10,
    totalCount: 2,
    totalPages: 1,
  };

  function setup(props = {}) {
    return render(
      <NextIntlClientProvider locale="en" messages={mockMessages}>
        <TaxZoneMaster {...defaultProps} {...props} />
      </NextIntlClientProvider>
    );
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders tax zone master list with data", () => {
    setup();

    expect(screen.getByText("Tax Zone Master")).toBeInTheDocument();
    expect(screen.getByText("Manage zones and their types")).toBeInTheDocument();
    expect(screen.getByText("Z1")).toBeInTheDocument();
    expect(screen.getByText("Residential")).toBeInTheDocument();
    expect(screen.getByText("Z2")).toBeInTheDocument();
    expect(screen.getByText("Commercial")).toBeInTheDocument();
  });

  it("renders the Add Zone button and search box", () => {
    setup();

    expect(screen.getByText("Add Zone")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search by Zone No, Zone Type, Remark...")).toBeInTheDocument();
  });

  it("displays action buttons for each row", () => {
    setup();
    
    const editButtons = screen.getAllByLabelText("Edit");
    const deleteButtons = screen.getAllByLabelText("Delete");
    
    expect(editButtons).toHaveLength(2);
    expect(deleteButtons).toHaveLength(2);
  });

  it("displays no data message when data is empty", () => {
    setup({ data: [], totalCount: 0 });
    
    expect(screen.getByText("No data available")).toBeInTheDocument();
  });

  it("respects pagination props", () => {
    setup({
      pageNumber: 2,
      pageSize: 5,
      totalCount: 15,
      totalPages: 3,
    });
    
    // Check that the table is rendered (pagination is handled by MasterTable)
    expect(screen.getByText("Z1")).toBeInTheDocument();
  });
});
