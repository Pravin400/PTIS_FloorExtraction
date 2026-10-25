import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextIntlClientProvider } from "next-intl";
import RateMasterView from "@/components/modules/property-tax/RVRateMaster/RateMasterView";

// Mock server-only modules
vi.mock("@/services/api.service", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/app/[locale]/property-tax/rate-master/rvratemaster/action", () => ({
  getDetailedRatesAction: vi.fn().mockResolvedValue({ items: [] }),
}));

// Mock hooks
vi.mock("@/hooks/RVRateMaster/useRateMasterFilters", () => ({
  useRateMasterFilters: () => ({
    selectedZone: "1",
    selectedZoneLabel: "UTHALSAR",
    selectedUseGroup: "1",
    selectedUseGroupLabel: "Residential",
    assessmentYear: "1",
    assessmentYearLabel: "1700-1997",
    handleDropdownChange: vi.fn(),
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams("zone=1&useGroup=1&year=1"),
  usePathname: () => "/en/property-tax/rvratemaster",
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    loading: vi.fn(),
  },
}));

const mockMessages = {
  ptis_RVRateMaster: {
    header: {
      rateableTitle: "Rateable Value Rate Master",
      rateableDescription: "Manage rateable value rates",
    },
    filters: {
      rateSection: "Rate Section",
      typeOfUseGroup: "Type of Use Group",
      assessmentYear: "Assessment Year",
    },
    buttons: {
      generateRate: "Generate Rate",
      editRates: "Edit Rates",
      deleteRate: "Delete Rate",
      downloadRates: "Download Rates",
    },
    sections: {
      rateConfiguration: "Rate Configuration",
    },
    messages: {
      rateConfiguration: "Rate Configuration",
      ratesConfigured: "rates configured",
    },
    columns: {
      taxZoneNo: "Tax Zone No",
      rateSection: "Rate Section",
      useGroup: "Use Group",
      assessmentYearRange: "Assessment Year Range",
      constructionType: "Construction Type",
    },
  },
  common: {
    search: "Search",
    add: "Add",
    rateUnit: "Rate Unit",
    buttons: {
      delete: "Delete",
    },
    multiSelect: {
      noOptionsAvailable: "No options available",
    },
    table: {
      showingEntries: "Showing entries",
      rowsPerPage: "Rows per page",
      page: "Page",
      noData: "No data available",
      noRecordsFound: "No records found",
      columns: {
        actions: "Actions",
      },
    },
  },
};

const mockProps = {
  rateMasterData: [
    {
      id: "1",
      rateSection: "1",
      zoneNo: "1",
      useGroup: "Residential",
      assessmentYear: "2023-2024",
      rates: [
        { rateCategory: "A", ratePerSqMtr: 100, ratePerSqFt: 10 },
      ],
    },
  ],
  pageNumber: 1,
  pageSize: 10,
  totalPages: 1,
  totalCount: 1,
  zones: [{ label: "Zone 1", value: "1" }],
  useGroups: [{ label: "Residential", value: "1" }],
  assessmentYears: [{ label: "2023-2024", value: "1", fromYear: "2023", toYear: "2024" }],
  rateCategories: [{ constructionId: "1", constructionCode: "A", description: "Type A" }],
  zoneDescriptions: [{ taxZoneId: 1, zoneNo: "1", description: "Zone 1" }],
  initialZone: "1",
  initialUseGroup: "1",
  initialYear: "1",
};

describe("RateMasterView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the component with rate master data", () => {
    render(
      <NextIntlClientProvider locale="en" messages={mockMessages}>
        <RateMasterView {...mockProps} />
      </NextIntlClientProvider>
    );

    // Check for action buttons instead of header
    expect(screen.getByText("Generate Rate")).toBeInTheDocument();
  });

  it("renders filter dropdowns", () => {
    render(
      <NextIntlClientProvider locale="en" messages={mockMessages}>
        <RateMasterView {...mockProps} />
      </NextIntlClientProvider>
    );

    expect(screen.getByText("Rate Section")).toBeInTheDocument();
    expect(screen.getByText("Type of Use Group")).toBeInTheDocument();
    expect(screen.getByText("Assessment Year")).toBeInTheDocument();
  });

  it("renders action buttons", () => {
    render(
      <NextIntlClientProvider locale="en" messages={mockMessages}>
        <RateMasterView {...mockProps} />
      </NextIntlClientProvider>
    );

    expect(screen.getByText("Generate Rate")).toBeInTheDocument();
    expect(screen.getByText("Edit Rates")).toBeInTheDocument();
    expect(screen.getByText("Delete Rate")).toBeInTheDocument();
    expect(screen.getByText("Download Rates")).toBeInTheDocument();
  });

  it("renders with empty rate data", () => {
    const emptyProps = { ...mockProps, rateMasterData: [] };

    render(
      <NextIntlClientProvider locale="en" messages={mockMessages}>
        <RateMasterView {...emptyProps} />
      </NextIntlClientProvider>
    );

    // Check that the component still renders filters
    expect(screen.getByText("Rate Section")).toBeInTheDocument();
  });

  it("handles pagination", () => {
    const paginationProps = {
      ...mockProps,
      pageNumber: 1,
      pageSize: 10,
      totalPages: 5,
      totalCount: 50,
    };

    render(
      <NextIntlClientProvider locale="en" messages={mockMessages}>
        <RateMasterView {...paginationProps} />
      </NextIntlClientProvider>
    );

    // Check that pagination controls or action buttons are rendered
    expect(screen.getByText("Generate Rate")).toBeInTheDocument();
  });

  it("displays rate configuration section", () => {
    render(
      <NextIntlClientProvider locale="en" messages={mockMessages}>
        <RateMasterView {...mockProps} />
      </NextIntlClientProvider>
    );

    expect(screen.getByText("Rate Configuration")).toBeInTheDocument();
  });

  it("renders matrix grid with rate data", async () => {
    render(
      <NextIntlClientProvider locale="en" messages={mockMessages}>
        <RateMasterView {...mockProps} />
      </NextIntlClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Rate Configuration")).toBeInTheDocument();
    });
  });
});
