import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createRef } from "react";
import { DetailedCoverageHeader } from "@/components/modules/property-tax/PropertyMedia/GapAnalysis/DetailedCoverageHeader";

describe("DetailedCoverageHeader", () => {
  const mockSearchChange = vi.fn();
  const mockShowAll = vi.fn();
  const mockTranslate = (key: string) => key;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders header title, active category chip, and search input", () => {
    const inputRef = createRef<HTMLInputElement>();

    render(
      <DetailedCoverageHeader
        searchInputRef={inputRef}
        searchTerm=""
        onSearchChange={mockSearchChange}
        currentCategoryLabel="Building Photo"
        isShowAllDisabled={false}
        onShowAll={mockShowAll}
        t={mockTranslate}
      />
    );

    expect(screen.getByText("detailedCoverageHeader.title")).toBeInTheDocument();
    expect(screen.getByText("Building Photo")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("detailedCoverageHeader.searchPlaceholder")).toBeInTheDocument();
    expect(screen.getByText("detailedCoverageHeader.showAll")).toBeInTheDocument();
  });

  it("hides Show All button when isShowAllDisabled is true", () => {
    const inputRef = createRef<HTMLInputElement>();

    render(
      <DetailedCoverageHeader
        searchInputRef={inputRef}
        searchTerm=""
        onSearchChange={mockSearchChange}
        currentCategoryLabel="All Items"
        isShowAllDisabled={true}
        onShowAll={mockShowAll}
        t={mockTranslate}
      />
    );

    expect(screen.queryByText("detailedCoverageHeader.showAll")).not.toBeInTheDocument();
  });

  it("calls onShowAll when Show All button is clicked", () => {
    const inputRef = createRef<HTMLInputElement>();

    render(
      <DetailedCoverageHeader
        searchInputRef={inputRef}
        searchTerm=""
        onSearchChange={mockSearchChange}
        currentCategoryLabel="Building Photo"
        isShowAllDisabled={false}
        onShowAll={mockShowAll}
        t={mockTranslate}
      />
    );

    fireEvent.click(screen.getByText("detailedCoverageHeader.showAll"));
    expect(mockShowAll).toHaveBeenCalledTimes(1);
  });

  it("calls onSearchChange when typing in the search input", () => {
    const inputRef = createRef<HTMLInputElement>();

    render(
      <DetailedCoverageHeader
        searchInputRef={inputRef}
        searchTerm=""
        onSearchChange={mockSearchChange}
        currentCategoryLabel="All Items"
        isShowAllDisabled={true}
        onShowAll={mockShowAll}
        t={mockTranslate}
      />
    );

    const input = screen.getByPlaceholderText("detailedCoverageHeader.searchPlaceholder");
    fireEvent.change(input, { target: { value: "Plot 44" } });

    expect(mockSearchChange).toHaveBeenCalledWith("Plot 44");
  });
});
