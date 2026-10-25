import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import RateSectionContent from "@/components/modules/property-tax/rate-section-master/RateSectionContent";

// Mock next/navigation
const mockPush = vi.fn();
const mockRefresh = vi.fn();
const mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
    back: vi.fn(),
  }),
  useSearchParams: () => mockSearchParams,
  usePathname: () => "/property-tax/rate-section-master",
}));

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

// Mock child components
vi.mock("@/components/modules/property-tax/rate-section-master/ratesection/RateSectionList", () => ({
  default: ({ rates, selectedRateSection }: { rates: unknown[]; selectedRateSection: string | null }) => (
    <div data-testid="rate-section-list">
      <span data-testid="rates-count">{rates.length}</span>
      <span data-testid="selected-zone">{selectedRateSection}</span>
    </div>
  ),
}));

vi.mock("@/components/modules/property-tax/rate-section-master/wards/WardList", () => ({
  default: ({ sections, selectedRateSection }: { sections: unknown[]; selectedRateSection: string | null }) => (
    <div data-testid="ward-list">
      <span data-testid="sections-count">{sections.length}</span>
      <span data-testid="ward-selected-zone">{selectedRateSection}</span>
    </div>
  ),
}));

vi.mock("@/components/modules/property-tax/rate-section-master/ratesection/RateSectionForm", () => ({
  default: ({ open, mode }: { open: boolean; mode: string }) => (
    open ? <div data-testid="rate-section-form" data-mode={mode}>Form Open</div> : null
  ),
}));

vi.mock("@/components/modules/property-tax/rate-section-master/wards/LinkWard", () => ({
  default: ({ open }: { open: boolean }) => (
    open ? <div data-testid="add-ward-drawer">Add Ward Open</div> : null
  ),
}));

vi.mock("@/components/modules/property-tax/rate-section-master/wards/EditWard", () => ({
  default: ({ open }: { open: boolean }) => (
    open ? <div data-testid="edit-ward-drawer">Edit Ward Open</div> : null
  ),
}));

vi.mock("@/components/common/TableHeader", () => ({
  default: ({ title, subtitle, rightContent }: { title: string; subtitle: string; rightContent: React.ReactNode }) => (
    <div data-testid="table-header">
      <h1>{title}</h1>
      <p>{subtitle}</p>
      <div data-testid="header-right-content">{rightContent}</div>
    </div>
  ),
}));

vi.mock("@/components/common/DashboardCard", () => ({
  DashboardCard: ({ label, value }: { label: string; value: number }) => (
    <div data-testid="dashboard-card">
      <span>{label}</span>
      <span data-testid={`value-${label.replace(/\s+/g, '-').toLowerCase()}`}>{value}</span>
    </div>
  ),
}));

describe("RateSectionContent", () => {
  const mockRates = [
    {
      id: 1,
      rateSectionNo: "RS001",
      description: "Rate Section 1",
      isActive: true,
    },
    {
      id: 2,
      rateSectionNo: "RS002",
      description: "Rate Section 2",
      isActive: false,
    },
  ];

  const mockSections = [
    {
      id: 1,
      rateSectionId: 1,
      wardId: 101,
      wardNo: "W001",
      isActive: true,
    },
  ];

  const defaultProps = {
    rates: mockRates,
    sections: mockSections,
    sectionsTotalCount: 1,
    totalRateSectionCount: 2,
    totalWardsCount: 10,
    initialWardCounts: { RS001: 5, RS002: 3 },
    initialSelectedRateSection: "RS001",
    initialSelectedRateSectionLabel: "RS001 - Rate Section 1",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.delete("addRateSection");
    mockSearchParams.delete("addWard");
    mockSearchParams.delete("editWard");
  });

  it("renders table header with title", () => {
    render(<RateSectionContent {...defaultProps} />);
    expect(screen.getByTestId("table-header")).toBeInTheDocument();
  });

  it("renders rate section list with rates", () => {
    render(<RateSectionContent {...defaultProps} />);
    expect(screen.getByTestId("rate-section-list")).toBeInTheDocument();
    expect(screen.getByTestId("rates-count")).toHaveTextContent("2");
  });

  it("renders ward list with sections", () => {
    render(<RateSectionContent {...defaultProps} />);
    expect(screen.getByTestId("ward-list")).toBeInTheDocument();
    expect(screen.getByTestId("sections-count")).toHaveTextContent("1");
  });

  it("displays selected zone in rate section list", () => {
    render(<RateSectionContent {...defaultProps} />);
    expect(screen.getByTestId("selected-zone")).toHaveTextContent("RS001");
  });

  it("displays selected zone in ward list", () => {
    render(<RateSectionContent {...defaultProps} />);
    expect(screen.getByTestId("ward-selected-zone")).toHaveTextContent("RS001");
  });

  it("renders dashboard cards with total counts", () => {
    render(<RateSectionContent {...defaultProps} />);
    const dashboardCards = screen.getAllByTestId("dashboard-card");
    expect(dashboardCards.length).toBe(2);
  });

  it("renders rate section list without errors", () => {
    render(<RateSectionContent {...defaultProps} />);
    // Zone selection is now handled internally by RateSectionList via router.push
    expect(screen.getByTestId("rate-section-list")).toBeInTheDocument();
  });

  it("does not show add rate section form when not triggered", () => {
    render(<RateSectionContent {...defaultProps} />);
    expect(screen.queryByTestId("rate-section-form")).not.toBeInTheDocument();
  });

  it("does not show add ward drawer when not triggered", () => {
    render(<RateSectionContent {...defaultProps} />);
    expect(screen.queryByTestId("add-ward-drawer")).not.toBeInTheDocument();
  });

  it("does not show edit ward drawer when not triggered", () => {
    render(<RateSectionContent {...defaultProps} />);
    expect(screen.queryByTestId("edit-ward-drawer")).not.toBeInTheDocument();
  });

  it("uses first rate section as default when no initialSelectedZone", () => {
    const propsWithoutRateSection = {
      ...defaultProps,
      initialSelectedRateSection: undefined,
    };
    
    render(<RateSectionContent {...propsWithoutRateSection} />);
    // When no initialSelectedRateSection, uses String(rates[0].id) = "1"
    expect(screen.getByTestId("selected-zone")).toHaveTextContent("1");
  });

  it("handles empty rates array", () => {
    const propsWithEmpty = {
      ...defaultProps,
      rates: [],
      initialSelectedRateSection: undefined,
    };
    
    render(<RateSectionContent {...propsWithEmpty} />);
    expect(screen.getByTestId("rates-count")).toHaveTextContent("0");
  });

  it("handles empty sections array", () => {
    const propsWithEmpty = {
      ...defaultProps,
      sections: [],
    };
    
    render(<RateSectionContent {...propsWithEmpty} />);
    expect(screen.getByTestId("sections-count")).toHaveTextContent("0");
  });
});
