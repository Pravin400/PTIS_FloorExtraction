import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GapAnalysisView } from "@/components/modules/property-tax/PropertyMedia/GapAnalysisView/GapAnalysisView";
import { useParams } from "next/navigation";
import { usePropertyMediaExport } from "@/hooks/PropertyMedia/usePropertyMediaExport";
import { useGapAnalysisView } from "@/hooks/PropertyMedia/useGapAnalysisView";

const mockExportMissingProperties = vi.fn();
const mockHandleCancel = vi.fn();
const mockHandleFilter = vi.fn();
const mockHandlePageChange = vi.fn();
const mockHandlePageSizeChange = vi.fn();

vi.mock("next/navigation", () => ({
  useParams: vi.fn(),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/hooks/PropertyMedia/usePropertyMediaExport", () => ({
  usePropertyMediaExport: vi.fn(),
}));

vi.mock("@/hooks/PropertyMedia/useGapAnalysisView", () => ({
  useGapAnalysisView: vi.fn(),
}));

describe("GapAnalysisView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useParams as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      id: "101",
    });
    (usePropertyMediaExport as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      exportMissingProperties: mockExportMissingProperties,
      isExporting: false,
    });
    (useGapAnalysisView as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      isDrawerOpen: true,
      handleCancel: mockHandleCancel,
      summaryItems: [
        { label: "Gap Records", value: "25" },
        { label: "Division", value: "Zone 1" },
        { label: "Ward", value: "Ward A" },
        { label: "Property Type", value: "Residential" },
      ],
      workflowStageId: "2",
      divisionId: "1",
      wardId: "10",
      propertyTypeId: "100",
      searchTerm: "Test",
      isWardDisabled: false,
      handleFilterChange: vi.fn(),
      handleSearchChange: vi.fn(),
      handleClear: vi.fn(),
      handleFilter: mockHandleFilter,
      isFilterEnabled: false,
      columns: [
        { key: "propertyNumber", label: "Property No." },
        { key: "ownerName", label: "Owner Name" },
      ],
      paginatedData: [
        { propertyNumber: "PROP-001", ownerName: "John Doe" },
        { propertyNumber: "PROP-002", ownerName: "Jane Smith" },
      ],
      pageNumber: 1,
      pageSize: 10,
      totalCount: 2,
      totalPages: 1,
      handlePageChange: mockHandlePageChange,
      handlePageSizeChange: mockHandlePageSizeChange,
      t: (key: string) => key,
    });
  });

  it("renders drawer title, subtitle, summary items, and table records", () => {
    render(<GapAnalysisView />);

    expect(screen.getByText("propertyMediaViewDrawer.title")).toBeInTheDocument();
    expect(screen.getByText("propertyMediaViewDrawer.subtitle")).toBeInTheDocument();

    expect(screen.getByText("Gap Records")).toBeInTheDocument();
    expect(screen.getByText("25")).toBeInTheDocument();
    expect(screen.getByText("Division")).toBeInTheDocument();
    expect(screen.getByText("Zone 1")).toBeInTheDocument();

    expect(screen.getByText("PROP-001")).toBeInTheDocument();
    expect(screen.getByText("PROP-002")).toBeInTheDocument();
  });

  it("toggles filter form when Filter button is clicked", () => {
    render(<GapAnalysisView />);

    const filterBtn = screen.getByText("propertyMediaViewDrawer.filter");
    fireEvent.click(filterBtn);

    expect(mockHandleFilter).toHaveBeenCalledTimes(1);
  });

  it("calls exportMissingProperties with format 0 when Excel export button is clicked", () => {
    render(<GapAnalysisView />);

    const excelBtn = screen.getByText("propertyMediaViewDrawer.excel");
    fireEvent.click(excelBtn);

    expect(mockExportMissingProperties).toHaveBeenCalledWith({
      format: 0,
      photoTypeId: "101",
      searchTerm: "Test",
      zoneId: "1",
      wardId: "10",
      workflowStageId: "2",
      propertyTypeId: "100",
      pageNumber: 1,
      pageSize: 10,
    });
  });

  it("calls exportMissingProperties with format 1 when PDF export button is clicked", () => {
    render(<GapAnalysisView />);

    const pdfBtn = screen.getByText("propertyMediaViewDrawer.pdf");
    fireEvent.click(pdfBtn);

    expect(mockExportMissingProperties).toHaveBeenCalledWith({
      format: 1,
      photoTypeId: "101",
      searchTerm: "Test",
      zoneId: "1",
      wardId: "10",
      workflowStageId: "2",
      propertyTypeId: "100",
      pageNumber: 1,
      pageSize: 10,
    });
  });
});
