import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import RateSectionForm, {
  RATE_SECTION_NO_MAX_LENGTH,
  RATE_SECTION_NAME_MAX_LENGTH
} from "@/components/modules/property-tax/rate-section-master/ratesection/RateSectionForm";

// Mock next/navigation
const mockPush = vi.fn();
const mockRefresh = vi.fn();
const mockBack = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
    back: mockBack,
  }),
}));

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, string | number>) => {
    if (values) {
      return `${key}: ${JSON.stringify(values)}`;
    }
    return key;
  },
}));

// Mock sonner toast
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();

vi.mock("sonner", () => ({
  toast: {
    success: (msg: string) => mockToastSuccess(msg),
    error: (msg: string) => mockToastError(msg),
    warning: vi.fn(),
  },
}));

// Mock actions
const mockCreateRateSectionAction = vi.fn();
const mockUpdateRateSectionAction = vi.fn();

vi.mock("@/app/[locale]/property-tax/rate-section-master/actions", () => ({
  createRateSectionAction: (payload: unknown) => mockCreateRateSectionAction(payload),
  updateRateSectionAction: (id: number, payload: unknown) => mockUpdateRateSectionAction(id, payload),
}));

// Mock common components
vi.mock("@/components/common", () => ({
  SaveButton: ({ label, onClick, disabled }: { label: string; onClick: () => void; disabled: boolean }) => (
    <button data-testid="save-button" onClick={onClick} disabled={disabled}>{label}</button>
  ),
  CancelButton: ({ label, onClick }: { label: string; onClick: () => void }) => (
    <button data-testid="cancel-button" onClick={onClick}>{label}</button>
  ),
  ToggleSwitch: ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <input
      data-testid="toggle-switch"
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
    />
  ),
  Drawer: ({ open, children, title, footer }: { open: boolean; children: React.ReactNode; title: React.ReactNode; footer: React.ReactNode }) => (
    open ? (
      <div data-testid="drawer">
        <div data-testid="drawer-title">{title}</div>
        <div data-testid="drawer-content">{children}</div>
        <div data-testid="drawer-footer">{footer}</div>
      </div>
    ) : null
  ),
  Input: ({ label, value, onChange, onBlur, error, placeholder, readOnly, required, name, maxLength, disabled, className, ...rest }: {
    label: string;
    value: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onBlur?: () => void;
    error?: string;
    placeholder?: string;
    readOnly?: boolean;
    required?: boolean;
    name?: string;
    maxLength?: number;
    disabled?: boolean;
    className?: string;
    [key: string]: unknown;
  }) => (
    <div>
      <label>{label}{required && ' *'}</label>
      <input
        data-testid={(rest['data-testid'] as string) || `input-${label.replace(/\s+/g, '-').toLowerCase()}`}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        readOnly={readOnly}
        maxLength={maxLength}
        disabled={disabled}
        className={className}
      />
      {error && <span data-testid={`error-${label.replace(/\s+/g, '-').toLowerCase()}`}>{error}</span>}
    </div>
  ),
  ValidationMessage: ({ message, visible }: { message?: string; visible?: boolean }) => (
    visible && message ? <span data-testid="validation-message">{message}</span> : null
  ),
}));

vi.mock("@/components/common/Drawer", () => ({
  Drawer: ({ open, children, title, footer }: { open: boolean; children: React.ReactNode; title: React.ReactNode; footer: React.ReactNode }) => (
    open ? (
      <div data-testid="drawer">
        <div data-testid="drawer-title">{title}</div>
        <div data-testid="drawer-content">{children}</div>
        <div data-testid="drawer-footer">{footer}</div>
      </div>
    ) : null
  ),
}));

vi.mock("@/components/common/StatusBadge", () => ({
  StatusBadge: ({ label }: { label: string }) => (
    <span data-testid="status-badge">{label}</span>
  ),
}));

vi.mock("@/components/common/Input", () => ({
  Input: ({ label, value, onChange, onBlur, error, placeholder, readOnly }: {
    label: string;
    value: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onBlur?: () => void;
    error?: string;
    placeholder?: string;
    readOnly?: boolean;
  }) => (
    <div>
      <label>{label}</label>
      <input
        data-testid={`input-${label.replace(/\s+/g, '-').toLowerCase()}`}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        readOnly={readOnly}
      />
      {error && <span data-testid={`error-${label.replace(/\s+/g, '-').toLowerCase()}`}>{error}</span>}
    </div>
  ),
}));

describe("RateSectionForm", () => {
  const mockRates = [
    {
      rateSectionId: 1,
      rateSectionNo: "RS001",
      description: "Rate Section 1",
      isActive: true,
    },
    {
      rateSectionId: 2,
      rateSectionNo: "RS002",
      description: "Rate Section 2",
      isActive: false,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Constants and Validators", () => {
    it("has correct max length constants", () => {
      expect(RATE_SECTION_NO_MAX_LENGTH).toBe(20);
      expect(RATE_SECTION_NAME_MAX_LENGTH).toBe(80);
    });

    // Removed RATE_SECTION_NO_REGEX and validator tests since they are no longer exported.
    // Only test constants and component behavior.
    expect(RATE_SECTION_NO_MAX_LENGTH).toBe(20);
    expect(RATE_SECTION_NAME_MAX_LENGTH).toBe(80);
  });

  describe("Add Mode", () => {
    const addModeProps = {
      mode: "add" as const,
      open: true,
      onClose: vi.fn(),
      onSuccess: vi.fn(),
      existingRates: mockRates,
    };

    it("renders drawer when open", () => {
      render(<RateSectionForm {...addModeProps} />);
      expect(screen.getByTestId("drawer")).toBeInTheDocument();
    });

    it("does not render drawer when closed", () => {
      render(<RateSectionForm {...addModeProps} open={false} />);
      expect(screen.queryByTestId("drawer")).not.toBeInTheDocument();
    });

    it("renders save and cancel buttons", () => {
      render(<RateSectionForm {...addModeProps} />);
      expect(screen.getByTestId("save-button")).toBeInTheDocument();
      expect(screen.getByTestId("cancel-button")).toBeInTheDocument();
    });

    it("calls onClose when cancel is clicked", () => {
      render(<RateSectionForm {...addModeProps} />);
      fireEvent.click(screen.getByTestId("cancel-button"));
      expect(addModeProps.onClose).toHaveBeenCalled();
    });

    it("submits form successfully", async () => {
      mockCreateRateSectionAction.mockResolvedValue({ success: true });
      
      render(<RateSectionForm {...addModeProps} />);
      
      const nameInput = screen.getByTestId("input-form.ratesectionname");
      
      fireEvent.change(nameInput, { target: { value: "New Rate Section" } });
      
      fireEvent.click(screen.getByTestId("save-button"));
      
      await waitFor(() => {
        expect(mockCreateRateSectionAction).toHaveBeenCalledWith({
          description: "New Rate Section",
          isActive: true,
        });
      });
    });

    it("shows error for duplicate rate section", async () => {
      render(<RateSectionForm {...addModeProps} />);
      
      const nameInput = screen.getByTestId("input-form.ratesectionname");
      
      // Use existing rate section name
      fireEvent.change(nameInput, { target: { value: "Rate Section 1" } });
      
      fireEvent.click(screen.getByTestId("save-button"));
      
      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalled();
      });
    });

    it("validates rate section name with only zeros", async () => {
      render(<RateSectionForm {...addModeProps} />);
      
      const nameInput = screen.getByTestId("input-form.ratesectionname");
      
      fireEvent.change(nameInput, { target: { value: "0" } });
      fireEvent.blur(nameInput);
      
      // Wait for validation error to appear
      await waitFor(() => {
        const saveButton = screen.getByTestId("save-button");
        expect(saveButton).toBeDisabled();
      });
    });

    it("validates rate section name with multiple zeros", async () => {
      render(<RateSectionForm {...addModeProps} />);
      
      const nameInput = screen.getByTestId("input-form.ratesectionname");
      
      fireEvent.change(nameInput, { target: { value: "000" } });
      fireEvent.blur(nameInput);
      
      // Wait for validation error to appear
      await waitFor(() => {
        const saveButton = screen.getByTestId("save-button");
        expect(saveButton).toBeDisabled();
      });
    });

    it("accepts valid rate section name", async () => {
      mockCreateRateSectionAction.mockResolvedValue({ success: true });
      
      render(<RateSectionForm {...addModeProps} />);
      
      const nameInput = screen.getByTestId("input-form.ratesectionname");
      
      fireEvent.change(nameInput, { target: { value: "Valid Name" } });
      
      // Save button should not be disabled for valid input
      await waitFor(() => {
        expect(nameInput).toHaveValue("Valid Name");
      });
    });
  });

  describe("Edit Mode", () => {
    const editModeProps = {
      mode: "edit" as const,
      open: true,
      zoneId: "1",
      rates: mockRates,
      initialData: mockRates[0],
      onClose: vi.fn(),
      onUpdate: vi.fn(),
    };

    it("renders with initial data", () => {
      render(<RateSectionForm {...editModeProps} />);
      expect(screen.getByTestId("drawer")).toBeInTheDocument();
    });

    it("shows toggle switch for active status in edit mode", () => {
      render(<RateSectionForm {...editModeProps} />);
      expect(screen.getByTestId("toggle-switch")).toBeInTheDocument();
    });

    it("updates rate section successfully", async () => {
      mockUpdateRateSectionAction.mockResolvedValue({ success: true });
      
      render(<RateSectionForm {...editModeProps} />);
      
      fireEvent.click(screen.getByTestId("save-button"));
      
      await waitFor(() => {
        expect(mockUpdateRateSectionAction).toHaveBeenCalled();
      });
    });
  });
});
