/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AssetDocumentDefinitionForm } from "@/components/modules/assets/configuration/master-data/asset-document-definition-master/AssetDocumentDefinitionForm";

const mockHandleSubmit = vi.fn((e) => e?.preventDefault?.());
const mockHandleCancel = vi.fn();
const mockHandleToggleStatus = vi.fn();

vi.mock("@/hooks/asset-masters/asset-document-definition/useAssetDocumentDefinitionForm", () => ({
  useAssetDocumentDefinitionForm: (props: any) => ({
    isEdit: Boolean(props.id),
    t: (key: string) => key,
    tCommon: (key: string) => key,
    open: true,
    isSubmitting: false,
    isActive: true,
    formData: {
      documentCode: "DOC01",
      documentName: "Title Deed",
      description: "Property deed",
      isRequired: true,
      displayOrder: 1,
      isActive: true,
    },
    displayOrderValue: "1",
    errors: {},
    documentCodeRef: { current: null },
    statusToggleRef: { current: null },
    categoryOptions: [{ label: "Land", value: "10" }],
    typeOptions: [{ label: "Open Plot", value: "20" }],
    showError: () => false,
    handleChange: vi.fn(),
    handleBlur: vi.fn(),
    handleCancel: mockHandleCancel,
    handleSubmit: mockHandleSubmit,
    handleToggleStatus: mockHandleToggleStatus,
    handleToggleRequired: vi.fn(),
    handleSelectChange: vi.fn(),
  }),
}));

vi.mock("@/components/common/Drawer", () => ({
  Drawer: ({ open, children, footer, title }: any) =>
    open ? (
      <div data-testid="drawer">
        <div data-testid="drawer-title">{title}</div>
        <div data-testid="drawer-content">{children}</div>
        <div data-testid="drawer-footer">{footer}</div>
      </div>
    ) : null,
}));

vi.mock("@/components/common", () => ({
  CancelButton: ({ onClick, label }: any) => (
    <button data-testid="cancel-button" onClick={onClick}>{label}</button>
  ),
  SaveButton: ({ onClick, label, type }: any) => (
    <button data-testid="save-button" onClick={onClick} type={type}>{label}</button>
  ),
  ToggleSwitch: ({ checked, onChange }: any) => (
    <input type="checkbox" data-testid="status-toggle" checked={checked} onChange={(e) => onChange(e.target.checked)} />
  ),
  ValidationMessage: ({ message }: any) => <div data-testid="validation-message">{message}</div>,
}));

vi.mock("@/components/modules/assets/configuration/master-data/asset-document-definition-master/AssetDocumentDefinitionFormFields", () => ({
  AssetDocumentDefinitionFormFields: () => <div data-testid="form-fields-section" />,
}));

describe("AssetDocumentDefinitionForm Component", () => {
  const defaultProps = {
    id: null,
    categories: [{ id: 10, name: "Land" }],
    types: [{ id: 20, name: "Open Plot" }],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders Add Form inside Drawer", () => {
    render(<AssetDocumentDefinitionForm {...defaultProps} />);

    expect(screen.getByTestId("drawer")).toBeInTheDocument();
    expect(screen.getByTestId("form-fields-section")).toBeInTheDocument();
    expect(screen.getByTestId("cancel-button")).toBeInTheDocument();
    expect(screen.getByTestId("save-button")).toBeInTheDocument();
  });

  it("handles cancel button click", () => {
    render(<AssetDocumentDefinitionForm {...defaultProps} />);

    fireEvent.click(screen.getByTestId("cancel-button"));
    expect(mockHandleCancel).toHaveBeenCalled();
  });

  it("triggers handleSubmit when form is submitted", () => {
    render(<AssetDocumentDefinitionForm {...defaultProps} />);

    const form = screen.getByTestId("drawer-content").querySelector("form");
    fireEvent.submit(form!);

    expect(mockHandleSubmit).toHaveBeenCalled();
  });

  it("renders status toggle card in Edit mode", () => {
    render(<AssetDocumentDefinitionForm {...defaultProps} id={1} />);

    expect(screen.getByTestId("status-toggle")).toBeInTheDocument();
  });
});
