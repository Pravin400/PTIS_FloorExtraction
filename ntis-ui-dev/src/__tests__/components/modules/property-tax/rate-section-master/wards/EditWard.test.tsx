import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import EditWard from "@/components/modules/property-tax/rate-section-master/wards/EditWard";

// Mock next/navigation
const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

// Mock actions
const mockUpdateWardMasterAction = vi.fn();
vi.mock("@/app/[locale]/property-tax/rate-section-master/actions", () => ({
  updateWardMasterAction: (wardId: number, payload: unknown) => mockUpdateWardMasterAction(wardId, payload),
}));

// Mock common components
vi.mock("@/components/common/Drawer", () => ({
  Drawer: ({ 
    open, 
    children, 
    title, 
    footer,
    onClose,
  }: { 
    open: boolean; 
    children: React.ReactNode; 
    title: React.ReactNode; 
    footer: React.ReactNode;
    onClose: () => void;
  }) => (
    open ? (
      <div data-testid="edit-ward-drawer">
        <div data-testid="drawer-title">{title}</div>
        <div data-testid="drawer-content">{children}</div>
        <div data-testid="drawer-footer">{footer}</div>
        <button data-testid="drawer-close" onClick={onClose}>Close</button>
      </div>
    ) : null
  ),
}));

vi.mock("@/components/common", () => ({
  SaveButton: ({ label, onClick, disabled }: { label: string; onClick: () => void; disabled: boolean }) => (
    <button data-testid="save-button" onClick={onClick} disabled={disabled}>{label}</button>
  ),
  CancelButton: ({ label, onClick, disabled }: { label: string; onClick: () => void; disabled: boolean }) => (
    <button data-testid="cancel-button" onClick={onClick} disabled={disabled}>{label}</button>
  ),
  ToggleSwitch: ({ checked, onChange, showPopup }: { checked: boolean; onChange: (v: boolean) => void; showPopup: boolean }) => (
    <input
      data-testid="toggle-switch"
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      data-showpopup={showPopup}
    />
  ),
  Input: ({ label, value, onChange, onBlur, readOnly, required, type, placeholder, className, 'data-testid': dataTestId }: {
    label: string;
    value: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onBlur?: () => void;
    readOnly?: boolean;
    required?: boolean;
    type?: string;
    placeholder?: string;
    className?: string;
    'data-testid'?: string;
  }) => (
    <div>
      <label>{label}{required && ' *'}</label>
      <input
        data-testid={dataTestId || `input-${label.replace(/\s+/g, '-').toLowerCase()}`}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        readOnly={readOnly}
        type={type || 'text'}
        placeholder={placeholder}
        className={className}
      />
    </div>
  ),
  ValidationMessage: ({ message, visible }: { message?: string; visible: boolean }) => (
    visible && message ? <div data-testid="validation-message">{message}</div> : null
  ),
}));

describe("EditWard", () => {
  const mockRates = [
    {
      rateSectionId: 1,
      rateSectionNo: "RS001",
      description: "Rate Section 1",
      isActive: true,
    },
  ];

  const mockSections = [
    {
      id: 1,
      rateSectionId: 1,
      wardNo: "W001",
      description: "Ward One Description",
      isActive: true,
    },
    {
      id: 2,
      rateSectionId: 1,
      wardNo: "W002",
      description: "Ward Two Description",
      isActive: false,
    },
  ];

  const mockWardData = {
    id: 101,
    wardNo: "W001",
    zoneId: 1,
    description: "Ward One Description",
    sequenceNo: 1,
    isActive: true,
    createdDate: "2024-01-01T00:00:00Z",
    updatedDate: null,
  };

  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    id: "1",
    wardId: "101",
    rates: mockRates,
    sections: mockSections,
    initialWardData: mockWardData,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders drawer when open", () => {
    render(<EditWard {...defaultProps} />);
    expect(screen.getByTestId("edit-ward-drawer")).toBeInTheDocument();
  });

  it("does not render drawer when closed", () => {
    render(<EditWard {...defaultProps} open={false} />);
    expect(screen.queryByTestId("edit-ward-drawer")).not.toBeInTheDocument();
  });

  it("renders drawer title", () => {
    render(<EditWard {...defaultProps} />);
    expect(screen.getByTestId("drawer-title")).toBeInTheDocument();
    expect(screen.getByText("wards.editTitle")).toBeInTheDocument();
  });

  it("renders save and cancel buttons", () => {
    render(<EditWard {...defaultProps} />);
    expect(screen.getByTestId("save-button")).toBeInTheDocument();
    expect(screen.getByTestId("cancel-button")).toBeInTheDocument();
  });

  it("calls onClose when cancel is clicked", () => {
    render(<EditWard {...defaultProps} />);
    fireEvent.click(screen.getByTestId("cancel-button"));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("renders toggle switch for active status", () => {
    render(<EditWard {...defaultProps} />);
    expect(screen.getByTestId("toggle-switch")).toBeInTheDocument();
  });

  it("renders ward number input as editable with validation", () => {
    render(<EditWard {...defaultProps} />);
    const wardNoInput = screen.getByTestId("input-wards.wardno");
    expect(wardNoInput).toBeInTheDocument();
    expect(wardNoInput).not.toHaveAttribute("readonly");
  });

  it("renders description input as editable with validation", () => {
    render(<EditWard {...defaultProps} />);
    const descInput = screen.getByTestId("input-form.description");
    expect(descInput).toBeInTheDocument();
    expect(descInput).not.toHaveAttribute("readonly");
  });

  it("loads ward data from sections", () => {
    render(<EditWard {...defaultProps} />);
    const wardNoInput = screen.getByTestId("input-wards.wardno");
    expect(wardNoInput).toHaveValue("W001");
  });

  it("uses initialWardData description", () => {
    render(<EditWard {...defaultProps} />);
    const descInput = screen.getByTestId("input-form.description");
    expect(descInput).toHaveValue("Ward One Description");
  });

  it("toggles active status", () => {
    render(<EditWard {...defaultProps} />);
    const toggle = screen.getByTestId("toggle-switch");
    
    expect(toggle).toBeChecked();
    fireEvent.click(toggle);
    expect(toggle).not.toBeChecked();
  });

  it("saves ward with updated active status", async () => {
    mockUpdateWardMasterAction.mockResolvedValue({ success: true });
    
    render(<EditWard {...defaultProps} />);
    
    // Toggle active status
    const toggle = screen.getByTestId("toggle-switch");
    fireEvent.click(toggle);
    
    // Save
    fireEvent.click(screen.getByTestId("save-button"));
    
    await waitFor(() => {
      expect(mockUpdateWardMasterAction).toHaveBeenCalledWith(
        101, // ward master id (from initialWardData.id)
        expect.objectContaining({
          isActive: false,
          wardNo: "W001",
          description: "Ward One Description",
          zoneId: 1,
        })
      );
    });
  });

  it("shows success toast on successful update", async () => {
    mockUpdateWardMasterAction.mockResolvedValue({ success: true });
    const { toast } = await import("sonner");
    
    render(<EditWard {...defaultProps} />);
    fireEvent.click(screen.getByTestId("save-button"));
    
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled();
    });
  });

  it("shows error toast on failed update", async () => {
    mockUpdateWardMasterAction.mockResolvedValue({ 
      success: false, 
      error: "Update failed" 
    });
    const { toast } = await import("sonner");
    
    render(<EditWard {...defaultProps} />);
    fireEvent.click(screen.getByTestId("save-button"));
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });

  it("closes drawer and refreshes on successful update", async () => {
    mockUpdateWardMasterAction.mockResolvedValue({ success: true });
    
    render(<EditWard {...defaultProps} />);
    fireEvent.click(screen.getByTestId("save-button"));
    
    await waitFor(() => {
      expect(defaultProps.onClose).toHaveBeenCalled();
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it("disables save button when no data loaded", () => {
    render(
      <EditWard 
        {...defaultProps} 
        id={null} 
        wardId={null}
        sections={[]}
      />
    );
    expect(screen.getByTestId("save-button")).toBeDisabled();
  });

  it("does not save when id is null", async () => {
    render(
      <EditWard 
        {...defaultProps} 
        id={null}
      />
    );
    
    fireEvent.click(screen.getByTestId("save-button"));
    
    await waitFor(() => {
      expect(mockUpdateWardMasterAction).not.toHaveBeenCalled();
    });
  });

  it("resets data when drawer closes", () => {
    const { rerender } = render(<EditWard {...defaultProps} />);
    
    // Close drawer
    rerender(<EditWard {...defaultProps} open={false} />);
    
    // Reopen drawer
    rerender(<EditWard {...defaultProps} open={true} />);
    
    // Data should be reloaded from sections
    expect(screen.getByTestId("input-wards.wardno")).toHaveValue("W001");
  });

  it("handles ward not found in sections", () => {
    render(
      <EditWard 
        {...defaultProps} 
        id="999"
        sections={[]}
      />
    );
    // Should not crash, save button should be disabled
    expect(screen.getByTestId("save-button")).toBeDisabled();
  });

  it("uses fallback empty description when no initialWardData", () => {
    // Remove description from mockSections[0] to test fallback
    const sectionsNoDesc = [
      { ...mockSections[0], description: undefined },
      mockSections[1],
    ];
    render(
      <EditWard 
        {...defaultProps} 
        initialWardData={undefined}
        sections={sectionsNoDesc}
      />
    );
    const descInput = screen.getByTestId("input-form.description");
    expect(descInput).toHaveValue("");
  });
});
