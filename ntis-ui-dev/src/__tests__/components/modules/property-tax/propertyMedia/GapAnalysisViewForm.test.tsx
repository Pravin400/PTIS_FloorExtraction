import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GapAnalysisViewForm } from "@/components/modules/property-tax/PropertyMedia/GapAnalysisView/GapAnalysisViewForm";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

describe("GapAnalysisViewForm", () => {
  const mockFilterChange = vi.fn();
  const mockSearchChange = vi.fn();
  const mockClear = vi.fn();

  const mockDivisionOptions = [{ value: "1", label: "Zone 1" }];
  const mockWardOptions = [{ value: "10", label: "Ward 10" }];
  const mockWorkflowStageOptions = [{ value: "2", label: "Stage 2" }];
  const mockPropertyTypeOptions = [{ value: "3", label: "Residential" }];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all dropdown labels and search input", () => {
    render(
      <GapAnalysisViewForm
        divisionOptions={mockDivisionOptions}
        wardOptions={mockWardOptions}
        workflowStageOptions={mockWorkflowStageOptions}
        propertyTypeOptions={mockPropertyTypeOptions}
        selectedDivision=""
        selectedWard=""
        selectedWorkflowStage=""
        selectedPropertyType=""
        searchTerm=""
        onFilterChange={mockFilterChange}
        onSearchChange={mockSearchChange}
        onClear={mockClear}
        isWardDisabled={true}
      />
    );

    expect(screen.getByText("propertyMediaViewDrawer.workflowStageLabel")).toBeInTheDocument();
    expect(screen.getByText("propertyMediaViewDrawer.divisionLabel")).toBeInTheDocument();
    expect(screen.getByText("propertyMediaViewDrawer.wardLabel")).toBeInTheDocument();
    expect(screen.getByText("propertyMediaViewDrawer.propertyTypeLabel")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("propertyMediaViewDrawer.searchPlaceholder")).toBeInTheDocument();
  });

  it("triggers onClear when Clear button is clicked", () => {
    render(
      <GapAnalysisViewForm
        onFilterChange={mockFilterChange}
        onSearchChange={mockSearchChange}
        onClear={mockClear}
      />
    );

    const clearButton = screen.getByRole("button");
    fireEvent.click(clearButton);

    expect(mockClear).toHaveBeenCalledTimes(1);
  });

  it("triggers onSearchChange when search input changes", () => {
    render(
      <GapAnalysisViewForm
        searchTerm=""
        onFilterChange={mockFilterChange}
        onSearchChange={mockSearchChange}
        onClear={mockClear}
      />
    );

    const searchInput = screen.getByPlaceholderText("propertyMediaViewDrawer.searchPlaceholder");
    fireEvent.change(searchInput, { target: { value: "PROP-101" } });

    expect(mockSearchChange).toHaveBeenCalledWith("PROP-101");
  });
});