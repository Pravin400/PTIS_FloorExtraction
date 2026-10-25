/* eslint-disable @typescript-eslint/no-explicit-any */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import AssetTypeForm from "@/components/modules/assets/configuration/master-data/asset-type-master/AssetTypeForm";
import * as actions from "@/app/[locale]/assets/configuration/master-data/asset-type/actions";

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

vi.mock("@/app/[locale]/assets/configuration/master-data/asset-type/actions", () => ({
  saveAssetTypeAction: vi.fn(),
}));

vi.mock("@/components/modules/assets/configuration/master-data/asset-type-master/FormFieldsSection", () => ({
  FormFieldsSection: ({ formData, onChange, onRadioChange }: any) => (
    <div data-testid="form-fields">
      <input data-testid="code-input" name="code" value={formData.code} onChange={onChange} />
      <input data-testid="group-input" name="group" value={formData.group} onChange={onChange} />
      <input data-testid="name-input" name="name" value={formData.name} onChange={onChange} />
      <input data-testid="unit-radio" name="registrationType" type="radio" onChange={() => onRadioChange("unit")} checked={formData.allowUnitRegistration} />
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

describe("AssetTypeForm", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  const mockGroups: any = [{ id: "G1", name: "Group 1", status: "Active" }];

  it("renders empty form in Add Mode", () => {
    render(<AssetTypeForm groups={mockGroups} initialData={null} />);
    expect(screen.getByTestId("drawer")).toBeInTheDocument();
    expect(screen.queryByTestId("status-toggle-card")).not.toBeInTheDocument();
  });

  it("fails validation for missing group and code", async () => {
    render(<AssetTypeForm groups={mockGroups} initialData={null} />);
    fireEvent.submit(screen.getByTestId("drawer-content").querySelector("form")!);
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("validation.fixErrors");
      expect(actions.saveAssetTypeAction).not.toHaveBeenCalled();
    });
  });

  it("submits valid form", async () => {
    vi.mocked(actions.saveAssetTypeAction).mockResolvedValue({ ok: true, mode: "create" });
    render(<AssetTypeForm groups={mockGroups} initialData={null} />);

    fireEvent.change(screen.getByTestId("group-input"), { target: { name: "group", value: "1" } });
    fireEvent.change(screen.getByTestId("code-input"), { target: { name: "code", value: "TYPE1" } });
    fireEvent.change(screen.getByTestId("name-input"), { target: { name: "name", value: "Type Name" } });
    fireEvent.click(screen.getByTestId("unit-radio"));

    fireEvent.submit(screen.getByTestId("drawer-content").querySelector("form")!);

    await waitFor(() => {
      expect(actions.saveAssetTypeAction).toHaveBeenCalled();
      expect(mockToastSuccess).toHaveBeenCalledWith("messages.createSuccess");
    });
  });
});

