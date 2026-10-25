import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { StatusToggleSection } from "@/components/modules/property-tax/property-type-master/components/StatusToggleSection";

describe("StatusToggleSection", () => {
  const defaultProps = {
    isEdit: true,
    isActive: true,
    handleToggleStatus: vi.fn(),
    t: (key: string) => key,
    tCommon: (key: string) => key,
  };

  it("returns null when isEdit is false", () => {
    const { container } = render(<StatusToggleSection {...defaultProps} isEdit={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders correctly when isEdit is true", () => {
    render(<StatusToggleSection {...defaultProps} />);

    expect(screen.getByText("form.status.label")).toBeInTheDocument();
    expect(screen.getByText(/form.status.description/)).toBeInTheDocument();
    expect(screen.getByText(/status.active/)).toBeInTheDocument();
  });

  it("displays inactive text when isActive is false", () => {
    render(<StatusToggleSection {...defaultProps} isActive={false} />);

    expect(screen.getByText(/status.inactive/)).toBeInTheDocument();
  });

  it("calls handleToggleStatus when toggle is clicked", () => {
    render(<StatusToggleSection {...defaultProps} />);

    // The ToggleSwitch likely renders a button or checkbox with role="switch"
    const toggleButton = screen.getByRole("switch");
    fireEvent.click(toggleButton);

    expect(defaultProps.handleToggleStatus).toHaveBeenCalled();
  });

  it("displays validation error when error prop is provided", () => {
    render(<StatusToggleSection {...defaultProps} error="Status is invalid" />);

    expect(screen.getByText("Status is invalid")).toBeInTheDocument();
  });
});
