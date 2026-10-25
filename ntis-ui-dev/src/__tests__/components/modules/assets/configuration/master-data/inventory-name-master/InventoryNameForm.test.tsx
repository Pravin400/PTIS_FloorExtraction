/* eslint-disable @typescript-eslint/no-explicit-any */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { toast } from "sonner";
import { InventoryNameForm } from "@/components/modules/assets/configuration/master-data/inventory-name-master/InventoryNameForm";
import * as actions from "@/app/[locale]/assets/configuration/master-data/inventory-name/actions";

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

vi.mock("@/app/[locale]/assets/configuration/master-data/inventory-name/actions", () => ({
  createInventoryNameAction: vi.fn(),
  updateInventoryNameAction: vi.fn(),
}));

vi.mock("@/components/modules/assets/configuration/master-data/inventory-name-master/FormFieldsSection", () => ({
  FormFieldsSection: ({ formData, onChange, onSelectChange }: any) => (
    <div data-testid="form-fields">
      <input data-testid="category-input" name="inventoryItemCategoryId" value={formData.inventoryItemCategoryId || ""} onChange={(e) => onSelectChange("inventoryItemCategoryId", e.target.value)} />
      <input data-testid="code-input" name="subTypeCode" value={formData.subTypeCode || ""} onChange={onChange} />
      <input data-testid="name-input" name="subTypeName" value={formData.subTypeName || ""} onChange={onChange} />
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

describe("InventoryNameForm", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  const mockCategories: any = [{ id: 1, categoryName: "Category 1" }];

  it("submits valid form successfully", async () => {
    vi.mocked(actions.createInventoryNameAction).mockResolvedValue({ success: true, data: {} } as any);
    render(<InventoryNameForm categories={mockCategories} initialData={null} />);

    fireEvent.change(screen.getByTestId("category-input"), { target: { value: "1" } });
    fireEvent.change(screen.getByTestId("code-input"), { target: { name: "subTypeCode", value: "C001" } });
    fireEvent.change(screen.getByTestId("name-input"), { target: { name: "subTypeName", value: "Name" } });
    fireEvent.change(screen.getByTestId("display-order-input"), { target: { name: "displayOrder", value: "1" } });

    fireEvent.submit(screen.getByTestId("drawer-content").querySelector("form")!);

    await waitFor(() => {
      expect(actions.createInventoryNameAction).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith("messages.createSuccess");
    });
  });

  it("validates required fields", async () => {
    render(<InventoryNameForm categories={mockCategories} initialData={null} />);

    // Submit without filling fields
    fireEvent.submit(screen.getByTestId("drawer-content").querySelector("form")!);

    await waitFor(() => {
      expect(actions.createInventoryNameAction).not.toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith("errors.validationError");
    });
  });
});
