import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GapAnalysis } from "@/components/modules/property-tax/PropertyMedia/GapAnalysis/GapAnalysis";
import { TableData, DashboardStatistics, DetailedCoverageItem } from "@/types/PropertyMedia/PropertyMedia.types";
import { useRouter } from "next/navigation";
import { usePropertyMediaExport } from "@/hooks/PropertyMedia/usePropertyMediaExport";
import { useGapAnalysis } from "@/hooks/PropertyMedia/useGapAnalysis";

const mockPush = vi.fn();
const mockExportDetailedCoverage = vi.fn();
const mockHandleFilterClick = vi.fn();
const mockHandleSearchChange = vi.fn();
const mockHandleCategoryClick = vi.fn();
const mockHandleShowAll = vi.fn();
const mockHandlePageChange = vi.fn();
const mockHandlePageSizeChange = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/hooks/PropertyMedia/usePropertyMediaExport", () => ({
  usePropertyMediaExport: vi.fn(),
}));

vi.mock("@/hooks/PropertyMedia/useGapAnalysis", () => ({
  useGapAnalysis: vi.fn(),
}));

describe("GapAnalysis Component", () => {
  const mockTableData: TableData = {
    items: [
      {
        id: 1,
        photoTypeId: 101,
        photoTypeName: "Front Photo",
        category: "Building Photo",
        requirement: "Mandatory",
        applicable: 100,
        available: 80,
        missing: 20,
        coveragePercentage: "80%",
      } as DetailedCoverageItem,
      {
        id: 2,
        photoTypeId: 102,
        photoTypeName: "Floor Plan",
        category: "Building Plan",
        requirement: "Additional",
        applicable: 50,
        available: 45,
        missing: 5,
        coveragePercentage: "90%",
      } as DetailedCoverageItem,
    ],
    pageNumber: 1,
    pageSize: 10,
    totalCount: 2,
    totalPages: 1,
    hasPrevious: false,
    hasNext: false,
  };

  const mockStats: DashboardStatistics = {
    totalProperties: { total: 100, structures: 80, units: 120 },
    buildingPhotoAvailable: { total: 80, structures: 60, units: 90 },
    buildingPlanAvailable: { total: 70, structures: 50, units: 80 },
    buildingPhotoMissing: { applicable: 100, available: 80, missing: 20 },
    buildingPlanMissing: { applicable: 50, available: 45, missing: 5 },
    surveyFormMissing: { applicable: 30, available: 20, missing: 10 },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      push: mockPush,
    });
    (usePropertyMediaExport as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      exportDetailedCoverage: mockExportDetailedCoverage,
      isExporting: false,
    });
    (useGapAnalysis as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      searchInputRef: { current: null },
      handleFilterClick: mockHandleFilterClick,
      activeCategory: "1",
      searchTerm: "",
      handleSearchChange: mockHandleSearchChange,
      handleCategoryClick: mockHandleCategoryClick,
      handleShowAll: mockHandleShowAll,
      handlePageChange: mockHandlePageChange,
      handlePageSizeChange: mockHandlePageSizeChange,
      currentCategoryLabel: "Building Photo",
      isShowAllDisabled: false,
      t: (key: string) => key,
    });
  });

  it("renders subcomponents: header, summary cards, detailed coverage header, and table", () => {
    render(<GapAnalysis dashboardStats={mockStats} tableData={mockTableData} />);

    expect(screen.getByText("gapAnalysis.header.title")).toBeInTheDocument();
    expect(screen.getByText("gapAnalysis.summaryCards.buildingPhotoMissing")).toBeInTheDocument();
    expect(screen.getByText("detailedCoverageHeader.title")).toBeInTheDocument();
    expect(screen.getByText("Front Photo")).toBeInTheDocument();
    expect(screen.getByText("Floor Plan")).toBeInTheDocument();
  });

  it("navigates to view screen when View preview button is clicked", () => {
    render(<GapAnalysis dashboardStats={mockStats} tableData={mockTableData} />);

    const viewButtons = screen.getAllByText("detailedCoverageTable.buttons.view");
    fireEvent.click(viewButtons[0]);

    expect(mockPush).toHaveBeenCalledWith("/en/property-tax/property-media/view/101");
  });

  it("triggers export with correct params on Excel export click", () => {
    render(<GapAnalysis dashboardStats={mockStats} tableData={mockTableData} />);

    const excelButton = screen.getByText("gapAnalysis.header.excel");
    fireEvent.click(excelButton);

    expect(mockExportDetailedCoverage).toHaveBeenCalledWith({
      format: 0,
      category: "1",
      searchTerm: undefined,
      pageNumber: 1,
      pageSize: 10,
    });
  });

  it("triggers export with format 1 on PDF export click", () => {
    render(<GapAnalysis dashboardStats={mockStats} tableData={mockTableData} />);

    const pdfButton = screen.getByText("gapAnalysis.header.pdf");
    fireEvent.click(pdfButton);

    expect(mockExportDetailedCoverage).toHaveBeenCalledWith({
      format: 1,
      category: "1",
      searchTerm: undefined,
      pageNumber: 1,
      pageSize: 10,
    });
  });
});
