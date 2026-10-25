/* eslint-disable @typescript-eslint/no-explicit-any */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { toast } from "sonner";
import { OwnershipTypeForm } from "@/components/modules/assets/configuration/master-data/ownership-type-master/OwnershipTypeForm";
import * as actions from "@/app/[locale]/assets/configuration/master-data/ownership-type/actions";
import { validateOwnershipTypeForm } from "@/lib/validations/ownership-type-form.validation";

const mockPush = vi.fn();
const mockRefresh = vi.fn();
const mockBack = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh, back: mockBack }),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/app/[locale]/assets/configuration/master-data/ownership-type/actions", () => ({
  createOwnershipTypeAction: vi.fn(),
  updateOwnershipTypeAction: vi.fn(),
}));

vi.mock("@/components/modules/assets/configuration/master-data/ownership-type-master/FormFieldsSection", () => ({
  FormFieldsSection: ({ formData, onChange, nameRef }: any) => (
    <div data-testid="form-fields">
      <input ref={nameRef} data-testid="name-input" name="ownershipTypeName" value={formData.ownershipTypeName || ""} onChange={onChange} />
      <input data-testid="description-input" name="description" value={formData.description || ""} onChange={onChange} />
    </div>
  ),
}));

vi.mock("@/components/modules/assets/configuration/master-data/ownership-type-master/StatusToggleCard", () => ({
  StatusToggleCard: ({ statusToggleRef }: any) => <button ref={statusToggleRef} data-testid="status-toggle-button">Status Toggle</button>,
}));
vi.mock("@/components/modules/assets/configuration/master-data/ownership-type-master/MandatoryFieldsNotice", () => ({
  MandatoryFieldsNotice: () => <div data-testid="mandatory-fields-notice" />,
}));

vi.mock("@/components/common", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/common")>();
  const ReactModule = await import("react");
  const ToggleSwitchComp = ReactModule.forwardRef(({ onChange }: any, ref: any) => (
    <button ref={ref} data-testid="status-toggle-button" type="button" onClick={onChange}>Toggle</button>
  ));
  ToggleSwitchComp.displayName = "ToggleSwitchComp";
  return {
    ...actual,
    SaveButton: ({ onClick, type, label }: any) => <button data-testid="save-button" onClick={onClick} type={type}>{label}</button>,
    CancelButton: ({ onClick }: any) => <button data-testid="cancel-button" onClick={onClick}>Cancel</button>,
    ToggleSwitch: ToggleSwitchComp,
  };
});

vi.mock("@/components/common/Drawer", () => ({
  Drawer: ({ open, children, footer }: any) => open ? (<div data-testid="drawer"><div data-testid="drawer-content">{children}</div><div data-testid="drawer-footer">{footer}</div></div>) : null,
}));

describe("OwnershipTypeForm", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  const t = (key: string) => key;
  const validOwnershipType = {
    ownershipTypeName: "Private Ownership",
    description: "Private ownership",
    isActive: true,
  };

  it("submits valid form successfully", async () => {
    vi.mocked(actions.createOwnershipTypeAction).mockResolvedValue({ success: true, data: {} } as any);
    render(<OwnershipTypeForm initialData={null} />);

    fireEvent.change(screen.getByTestId("name-input"), { target: { name: "ownershipTypeName", value: "Private" } });
    fireEvent.change(screen.getByTestId("description-input"), { target: { name: "description", value: "Private Ownership" } });

    fireEvent.submit(screen.getByTestId("drawer-content").querySelector("form")!);

    await waitFor(() => {
      expect(actions.createOwnershipTypeAction).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith("messages.createSuccess");
    });
  });

  it("validates required fields", async () => {
    render(<OwnershipTypeForm initialData={null} />);

    // Submit without filling fields
    fireEvent.submit(screen.getByTestId("drawer-content").querySelector("form")!);

    await waitFor(() => {
      expect(actions.createOwnershipTypeAction).not.toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith("errors.validationError");
    });
  });

  it("validates ownership type name constraints", () => {
    const numericErrors = validateOwnershipTypeForm({ ...validOwnershipType, ownershipTypeName: "Private 1" }, t);
    const specialCharErrors = validateOwnershipTypeForm({ ...validOwnershipType, ownershipTypeName: "Private-Type" }, t);
    const maxLengthErrors = validateOwnershipTypeForm({ ...validOwnershipType, ownershipTypeName: "A".repeat(50) }, t);
    const tooLongErrors = validateOwnershipTypeForm({ ...validOwnershipType, ownershipTypeName: "A".repeat(51) }, t);

    expect(numericErrors.ownershipTypeName).toBe("configuration.masterData.form.errors.nameInvalid");
    expect(specialCharErrors.ownershipTypeName).toBe("configuration.masterData.form.errors.nameInvalid");
    expect(maxLengthErrors.ownershipTypeName).toBeUndefined();
    expect(tooLongErrors.ownershipTypeName).toBe("configuration.masterData.form.errors.nameTooLong50");
  });

  it("validates description max length", () => {
    const maxLengthErrors = validateOwnershipTypeForm({ ...validOwnershipType, description: "A".repeat(100) }, t);
    const tooLongErrors = validateOwnershipTypeForm({ ...validOwnershipType, description: "A".repeat(101) }, t);

    expect(maxLengthErrors.description).toBeUndefined();
    expect(tooLongErrors.description).toBe("configuration.masterData.form.errors.descriptionTooLong");
  });

  it("auto-focuses name input in add mode and status toggle in edit mode after 150ms delay", () => {
    vi.useFakeTimers();

    const { unmount } = render(<OwnershipTypeForm initialData={null} />);
    vi.advanceTimersByTime(150);
    expect(screen.getByTestId("name-input")).toHaveFocus();
    unmount();

    const initialData = { id: 1, ownershipTypeName: "Private", description: "Desc", isActive: true };
    render(<OwnershipTypeForm id={1} initialData={initialData as any} />);
    vi.advanceTimersByTime(150);
    expect(screen.getByTestId("status-toggle-button")).toHaveFocus();

    vi.useRealTimers();
  });
});
