import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { getWingColumns, WingSummary } from "@/components/modules/property-tax/zone-master/properties/wingColumns";

// Mock Badge component
vi.mock("@/components/common", () => ({
  Badge: ({ children, variant, size }: { children: React.ReactNode; variant?: string; size?: string }) => (
    <span data-testid="badge" data-variant={variant} data-size={size}>{children}</span>
  ),
}));

// Mock Lucide icons
vi.mock("lucide-react", () => ({
  PenLine: () => <span data-testid="pen-icon" />,
  Building2: () => <span data-testid="building-icon" />,
}));

describe("wingColumns", () => {
  const mockT = vi.fn((key: string) => key);
  const mockOnEditWing = vi.fn();
  const mockOnUpdateStructure = vi.fn();

  const params = {
    t: mockT,
    onEditWing: mockOnEditWing,
    onUpdateStructure: mockOnUpdateStructure,
  };

  const mockRow: WingSummary = {
    wingName: "Wing A",
    count: 5,
    wingMasterId: 101,
    wingNo: "01",
    wingDetailId: 201,
  };

  it("should return the correct number of columns", () => {
    const columns = getWingColumns(params);
    expect(columns).toHaveLength(4); // wingName, count, aminityCount, actions
  });

  it("should correctly render wing name with badge", () => {
    const columns = getWingColumns(params);
    const wingNameColumn = columns.find((c) => c.key === "wingName");
    
    const result = wingNameColumn?.render?.("Wing A", mockRow as WingSummary & Record<string, unknown>, 0);
    const { getByTestId, getByText } = render(<>{result}</>);
    
    const badge = getByTestId("badge");
    expect(badge.textContent).toBe("01");
    expect(getByText("Wing A")).toBeDefined();
  });

  it("should correctly render total properties count", () => {
    const columns = getWingColumns(params);
    const countColumn = columns.find((c) => c.key === "count");
    
    const result = countColumn?.render?.(5, mockRow as WingSummary & Record<string, unknown>, 0);
    const { getByText } = render(<>{result}</>);
    
    expect(getByText(/5/)).toBeDefined();
    expect(getByText(/partitionForm.wing.table.properties/)).toBeDefined();
  });

  it("should correctly render action buttons and handle clicks", () => {
    const columns = getWingColumns(params);
    const actionsColumn = columns.find((c) => c.key === "wingDetailId");
    
    const result = actionsColumn?.render?.(101, mockRow as WingSummary & Record<string, unknown>, 0);
    const { getByLabelText } = render(<>{result}</>);
    
    const editButton = getByLabelText("partitionForm.wing.table.editWingName");
    const updateButton = getByLabelText("partitionForm.wing.table.updateWing");
    
    fireEvent.click(editButton);
    expect(mockOnEditWing).toHaveBeenCalledWith(mockRow);
    
    fireEvent.click(updateButton);
    expect(mockOnUpdateStructure).toHaveBeenCalledWith(mockRow);
  });
});
