import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { RateViewGrid } from "@/components/modules/property-tax/RVRateMaster/view/RateViewGrid";
import type { IRateMaster, ISelectOption, MatrixColumn } from "@/types/RVRateMaster";

// Mock the common components
vi.mock("@/components/common", () => ({
  StatusBadge: ({ label }: { label: string }) => <div data-testid="status-badge">{label}</div>,
  MatrixGrid: ({ rows }: { rows: Array<{ id: string; cells: Record<string, number>; meta: Record<string, string> }> }) => (
    <div data-testid="matrix-grid">
      {rows.map((row) => (
        <div key={row.id} data-testid={`grid-row-${row.id}`}>
          {Object.entries(row.cells).map(([key, value]) => (
            <span key={key} data-testid={`cell-${row.id}-${key}`}>{value ?? 0}</span>
          ))}
        </div>
      ))}
    </div>
  ),
}));

vi.mock("@/components/common/MatrixGrid", () => ({
  MatrixGridPagination: () => <div data-testid="pagination">Pagination</div>,
}));

vi.mock("@/components/common/GridContainerCard", () => ({
  GridContainerCard: ({ children }: { children: React.ReactNode }) => <div data-testid="grid-container">{children}</div>,
  GridContainerCardHeader: ({ children }: { children: React.ReactNode }) => <div data-testid="grid-header">{children}</div>,
  GridContainerCardContent: ({ children }: { children: React.ReactNode }) => <div data-testid="grid-content">{children}</div>,
}));

describe("RateViewGrid", () => {
  const mockColumns: MatrixColumn[] = [
    { id: "A", label: "Construction A" },
    { id: "B", label: "Construction B" },
    { id: "C", label: "Construction C" },
  ];

  const mockZones: ISelectOption[] = [
    { value: "1", label: "Zone 1" },
    { value: "2", label: "Zone 2" },
  ];

  const mockAssessmentYears: ISelectOption[] = [
    { value: "2024", label: "2024-2025" },
    { value: "2025", label: "2025-2026" },
  ];

  const mockUseGroups: ISelectOption[] = [
    { value: "1", label: "Residential" },
    { value: "2", label: "Commercial" },
  ];

  const mockCategoryColorMap = {
    A: "bg-blue-100",
    B: "bg-green-100",
    C: "bg-yellow-100",
  };

  const mockZoneRemarksMap = new Map([
    ["1", "Zone 1 Remark"],
    ["2", "Zone 2 Remark"],
  ]);

  const mockT = (key: string, values?: Record<string, unknown>) => {
    const translations: Record<string, string> = {
      "messages.rateConfiguration": "Rate Configuration",
      "messages.ratesConfigured": `Rates Configured: ${values?.count || 0}`,
      "columns.taxZoneNo": "Tax Zone No",
      "messages.noRatesMatch": "No rates match your filters",
    };
    return translations[key] || key;
  };

  const mockTCommon = (key: string) => {
    const translations: Record<string, string> = {
      "table.columns.actions": "Actions",
      "buttons.delete": "Delete",
      "table.noData": "No data available",
    };
    return translations[key] || key;
  };

  const getDefaultProps = () => ({
    data: [],
    ratesConfiguredCount: 0,
    columns: mockColumns,
    categoryColorMap: mockCategoryColorMap,
    selectedZone: "1",
    selectedYear: "2024",
    selectedUseGroup: "1",
    zones: mockZones,
    assessmentYears: mockAssessmentYears,
    useGroups: mockUseGroups,
    zoneRemarksMap: mockZoneRemarksMap,
    rateUnit: "SqMeter" as const,
    pageNumber: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0,
    onPageChange: vi.fn(),
    onPageSizeChange: vi.fn(),
    frequencyMismatch: null,
    t: mockT as unknown as ReturnType<typeof import("next-intl").useTranslations>,
    tCommon: mockTCommon as unknown as ReturnType<typeof import("next-intl").useTranslations>,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rate Unit Display", () => {
    it("should display ratePerSqMtr values when rateUnit is SqMeter", () => {
      const mockData: IRateMaster[] = [
        {
          id: "1",
          rateSection: "Section 1",
          zoneNo: "1",
          zoneSection: "Zone 1",
          useGroup: "Residential",
          assessmentYear: "2024",
          rates: [
            { rateCategory: "A", ratePerSqMtr: 100, ratePerSqFt: 1076.39, id: "rate-1" },
            { rateCategory: "B", ratePerSqMtr: 80, ratePerSqFt: 861.11, id: "rate-2" },
            { rateCategory: "C", ratePerSqMtr: 60, ratePerSqFt: 645.83, id: "rate-3" },
          ],
        },
      ];

      const props = { ...getDefaultProps(), data: mockData, ratesConfiguredCount: 3, rateUnit: "SqMeter" as const };
      render(<RateViewGrid {...props} />);

      // Check that the square meter values are displayed
      expect(screen.getByTestId("cell-1-A")).toHaveTextContent("100");
      expect(screen.getByTestId("cell-1-B")).toHaveTextContent("80");
      expect(screen.getByTestId("cell-1-C")).toHaveTextContent("60");
    });

    it("should display ratePerSqFt values when rateUnit is SqFeet", () => {
      const mockData: IRateMaster[] = [
        {
          id: "1",
          rateSection: "Section 1",
          zoneNo: "1",
          zoneSection: "Zone 1",
          useGroup: "Residential",
          assessmentYear: "2024",
          rates: [
            { rateCategory: "A", ratePerSqMtr: 100, ratePerSqFt: 1076.39, id: "rate-1" },
            { rateCategory: "B", ratePerSqMtr: 80, ratePerSqFt: 861.11, id: "rate-2" },
            { rateCategory: "C", ratePerSqMtr: 60, ratePerSqFt: 645.83, id: "rate-3" },
          ],
        },
      ];

      const props = { ...getDefaultProps(), data: mockData, ratesConfiguredCount: 3, rateUnit: "SqFeet" as const };
      render(<RateViewGrid {...props} />);

      // Check that the square feet values are displayed
      expect(screen.getByTestId("cell-1-A")).toHaveTextContent("1076.39");
      expect(screen.getByTestId("cell-1-B")).toHaveTextContent("861.11");
      expect(screen.getByTestId("cell-1-C")).toHaveTextContent("645.83");
    });

    it("should handle multiple zones with different rate units", () => {
      const mockData: IRateMaster[] = [
        {
          id: "1",
          rateSection: "Section 1",
          zoneNo: "1",
          zoneSection: "Zone 1",
          useGroup: "Residential",
          assessmentYear: "2024",
          rates: [
            { rateCategory: "A", ratePerSqMtr: 100, ratePerSqFt: 1076.39, id: "rate-1" },
          ],
        },
        {
          id: "2",
          rateSection: "Section 1",
          zoneNo: "2",
          zoneSection: "Zone 2",
          useGroup: "Residential",
          assessmentYear: "2024",
          rates: [
            { rateCategory: "A", ratePerSqMtr: 150, ratePerSqFt: 1614.59, id: "rate-2" },
          ],
        },
      ];

      const props = { ...getDefaultProps(), data: mockData, ratesConfiguredCount: 2, rateUnit: "SqFeet" as const };
      render(<RateViewGrid {...props} />);

      // Check that both zones show square feet values
      expect(screen.getByTestId("cell-1-A")).toHaveTextContent("1076.39");
      expect(screen.getByTestId("cell-2-A")).toHaveTextContent("1614.59");
    });

    it("should display 0.00 when rate value is null for SqMeter", () => {
      const mockData: IRateMaster[] = [
        {
          id: "1",
          rateSection: "Section 1",
          zoneNo: "1",
          zoneSection: "Zone 1",
          useGroup: "Residential",
          assessmentYear: "2024",
          rates: [
            { rateCategory: "A", ratePerSqMtr: null, ratePerSqFt: 1076.39, id: "rate-1" },
          ],
        },
      ];

      const props = { ...getDefaultProps(), data: mockData, ratesConfiguredCount: 1, rateUnit: "SqMeter" as const };
      render(<RateViewGrid {...props} />);

      expect(screen.getByTestId("cell-1-A")).toHaveTextContent("0");
    });

    it("should display 0.00 when rate value is null for SqFeet", () => {
      const mockData: IRateMaster[] = [
        {
          id: "1",
          rateSection: "Section 1",
          zoneNo: "1",
          zoneSection: "Zone 1",
          useGroup: "Residential",
          assessmentYear: "2024",
          rates: [
            { rateCategory: "A", ratePerSqMtr: 100, ratePerSqFt: null, id: "rate-1" },
          ],
        },
      ];

      const props = { ...getDefaultProps(), data: mockData, ratesConfiguredCount: 1, rateUnit: "SqFeet" as const };
      render(<RateViewGrid {...props} />);

      expect(screen.getByTestId("cell-1-A")).toHaveTextContent("0");
    });

    it("should display 0.00 when rate object is not found", () => {
      const mockData: IRateMaster[] = [
        {
          id: "1",
          rateSection: "Section 1",
          zoneNo: "1",
          zoneSection: "Zone 1",
          useGroup: "Residential",
          assessmentYear: "2024",
          rates: [
            { rateCategory: "B", ratePerSqMtr: 80, ratePerSqFt: 861.11, id: "rate-1" },
          ],
        },
      ];

      const props = { ...getDefaultProps(), data: mockData, ratesConfiguredCount: 1, rateUnit: "SqMeter" as const };
      render(<RateViewGrid {...props} />);

      // Category A should show 0.00 as it's not in the rates array
      expect(screen.getByTestId("cell-1-A")).toHaveTextContent("0");
      expect(screen.getByTestId("cell-1-B")).toHaveTextContent("80");
    });
  });

  describe("Data Display", () => {
    it("should render grid with data", () => {
      const mockData: IRateMaster[] = [
        {
          id: "1",
          rateSection: "Section 1",
          zoneNo: "1",
          zoneSection: "Zone 1",
          useGroup: "Residential",
          assessmentYear: "2024",
          rates: [
            { rateCategory: "A", ratePerSqMtr: 100, ratePerSqFt: 1076.39, id: "rate-1" },
          ],
        },
      ];

      const props = { ...getDefaultProps(), data: mockData, ratesConfiguredCount: 1 };
      render(<RateViewGrid {...props} />);

      expect(screen.getByTestId("matrix-grid")).toBeInTheDocument();
      expect(screen.getByTestId("grid-row-1")).toBeInTheDocument();
    });

    it("should show no data message when data is empty", () => {
      const props = getDefaultProps();
      render(<RateViewGrid {...props} />);

      expect(screen.getByText("No data available")).toBeInTheDocument();
      expect(screen.getByText("No rates match your filters")).toBeInTheDocument();
    });

    it("should display correct rates configured count", () => {
      const mockData: IRateMaster[] = [
        {
          id: "1",
          rateSection: "Section 1",
          zoneNo: "1",
          zoneSection: "Zone 1",
          useGroup: "Residential",
          assessmentYear: "2024",
          rates: [
            { rateCategory: "A", ratePerSqMtr: 100, ratePerSqFt: 1076.39, id: "rate-1" },
            { rateCategory: "B", ratePerSqMtr: 80, ratePerSqFt: 861.11, id: "rate-2" },
          ],
        },
      ];

      const props = { ...getDefaultProps(), data: mockData, ratesConfiguredCount: 2 };
      render(<RateViewGrid {...props} />);

      expect(screen.getByText("Rates Configured: 2")).toBeInTheDocument();
    });
  });

  describe("Filter Badges", () => {
    it("should display zone badge when zone is selected", () => {
      const mockData: IRateMaster[] = [
        {
          id: "1",
          rateSection: "Section 1",
          zoneNo: "1",
          zoneSection: "Zone 1",
          useGroup: "Residential",
          assessmentYear: "2024",
          rates: [],
        },
      ];

      const props = { ...getDefaultProps(), data: mockData, selectedZone: "1" };
      render(<RateViewGrid {...props} />);

      expect(screen.getByText("Zone 1")).toBeInTheDocument();
    });

    it("should not display zone badge when zone is ALL", () => {
      const mockData: IRateMaster[] = [
        {
          id: "1",
          rateSection: "Section 1",
          zoneNo: "1",
          zoneSection: "Zone 1",
          useGroup: "Residential",
          assessmentYear: "2024",
          rates: [],
        },
      ];

      const props = { ...getDefaultProps(), data: mockData, selectedZone: "ALL" };
      const { container } = render(<RateViewGrid {...props} />);

      const badges = container.querySelectorAll('[data-testid="status-badge"]');
      const zoneBadge = Array.from(badges).find(badge => badge.textContent?.includes("Zone"));
      expect(zoneBadge).toBeUndefined();
    });

    it("should display assessment year badge when year is selected", () => {
      const mockData: IRateMaster[] = [
        {
          id: "1",
          rateSection: "Section 1",
          zoneNo: "1",
          zoneSection: "Zone 1",
          useGroup: "Residential",
          assessmentYear: "2024",
          rates: [],
        },
      ];

      const props = { ...getDefaultProps(), data: mockData, selectedYear: "2024" };
      render(<RateViewGrid {...props} />);

      expect(screen.getByText("2024-2025")).toBeInTheDocument();
    });

    it("should display use group badge when use group is selected", () => {
      const mockData: IRateMaster[] = [
        {
          id: "1",
          rateSection: "Section 1",
          zoneNo: "1",
          zoneSection: "Zone 1",
          useGroup: "Residential",
          assessmentYear: "2024",
          rates: [],
        },
      ];

      const props = { ...getDefaultProps(), data: mockData, selectedUseGroup: "1" };
      render(<RateViewGrid {...props} />);

      expect(screen.getByText("Residential")).toBeInTheDocument();
    });
  });

  describe("Pagination", () => {
    it("should render pagination when data is available", () => {
      const mockData: IRateMaster[] = [
        {
          id: "1",
          rateSection: "Section 1",
          zoneNo: "1",
          zoneSection: "Zone 1",
          useGroup: "Residential",
          assessmentYear: "2024",
          rates: [],
        },
      ];

      const props = { ...getDefaultProps(), data: mockData, ratesConfiguredCount: 1 };
      render(<RateViewGrid {...props} />);

      expect(screen.getByTestId("pagination")).toBeInTheDocument();
    });

    it("should not render pagination when no data", () => {
      const props = getDefaultProps();
      render(<RateViewGrid {...props} />);

      expect(screen.queryByTestId("pagination")).not.toBeInTheDocument();
    });
  });

  describe("Rate Value Comparison", () => {
    it("should show different values for same rate when unit changes", () => {
      const mockData: IRateMaster[] = [
        {
          id: "1",
          rateSection: "Section 1",
          zoneNo: "1",
          zoneSection: "Zone 1",
          useGroup: "Residential",
          assessmentYear: "2024",
          rates: [
            { rateCategory: "A", ratePerSqMtr: 100, ratePerSqFt: 50, id: "rate-1" },
          ],
        },
      ];

      // Render with SqMeter
      const propsSqMeter = { ...getDefaultProps(), data: mockData, ratesConfiguredCount: 1, rateUnit: "SqMeter" as const };
      const { rerender, getByTestId } = render(<RateViewGrid {...propsSqMeter} />);
      expect(getByTestId("cell-1-A")).toHaveTextContent("100");

      // Rerender with SqFeet
      const propsSqFeet = { ...getDefaultProps(), data: mockData, ratesConfiguredCount: 1, rateUnit: "SqFeet" as const };
      rerender(<RateViewGrid {...propsSqFeet} />);
      expect(getByTestId("cell-1-A")).toHaveTextContent("50");
    });
  });
});
