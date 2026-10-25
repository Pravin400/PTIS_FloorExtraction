import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { StatusToggleSection } from "@/components/modules/assets/configuration/master-data/assessment-year-range/shared/components/StatusToggleSection";

vi.mock("@/components/common", () => ({
  ToggleSwitch: ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      data-testid="status-toggle"
    />
  ),
  ValidationMessage: ({ message, visible }: { message?: string; visible?: boolean }) =>
    visible && message ? <div data-testid="validation-message">{message}</div> : null,
}));

describe("StatusToggleSection (AssessmentYearRange)", () => {
  const mockHandleToggleStatus = vi.fn();
  const mockT = vi.fn((key: string) => key);
  const mockTCommon = vi.fn((key: string) => key);

  const defaultProps = {
    isEdit: true,
    isActive: true,
    handleToggleStatus: mockHandleToggleStatus,
    t: mockT,
    tCommon: mockTCommon,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when isEdit is false", () => {
    const { container } = render(<StatusToggleSection {...defaultProps} isEdit={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders status information when isEdit is true", () => {
    render(<StatusToggleSection {...defaultProps} />);
    expect(screen.getByText("form.status.label")).toBeInTheDocument();
    expect(screen.getByTestId("status-toggle")).toBeChecked();
  });

  it("renders unchecked toggle when isActive is false", () => {
    render(<StatusToggleSection {...defaultProps} isActive={false} />);
    expect(screen.getByTestId("status-toggle")).not.toBeChecked();
  });

  it("calls handleToggleStatus when toggle is clicked", () => {
    render(<StatusToggleSection {...defaultProps} />);
    fireEvent.click(screen.getByTestId("status-toggle"));
    expect(mockHandleToggleStatus).toHaveBeenCalledTimes(1);
  });

  it("shows error message when provided", () => {
    render(<StatusToggleSection {...defaultProps} error="Year range must be active" />);
    expect(screen.getByTestId("validation-message")).toHaveTextContent("Year range must be active");
  });

  it("does not show error message when error is undefined", () => {
    render(<StatusToggleSection {...defaultProps} error={undefined} />);
    expect(screen.queryByTestId("validation-message")).not.toBeInTheDocument();
  });

  it("displays correct status text when isActive is true", () => {
    render(<StatusToggleSection {...defaultProps} isActive={true} />);
    expect(screen.getByText(/status.active/)).toBeInTheDocument();
  });

  it("displays correct status text when isActive is false", () => {
    render(<StatusToggleSection {...defaultProps} isActive={false} />);
    expect(screen.getByText(/status.inactive/)).toBeInTheDocument();
  });

  it("renders status description text", () => {
    render(<StatusToggleSection {...defaultProps} />);
    expect(screen.getByText(/form.status.description/)).toBeInTheDocument();
  });

  it("uses correct translation functions", () => {
    render(<StatusToggleSection {...defaultProps} />);
    
    expect(mockT).toHaveBeenCalledWith("form.status.label");
    expect(mockT).toHaveBeenCalledWith("form.status.description");
    expect(mockTCommon).toHaveBeenCalledWith("status.active");
  });

  it("renders with active styling when isActive is true", () => {
    const { container } = render(<StatusToggleSection {...defaultProps} isActive={true} />);
    
    // Check for the presence of blue/active styling classes
    const innerDiv = container.querySelector(".bg-\\[\\#F0F6FF\\]");
    expect(innerDiv).toBeInTheDocument();
  });

  it("renders with inactive styling when isActive is false", () => {
    const { container } = render(<StatusToggleSection {...defaultProps} isActive={false} />);
    
    // Check for the presence of gray/inactive styling classes
    const innerDiv = container.querySelector(".bg-gray-50");
    expect(innerDiv).toBeInTheDocument();
  });
});
