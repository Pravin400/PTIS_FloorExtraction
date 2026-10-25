/* eslint-disable @typescript-eslint/no-explicit-any */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import InventoryCategoryForm from "@/components/modules/assets/configuration/master-data/inventory-category-master/InventoryCategoryForm";
import * as actions from "@/app/[locale]/assets/configuration/master-data/inventory-category/actions";

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

vi.mock("@/app/[locale]/assets/configuration/master-data/inventory-category/actions", () => ({
  saveInventoryCategoryAction: vi.fn(),
}));

vi.mock("@/components/modules/assets/configuration/master-data/inventory-category-master/FormFieldsSection", () => ({
  FormFieldsSection: ({ formData, onChange }: any) => (
    <div data-testid="form-fields">
      <input data-testid="code-input" name="code" value={formData.code} onChange={onChange} />
      <input data-testid="group-input" name="group" value={formData.group} onChange={onChange} />
      <input data-testid="name-input" name="name" value={formData.name} onChange={onChange} />
      <input data-testid="rate-input" name="depreciationRate" value={formData.depreciationRate} onChange={onChange} />
      <input data-testid="order-input" name="displayOrder" value={formData.displayOrder} onChange={onChange} />
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

describe("InventoryCategoryForm", () => {
  beforeEach(() => { vi.clearAllMocks(); });



  it("fails validation if depreciationRate is missing", async () => {
    render(<InventoryCategoryForm initialData={null} />);
    fireEvent.change(screen.getByTestId("group-input"), { target: { name: "group", value: "G1" } });
    fireEvent.change(screen.getByTestId("code-input"), { target: { name: "code", value: "TYPE1" } });
    fireEvent.change(screen.getByTestId("name-input"), { target: { name: "name", value: "Type Name" } });
    fireEvent.change(screen.getByTestId("order-input"), { target: { name: "displayOrder", value: "1" } });

    fireEvent.submit(screen.getByTestId("drawer-content").querySelector("form")!);

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("validation.fixErrors");
      expect(actions.saveInventoryCategoryAction).not.toHaveBeenCalled();
    });
  });

  it("submits valid form", async () => {
    vi.mocked(actions.saveInventoryCategoryAction).mockResolvedValue({ ok: true, mode: "create" });
    render(<InventoryCategoryForm initialData={null} />);

    fireEvent.change(screen.getByTestId("group-input"), { target: { name: "group", value: "G1" } });
    fireEvent.change(screen.getByTestId("code-input"), { target: { name: "code", value: "TYPE1" } });
    fireEvent.change(screen.getByTestId("name-input"), { target: { name: "name", value: "Type Name" } });
    fireEvent.change(screen.getByTestId("rate-input"), { target: { name: "depreciationRate", value: "0.15" } });
    fireEvent.change(screen.getByTestId("order-input"), { target: { name: "displayOrder", value: "1" } });

    fireEvent.submit(screen.getByTestId("drawer-content").querySelector("form")!);

    await waitFor(() => {
      expect(actions.saveInventoryCategoryAction).toHaveBeenCalled();
      expect(mockToastSuccess).toHaveBeenCalledWith("messages.createSuccess");
    });
  });
});

