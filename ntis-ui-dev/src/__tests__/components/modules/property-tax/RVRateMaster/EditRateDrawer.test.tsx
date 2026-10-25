import type { IBackendRateMaster } from "@/types/RVRateMaster";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextIntlClientProvider } from "next-intl";
import EditRateDrawer from "@/components/modules/property-tax/RVRateMaster/EditRateDrawer";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/en/property-tax/rvratemaster/EditDelete/bulk",
  useSearchParams: () => new URLSearchParams("zone=1&useGroup=1&year=1"),
}));

// Mock Drawer component
vi.mock("@/components/common/Drawer", () => ({
  Drawer: ({ children, open, title, onClose }: { children: React.ReactNode; open: boolean; title?: string; onClose: () => void }) => (
    <div data-testid="drawer" data-open={open}>
      {title && <div data-testid="drawer-title">{title}</div>}
      <button onClick={onClose} data-testid="close-button">Close</button>
      {children}
    </div>
  ),
}));

// Mock RateMasterForm
vi.mock("@/components/modules/property-tax/RVRateMaster/RateMasterForm", () => ({
  default: ({ mode, backendRates, filterValues }: { mode: string; backendRates?: IBackendRateMaster[]; filterValues?: { zone?: string; useGroup?: string } }) => (
    <div data-testid="rate-master-form" data-mode={mode}>
      <div>Backend Rates: {backendRates?.length || 0}</div>
      <div>Filter Zone: {filterValues?.zone || 'none'}</div>
      <div>Filter UseGroup: {filterValues?.useGroup || 'none'}</div>
    </div>
  ),
}));

const mockMessages = {
  ptis_RVRateMaster: {
    aliasFallback: {
      zone: "Zone",
      use: "Use",
    },
    messages: {
      editRateDetails: "Edit Rate Details",
      updateRateDetails: "Update rate details for selected zone and use group",
      deleteRateConfiguration: "Delete Rate Configuration",
      deleteRateDetails: "Delete rate details for selected zone and use group",
    },
  },
};

const mockProps = {
  id: "bulk",
  zones: [
    { label: "Zone 1", value: "1" },
    { label: "Zone 2", value: "2" },
  ],
  useGroups: [
    { label: "Residential", value: "1" },
    { label: "Commercial", value: "2" },
  ],
  assessmentYears: [
    { label: "2023-2024", value: "1", fromYear: "2023", toYear: "2024" },
  ],
  assessmentYearRanges: [
    { label: "2023-2024", value: "1", fromYear: "2023", toYear: "2024" },
  ],
  zoneDescriptions: [
    { taxZoneId: 1, zoneNo: "1", description: "Zone 1 Description" },
  ],
  allZones: [
    { taxZoneId: 1, zoneNo: "1", description: "Zone 1 Description" },
  ],
  rateCategories: [
    { constructionId: "1", constructionCode: "A", description: "Type A" },
  ],
  backendRates: [
    {
      id: 1,
      year: 2023,
      floorId: 1,
      constructionTypeId: 1,
      typeOfUseGroupId: 1,
      rateSectionId: 1,
      taxZoneId: 1,
      yearRangeRVId: 1,
      rateSquareMeter: 100,
      rateSquareFeet: 10,
      rateRemark: "Test remark",
      isActive: true,
      createdDate: "2023-01-01T00:00:00Z",
      updatedDate: null,
    },
  ],
  filterValues: {
    zone: "1",
    useGroup: "1",
    year: "1",
  },
  mode: "edit" as const,
  paginatedZonesData: {
    items: [{ taxZoneId: 1, zoneNo: "1", description: "Zone 1 Description" }],
    totalPages: 1,
    totalCount: 1,
    pageNumber: 1,
    pageSize: 10,
  },
};

describe("EditRateDrawer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the drawer in edit mode", () => {
    render(
      <NextIntlClientProvider locale="en" messages={mockMessages}>
        <EditRateDrawer {...mockProps} />
      </NextIntlClientProvider>
    );

    expect(screen.getByTestId("drawer")).toBeInTheDocument();
    expect(screen.getByTestId("drawer")).toHaveAttribute("data-open", "true");
  });

  it("renders RateMasterForm with edit mode", () => {
    render(
      <NextIntlClientProvider locale="en" messages={mockMessages}>
        <EditRateDrawer {...mockProps} />
      </NextIntlClientProvider>
    );

    const form = screen.getByTestId("rate-master-form");
    expect(form).toBeInTheDocument();
    expect(form).toHaveAttribute("data-mode", "edit");
  });

  it("passes backendRates to RateMasterForm", () => {
    render(
      <NextIntlClientProvider locale="en" messages={mockMessages}>
        <EditRateDrawer {...mockProps} />
      </NextIntlClientProvider>
    );

    expect(screen.getByText("Backend Rates: 1")).toBeInTheDocument();
  });

  it("passes filterValues to RateMasterForm", () => {
    render(
      <NextIntlClientProvider locale="en" messages={mockMessages}>
        <EditRateDrawer {...mockProps} />
      </NextIntlClientProvider>
    );

    expect(screen.getByText("Filter Zone: 1")).toBeInTheDocument();
    expect(screen.getByText("Filter UseGroup: 1")).toBeInTheDocument();
  });

  it("renders in delete mode", () => {
    const deleteProps = { ...mockProps, mode: "delete" as const };

    render(
      <NextIntlClientProvider locale="en" messages={mockMessages}>
        <EditRateDrawer {...deleteProps} />
      </NextIntlClientProvider>
    );

    const form = screen.getByTestId("rate-master-form");
    expect(form).toHaveAttribute("data-mode", "delete");
  });

  it("handles empty backendRates", () => {
    const propsWithEmptyRates = {
      ...mockProps,
      backendRates: [],
    };

    render(
      <NextIntlClientProvider locale="en" messages={mockMessages}>
        <EditRateDrawer {...propsWithEmptyRates} />
      </NextIntlClientProvider>
    );

    expect(screen.getByText("Backend Rates: 0")).toBeInTheDocument();
  });

  it("re-mounts form when filterValues change", async () => {
    const { rerender } = render(
      <NextIntlClientProvider locale="en" messages={mockMessages}>
        <EditRateDrawer {...mockProps} />
      </NextIntlClientProvider>
    );

    const newFilterValues = {
      zone: "2",
      useGroup: "2",
      year: "1",
    };

    rerender(
      <NextIntlClientProvider locale="en" messages={mockMessages}>
        <EditRateDrawer {...mockProps} filterValues={newFilterValues} />
      </NextIntlClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Filter Zone: 2")).toBeInTheDocument();
      expect(screen.getByText("Filter UseGroup: 2")).toBeInTheDocument();
    });
  });

  it("passes all required props to RateMasterForm", () => {
    render(
      <NextIntlClientProvider locale="en" messages={mockMessages}>
        <EditRateDrawer {...mockProps} />
      </NextIntlClientProvider>
    );

    const form = screen.getByTestId("rate-master-form");
    expect(form).toBeInTheDocument();
  });
});
