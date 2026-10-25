import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TypeOfUseSection } from "@/components/modules/property-tax/property-type-master/components/TypeOfUseSection";
import type { UseType } from "@/types/typeOfUse.types";

describe("TypeOfUseSection", () => {
  const mockTypeOfUseList = [
    { typeOfUseId: 1, typeOfUseCode: "R1", description: "Residential 1", type: "R" },
    { typeOfUseId: 2, typeOfUseCode: "C1", description: "Commercial 1", type: "C" },
    { typeOfUseId: 3, typeOfUseCode: "R2", description: "Residential 2", type: "R" },
  ] as UseType[];

  const defaultProps = {
    typeOfUseList: mockTypeOfUseList,
    selectedTypeOfUseIds: new Set<number>([1]),
    initialTypeOfUseIds: new Set<number>([1]),
    onToggle: vi.fn(),
    onSelectAll: vi.fn(),
    onClearAll: vi.fn(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    t: (key: string, values?: any) => {
      if (key === "form.typeOfUseSection.selected") return `${values?.count || 0} selected`;
      return key;
    },
  };

  it("renders the section with correct title and selected count", () => {
    render(<TypeOfUseSection {...defaultProps} />);

    expect(screen.getByText("form.typeOfUseSection.title")).toBeInTheDocument();
    expect(screen.getByText("1 selected")).toBeInTheDocument();
  });

  it("renders the list of type of use items", () => {
    render(<TypeOfUseSection {...defaultProps} />);

    expect(screen.getByText("Residential 1")).toBeInTheDocument();
    expect(screen.getByText("Commercial 1")).toBeInTheDocument();
    expect(screen.getByText("Residential 2")).toBeInTheDocument();
  });

  it("filters items based on search term (description)", () => {
    render(<TypeOfUseSection {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText("form.typeOfUseSection.searchPlaceholder");
    fireEvent.change(searchInput, { target: { value: "Residential" } });

    expect(screen.getByText("Residential 1")).toBeInTheDocument();
    expect(screen.getByText("Residential 2")).toBeInTheDocument();
    expect(screen.queryByText("Commercial 1")).not.toBeInTheDocument();
  });

  it("filters items based on search term (code)", () => {
    render(<TypeOfUseSection {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText("form.typeOfUseSection.searchPlaceholder");
    fireEvent.change(searchInput, { target: { value: "C1" } });

    expect(screen.queryByText("Residential 1")).not.toBeInTheDocument();
    expect(screen.getByText("Commercial 1")).toBeInTheDocument();
  });

  it("calls onToggle when a checkbox is clicked", () => {
    render(<TypeOfUseSection {...defaultProps} />);

    // R2 is unselected
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[2]); // Third item (R2)

    expect(defaultProps.onToggle).toHaveBeenCalledWith(3);
  });

  it("calls onSelectAll when select all button is clicked", () => {
    render(<TypeOfUseSection {...defaultProps} />);

    const selectAllBtn = screen.getByText("form.typeOfUseSection.selectAll");
    fireEvent.click(selectAllBtn);

    expect(defaultProps.onSelectAll).toHaveBeenCalled();
  });

  it("calls onClearAll when clear all button is clicked", () => {
    render(<TypeOfUseSection {...defaultProps} />);

    const clearAllBtn = screen.getByText("form.typeOfUseSection.clear");
    fireEvent.click(clearAllBtn);

    expect(defaultProps.onClearAll).toHaveBeenCalled();
  });

  it("displays no matches message when search yields empty results", () => {
    render(<TypeOfUseSection {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText("form.typeOfUseSection.searchPlaceholder");
    fireEvent.change(searchInput, { target: { value: "XYZ" } });

    expect(screen.getByText("form.typeOfUseSection.noMatches")).toBeInTheDocument();
  });
  
  it("displays no items message when list is empty", () => {
    render(<TypeOfUseSection {...defaultProps} typeOfUseList={[]} />);

    expect(screen.getByText("form.typeOfUseSection.noItems")).toBeInTheDocument();
  });

  it("sorts initial (pre-selected) items at the top", () => {
    const items = [
      { typeOfUseId: 1, typeOfUseCode: "R1", description: "Residential 1", type: "R" },
      { typeOfUseId: 2, typeOfUseCode: "C1", description: "Commercial 1", type: "C" },
      { typeOfUseId: 3, typeOfUseCode: "R2", description: "Residential 2", type: "R" },
      { typeOfUseId: 4, typeOfUseCode: "C2", description: "Commercial 2", type: "C" },
    ] as UseType[];

    render(
      <TypeOfUseSection
        {...defaultProps}
        typeOfUseList={items}
        initialTypeOfUseIds={new Set([3, 4])}
        selectedTypeOfUseIds={new Set([3, 4, 1])} // Add 1 as a new selection
      />
    );

    const itemsInOrder = screen.getAllByText(/Residential|Commercial/);
    // Initial items (3 and 4) should come first
    expect(itemsInOrder[0]).toHaveTextContent("Residential 2");
    expect(itemsInOrder[1]).toHaveTextContent("Commercial 2");
  });
});
