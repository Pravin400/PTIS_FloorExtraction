/* eslint-disable @typescript-eslint/no-explicit-any */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import AssetCategoryForm from "@/components/modules/assets/configuration/master-data/asset-category-master/AssetCategoryForm";
import * as actions from "@/app/[locale]/assets/configuration/master-data/asset-category/actions";

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
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));

// Mock sonner toast
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    success: (msg: string) => mockToastSuccess(msg),
    error: (msg: string) => mockToastError(msg),
  },
}));

// Mock Server Action
vi.mock("@/app/[locale]/assets/configuration/master-data/asset-category/actions", () => ({
  saveAssetCategoryAction: vi.fn(),
}));

// Mock Child Components
vi.mock("@/components/modules/assets/configuration/master-data/asset-category-master/FormFieldsSection", () => ({
  FormFieldsSection: ({ formData, onChange }: any) => (
    <div data-testid="form-fields">
      <input
        data-testid="code-input"
        name="code"
        value={formData.code}
        onChange={onChange}
      />
      <input
        data-testid="name-input"
        name="name"
        value={formData.name}
        onChange={onChange}
      />
      <input
        data-testid="valuationType-input"
        name="valuationType"
        value={formData.valuationType}
        onChange={onChange}
      />
    </div>
  ),
}));

vi.mock("@/components/common", () => ({
  SaveButton: ({ onClick, type, label, disabled }: any) => (
    <button data-testid="save-button" onClick={onClick} type={type} disabled={disabled}>{label}</button>
  ),
  CancelButton: ({ onClick, label }: any) => (
    <button data-testid="cancel-button" onClick={onClick}>{label}</button>
  ),
  StatusToggleCard: () => <div data-testid="status-toggle-card" />,
  ToggleSwitch: (props: any) => <input type="checkbox" data-testid="status-toggle-card" checked={props.checked} onChange={(e) => props.onChange?.(e.target.checked)} />,
  RequiredFieldsNote: () => <div data-testid="mandatory-fields-notice" />,
}));

vi.mock("@/components/common/Drawer", () => ({
  Drawer: ({ open, children, footer }: any) => (
    open ? (
      <div data-testid="drawer">
        <div data-testid="drawer-content">{children}</div>
        <div data-testid="drawer-footer">{footer}</div>
      </div>
    ) : null
  ),
}));

describe("AssetCategoryForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockInitialData: any = {
    id: 1,
    code: "CAT01",
    name: "Test Category",
    description: "Desc",
    isMovable: true,
    hasFloorDetails: false,
    hasInventory: false,
    isInventoryMandatory: false,
    hasLegalCompliance: false,
    valuationType: "MOVABLE",
    isActive: true,
  };

  describe("Add Mode", () => {
    it("renders empty form fields inside Drawer", () => {
      render(<AssetCategoryForm initialData={null} />);

      expect(screen.getByTestId("drawer")).toBeInTheDocument();
      expect(screen.getByTestId("form-fields")).toBeInTheDocument();
      expect(screen.getByTestId("mandatory-fields-notice")).toBeInTheDocument();

      // Status Toggle should NOT be present in Add Mode
      expect(screen.queryByTestId("status-toggle-card")).not.toBeInTheDocument();
    });

    it("handles cancel button click", () => {
      render(<AssetCategoryForm initialData={null} />);
      const cancelButton = screen.getByTestId("cancel-button");
      fireEvent.click(cancelButton);
      expect(mockBack).toHaveBeenCalled();
    });

    it("displays validation error toast when submitting empty form", async () => {
      render(<AssetCategoryForm initialData={null} />);

      // Trigger submit on the form
      const form = screen.getByTestId("drawer-content").querySelector("form");
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith("validation.fixErrors");
      });

      // Server action should NOT be called if validation fails
      expect(actions.saveAssetCategoryAction).not.toHaveBeenCalled();
    });

    it("calls server action on valid submission", async () => {
      vi.mocked(actions.saveAssetCategoryAction).mockResolvedValue({ ok: true, mode: "create" });

      render(<AssetCategoryForm initialData={null} />);

      // Fill required fields
      fireEvent.change(screen.getByTestId("code-input"), { target: { name: "code", value: "VALIDCODE" } });
      fireEvent.change(screen.getByTestId("name-input"), { target: { name: "name", value: "Valid Name" } });
      fireEvent.change(screen.getByTestId("valuationType-input"), { target: { name: "valuationType", value: "FIXED_ASSET" } });

      const form = screen.getByTestId("drawer-content").querySelector("form");
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(actions.saveAssetCategoryAction).toHaveBeenCalled();
        expect(mockToastSuccess).toHaveBeenCalledWith("messages.createSuccess");
        expect(mockPush).toHaveBeenCalledWith("/en/assets/configuration/master-data/asset-category");
      });
    });
  });

  describe("Edit Mode", () => {
    it("renders initialized form fields and Status Toggle", () => {
      render(<AssetCategoryForm initialData={mockInitialData} />);

      expect(screen.getByTestId("drawer")).toBeInTheDocument();
      expect(screen.getByTestId("form-fields")).toBeInTheDocument();
      expect(screen.getByTestId("status-toggle-card")).toBeInTheDocument(); // Present in Edit Mode

      const codeInput = screen.getByTestId("code-input") as HTMLInputElement;
      expect(codeInput.value).toBe("CAT01");
    });

    it("calls server action properly in edit mode", async () => {
      vi.mocked(actions.saveAssetCategoryAction).mockResolvedValue({ ok: true, mode: "update" });

      render(<AssetCategoryForm initialData={mockInitialData} />);

      const form = screen.getByTestId("drawer-content").querySelector("form");
      fireEvent.submit(form!);

      await waitFor(() => {
        // First arg is ID (stringified)
        expect(actions.saveAssetCategoryAction).toHaveBeenCalledWith("1", expect.any(FormData));
        expect(mockToastSuccess).toHaveBeenCalledWith("messages.updateSuccess");
      });
    });

    it("handles server action validation failure", async () => {
      vi.mocked(actions.saveAssetCategoryAction).mockResolvedValue({ ok: false, error: "duplicate" });

      render(<AssetCategoryForm initialData={mockInitialData} />);

      const form = screen.getByTestId("drawer-content").querySelector("form");
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith(expect.stringMatching(/validation\.duplicate/));
      });
    });
  });
});

