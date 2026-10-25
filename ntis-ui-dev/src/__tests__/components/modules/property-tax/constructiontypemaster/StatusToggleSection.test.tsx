import { render, screen, fireEvent } from "@testing-library/react";
import { StatusToggleSection } from "@/components/modules/property-tax/construction-type-master/components/StatusToggleSection";

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

describe("StatusToggleSection", () => {
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

  it("calls handleToggleStatus when toggle is clicked", () => {
    render(<StatusToggleSection {...defaultProps} />);
    fireEvent.click(screen.getByTestId("status-toggle"));
    expect(mockHandleToggleStatus).toHaveBeenCalled();
  });

  it("shows error message when provided", () => {
    render(<StatusToggleSection {...defaultProps} error="Must be active" />);
    expect(screen.getByTestId("validation-message")).toHaveTextContent("Must be active");
  });

  it("displays correct status text based on isActive prop", () => {
    const { rerender } = render(<StatusToggleSection {...defaultProps} isActive={true} />);
    expect(screen.getByText(/status.active/)).toBeInTheDocument();

    rerender(<StatusToggleSection {...defaultProps} isActive={false} />);
    expect(screen.getByText(/status.inactive/)).toBeInTheDocument();
  });
});
