/* eslint-disable @typescript-eslint/no-explicit-any */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import InventoryModelForm from "@/components/modules/assets/configuration/master-data/inventory-model-master/InventoryModelForm";
import * as actions from "@/app/[locale]/assets/configuration/master-data/inventory-model/actions";

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

const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
vi.mock("sonner", () => ({
  toast: { success: (msg: string) => mockToastSuccess(msg), error: (msg: string) => mockToastError(msg) },
}));

vi.mock("@/app/[locale]/assets/configuration/master-data/inventory-model/actions", () => ({
  saveInventoryModelAction: vi.fn(),
}));

vi.mock("@/components/modules/assets/configuration/master-data/inventory-model-master/FormFieldsSection", () => ({
  FormFieldsSection: ({ formData, onChange }: any) => (
    <div data-testid="form-fields">
      <input data-testid="group-input" name="group" value={formData.group} onChange={onChange} />
      <input data-testid="name-input" name="name" value={formData.name} onChange={onChange} />
      <input data-testid="display-order-input" name="displayOrder" value={formData.displayOrder ?? ""} onChange={onChange} />
    </div>
  ),
}));

vi.mock("@/components/common", () => ({
  SaveButton: ({ onClick, type, label }: any) => <button data-testid="save-button" onClick={onClick} type={type}>{label}</button>,
  CancelButton: ({ onClick }: any) => <button data-testid="cancel-button" onClick={onClick}>Cancel</button>,
  StatusToggleCard: () => <div data-testid="status-toggle-card" />,
  RequiredFieldsNote: () => <div data-testid="mandatory-fields-notice" />,
}));

vi.mock("@/components/common/Drawer", () => ({
  Drawer: ({ open, children, footer }: any) => open ? (<div data-testid="drawer"><div data-testid="drawer-content">{children}</div><div data-testid="drawer-footer">{footer}</div></div>) : null,
}));

describe("InventoryModelForm", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  const mockGroups: any = [{ id: "G1", name: "Group 1", status: "Active" }];

  it("submits valid form without code field", async () => {
    vi.mocked(actions.saveInventoryModelAction).mockResolvedValue({ ok: true, mode: "create" });
    render(<InventoryModelForm groups={mockGroups} initialData={null} />);

    // Inventory Model doesn't have a code field!
    fireEvent.change(screen.getByTestId("group-input"), { target: { name: "group", value: "1" } });
    fireEvent.change(screen.getByTestId("name-input"), { target: { name: "name", value: "Type Name" } });
    fireEvent.change(screen.getByTestId("display-order-input"), { target: { name: "displayOrder", value: "1" } });

    fireEvent.submit(screen.getByTestId("drawer-content").querySelector("form")!);

    await waitFor(() => {
      expect(actions.saveInventoryModelAction).toHaveBeenCalled();
      expect(mockToastSuccess).toHaveBeenCalledWith("messages.createSuccess");
    });
  });
});

