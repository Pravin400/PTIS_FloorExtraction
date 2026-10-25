import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GapAnalysisHeader } from "@/components/modules/property-tax/PropertyMedia/GapAnalysis/GapAnalysisHeader";

describe("GapAnalysisHeader", () => {
  const mockFilterClick = vi.fn();
  const mockExport = vi.fn();
  const mockTranslate = (key: string) => key;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders header title and all action buttons", () => {
    render(
      <GapAnalysisHeader
        handleFilterClick={mockFilterClick}
        onExport={mockExport}
        isExporting={false}
        t={mockTranslate}
      />
    );

    expect(screen.getByText("gapAnalysis.header.title")).toBeInTheDocument();
    expect(screen.getByText("gapAnalysis.header.filter")).toBeInTheDocument();
    expect(screen.getByText("gapAnalysis.header.excel")).toBeInTheDocument();
    expect(screen.getByText("gapAnalysis.header.pdf")).toBeInTheDocument();
  });

  it("calls handleFilterClick when filter button is clicked", () => {
    render(
      <GapAnalysisHeader
        handleFilterClick={mockFilterClick}
        onExport={mockExport}
        isExporting={false}
        t={mockTranslate}
      />
    );

    fireEvent.click(screen.getByText("gapAnalysis.header.filter"));
    expect(mockFilterClick).toHaveBeenCalledTimes(1);
  });

  it("calls onExport with format 0 when Excel button is clicked", () => {
    render(
      <GapAnalysisHeader
        handleFilterClick={mockFilterClick}
        onExport={mockExport}
        isExporting={false}
        t={mockTranslate}
      />
    );

    fireEvent.click(screen.getByText("gapAnalysis.header.excel"));
    expect(mockExport).toHaveBeenCalledWith(0);
  });

  it("calls onExport with format 1 when PDF button is clicked", () => {
    render(
      <GapAnalysisHeader
        handleFilterClick={mockFilterClick}
        onExport={mockExport}
        isExporting={false}
        t={mockTranslate}
      />
    );

    fireEvent.click(screen.getByText("gapAnalysis.header.pdf"));
    expect(mockExport).toHaveBeenCalledWith(1);
  });

  it("disables export buttons when isExporting is true", () => {
    render(
      <GapAnalysisHeader
        handleFilterClick={mockFilterClick}
        onExport={mockExport}
        isExporting={true}
        t={mockTranslate}
      />
    );

    const excelButton = screen.getByText("gapAnalysis.header.excel").closest("button");
    const pdfButton = screen.getByText("gapAnalysis.header.pdf").closest("button");

    expect(excelButton).toBeDisabled();
    expect(pdfButton).toBeDisabled();
  });
});
