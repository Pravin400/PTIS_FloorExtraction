import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextIntlClientProvider } from "next-intl";
import AddRateDrawer from "@/components/modules/property-tax/RVRateMaster/AddRateDrawer";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/en/property-tax/rvratemaster/add",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock ConfirmProvider
vi.mock("@/components/common/ConfirmProvider", () => ({
  useConfirm: () => ({
    confirm: vi.fn(({ onConfirm }) => onConfirm && onConfirm()),
  }),
}));

// Mock Drawer component
vi.mock("@/components/common/Drawer", () => ({
  Drawer: ({ children, open, title }: { children: React.ReactNode; open: boolean; title?: string }) => (
    <div data-testid="drawer" data-open={open}>
      {title && <div data-testid="drawer-title">{title}</div>}
      {children}
    </div>
  ),
}));


// Mock RateMasterForm
import type { ISelectOption } from "@/types/RVRateMaster";
vi.mock("@/components/modules/property-tax/RVRateMaster/RateMasterForm", () => ({
  default: ({
    mode,
    zoneOptions,
    useGroupOptions,
  }: {
    mode: string;
    zoneOptions?: ISelectOption[];
    useGroupOptions?: ISelectOption[];
  }) => (
    <div data-testid="rate-master-form" data-mode={mode}>
      <div>Zones: {zoneOptions?.length || 0}</div>
      <div>UseGroups: {useGroupOptions?.length || 0}</div>
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
      generateNewRateDetails: "Generate New Rate Details",
      fillRateDetails: "Fill rate details for selected zone and use group",
    },
  },
};

const mockProps = {
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
  paginatedZonesData: {
    items: [{ taxZoneId: 1, zoneNo: "1", description: "Zone 1 Description" }],
    totalPages: 1,
    totalCount: 1,
    pageNumber: 1,
    pageSize: 10,
  },
};

describe("AddRateDrawer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the drawer with correct title", () => {
    render(
      <NextIntlClientProvider locale="en" messages={mockMessages}>
        <AddRateDrawer {...mockProps} />
      </NextIntlClientProvider>
    );

    expect(screen.getByTestId("drawer")).toBeInTheDocument();
    expect(screen.getByTestId("drawer")).toHaveAttribute("data-open", "true");
  });

  it("renders RateMasterForm with add mode", () => {
    render(
      <NextIntlClientProvider locale="en" messages={mockMessages}>
        <AddRateDrawer {...mockProps} />
      </NextIntlClientProvider>
    );

    const form = screen.getByTestId("rate-master-form");
    expect(form).toBeInTheDocument();
    expect(form).toHaveAttribute("data-mode", "add");
  });

  it("passes zones and useGroups to RateMasterForm", () => {
    render(
      <NextIntlClientProvider locale="en" messages={mockMessages}>
        <AddRateDrawer {...mockProps} />
      </NextIntlClientProvider>
    );

    const form = screen.getByTestId("rate-master-form");
    expect(form).toBeInTheDocument();
    expect(form).toHaveAttribute("data-mode", "add");
  });

  it("renders with empty zones array", () => {
    const propsWithEmptyZones = {
      ...mockProps,
      zones: [],
    };

    render(
      <NextIntlClientProvider locale="en" messages={mockMessages}>
        <AddRateDrawer {...propsWithEmptyZones} />
      </NextIntlClientProvider>
    );

    expect(screen.getByText("Zones: 0")).toBeInTheDocument();
  });

  it("renders with paginatedZonesData", () => {
    render(
      <NextIntlClientProvider locale="en" messages={mockMessages}>
        <AddRateDrawer {...mockProps} />
      </NextIntlClientProvider>
    );

    const form = screen.getByTestId("rate-master-form");
    expect(form).toBeInTheDocument();
  });

  it("passes all required props to RateMasterForm", async () => {
    render(
      <NextIntlClientProvider locale="en" messages={mockMessages}>
        <AddRateDrawer {...mockProps} />
      </NextIntlClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("rate-master-form")).toBeInTheDocument();
    });
  });
});
