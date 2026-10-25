import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ZoneForm from "@/components/modules/property-tax/zone-master/zones/ZoneForm";
import { ZONE_WARD_NO_MAX_LENGTH, ZONE_WARD_NAME_MAX_LENGTH } from "@/components/modules/property-tax/zone-master/constants";

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
const mockCreateZoneAction = vi.fn();
const mockUpdateZoneAction = vi.fn();
const mockGetZoneByIdAction = vi.fn();

vi.mock("@/app/[locale]/property-tax/zone-master/actions", () => ({
  createZoneAction: (payload: unknown) => mockCreateZoneAction(payload),
  updateZoneAction: (id: number, payload: unknown) => mockUpdateZoneAction(id, payload),
  getZoneByIdAction: (id: number) => mockGetZoneByIdAction(id),
}));

// Mock ZoneFormFields
vi.mock("@/components/modules/property-tax/zone-master/zones/ZoneFormFields", () => ({
  ZoneFormFields: ({ data, onChange, errors }: { data: { zoneNo: string; description: string; descriptionEnglish?: string; isActive: boolean }; onChange: (v: { zoneNo: string; description: string; descriptionEnglish?: string; isActive: boolean }) => void; errors?: { zoneNo?: string; description?: string; descriptionEnglish?: string } }) => (
    <div data-testid="zone-form-fields">
      <input
        data-testid="zone-no-input"
        value={data.zoneNo}
        onChange={(e) => onChange({ ...data, zoneNo: e.target.value })}
      />
      <input
        data-testid="zone-description-english-input"
        value={data.descriptionEnglish || ""}
        onChange={(e) => onChange({ ...data, descriptionEnglish: e.target.value })}
      />
      <input
        data-testid="zone-description-input"
        value={data.description}
        onChange={(e) => onChange({ ...data, description: e.target.value })}
      />
      {errors?.zoneNo && <span data-testid="validation-message">{errors.zoneNo}</span>}
      {errors?.descriptionEnglish && <span data-testid="validation-message">{errors.descriptionEnglish}</span>}
      {errors?.description && <span data-testid="validation-message">{errors.description}</span>}
    </div>
  ),
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

vi.mock("@/components/common/Input", () => ({
  Input: ({ value, onChange, onBlur, placeholder, maxLength, className }: {
    value: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onBlur?: () => void;
    placeholder?: string;
    maxLength?: number;
    className?: string;
  }) => (
    <input
      data-testid="zone-input"
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      placeholder={placeholder}
      maxLength={maxLength}
      className={className}
    />
  ),
}));

vi.mock("@/components/common/label", () => ({
  Label: ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
    <label data-testid="label">{children}{required && ' *'}</label>
  ),
}));

vi.mock("@/components/common/ValidationMessage", () => ({
  ValidationMessage: ({ message }: { message?: string }) => (
    message ? <span data-testid="validation-message">{message}</span> : null
  ),
}));

vi.mock("@/lib/utils/cn", () => ({
  cn: (...args: (string | undefined | boolean)[]) => args.filter(Boolean).join(" "),
}));

describe("ZoneForm", () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();
  const mockOnUpdate = vi.fn();

  const mockExistingZones = [
    { id: 1, zoneNo: "UT", description: "उथळसर", isActive: true, createdDate: "2026-04-09", updatedDate: null, sequenceNo: null },
    { id: 2, zoneNo: "NK", description: "नौपाडा", isActive: true, createdDate: "2026-04-09", updatedDate: null, sequenceNo: null },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Add Mode", () => {
    it("renders drawer in add mode when open is true", () => {
      render(
        <ZoneForm
          mode="add"
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          existingZones={mockExistingZones}
        />
      );

      expect(screen.getByTestId("drawer")).toBeInTheDocument();
    });

    it("does not render drawer when open is false", () => {
      render(
        <ZoneForm
          mode="add"
          open={false}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          existingZones={mockExistingZones}
        />
      );

      expect(screen.queryByTestId("drawer")).not.toBeInTheDocument();
    });

    it("disables save button when zone no is empty", async () => {
      render(
        <ZoneForm
          mode="add"
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          existingZones={mockExistingZones}
        />
      );

      const saveButton = screen.getByTestId("save-button");
      expect(saveButton).toBeDisabled();
    });

    it("calls onClose when cancel button is clicked", () => {
      render(
        <ZoneForm
          mode="add"
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          existingZones={mockExistingZones}
        />
      );

      const cancelButton = screen.getByTestId("cancel-button");
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it("calls createZoneAction with correct payload on successful submit", async () => {
      mockCreateZoneAction.mockResolvedValueOnce({ success: true, data: { id: 10, zoneNo: "TEST", description: "Test Zone", descriptionEnglish: "Test English" } });

      render(
        <ZoneForm
          mode="add"
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          existingZones={mockExistingZones}
        />
      );

      // Fill in the form fields
      const zoneNoInput = screen.getByTestId("zone-no-input");
      const zoneDescEngInput = screen.getByTestId("zone-description-english-input");
      const zoneDescInput = screen.getByTestId("zone-description-input");
      
      // Zone No input
      fireEvent.change(zoneNoInput, { target: { value: "TEST" } });
      // English Description input
      fireEvent.change(zoneDescEngInput, { target: { value: "Test English" } });
      // Description input
      fireEvent.change(zoneDescInput, { target: { value: "Test Zone" } });

      const saveButton = screen.getByTestId("save-button");
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockCreateZoneAction).toHaveBeenCalledWith(
          expect.objectContaining({
            zoneNo: "TEST",
            description: "Test Zone",
            descriptionEnglish: "Test English",
          })
        );
      });
    });
  });

  describe("Edit Mode", () => {
    const mockInitialData = {
      id: 1,
      zoneNo: "UT",
      description: "उथळसर",
      descriptionEnglish: "Uthalsar",
      isActive: true,
      createdDate: "2026-04-09",
      updatedDate: null,
      sequenceNo: null,
    };

    it("renders drawer with initial data in edit mode", () => {
      render(
        <ZoneForm
          mode="edit"
          open={true}
          zoneId="1"
          zones={mockExistingZones}
          existingZones={mockExistingZones}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          initialData={mockInitialData}
        />
      );

      expect(screen.getByTestId("drawer")).toBeInTheDocument();
    });

    it("calls updateZoneAction with correct payload on successful submit", async () => {
      mockUpdateZoneAction.mockResolvedValueOnce({ success: true, data: mockInitialData });

      render(
        <ZoneForm
          mode="edit"
          open={true}
          zoneId="1"
          zones={mockExistingZones}
          existingZones={mockExistingZones}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          initialData={mockInitialData}
        />
      );

      const saveButton = screen.getByTestId("save-button");
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateZoneAction).toHaveBeenCalled();
      });
    });
  });

  describe("Validation Constants", () => {
    it("exports correct max length constants", () => {
      expect(ZONE_WARD_NO_MAX_LENGTH).toBe(10);
      expect(ZONE_WARD_NAME_MAX_LENGTH).toBe(50);
    });
  });
});
