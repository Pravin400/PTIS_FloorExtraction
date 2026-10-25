/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AssetFieldDefinitionForm } from "@/components/modules/assets/configuration/master-data/asset-field-definition-master/AssetFieldDefinitionForm";

const mockHandleSubmit = vi.fn((e) => e?.preventDefault?.());
const mockHandleCancel = vi.fn();
const mockHandleToggleStatus = vi.fn();

vi.mock("@/hooks/asset-masters/asset-field-definition/useAssetFieldDefinitionForm", () => ({
  useAssetFieldDefinitionForm: (props: any) => ({
    isEdit: Boolean(props.id),
    t: (key: string) => key,
    tCommon: (key: string) => key,
    open: true,
    isSubmitting: false,
    isActive: true,
    formData: {
      fieldCode: "FLD01",
      fieldName: "Total Area",
      fieldLabel: "Total Area Label",
      fieldType: "text",
      fieldGroup: "General Specs",
      isRequired: false,
      displayOrder: 1,
      isActive: true,
    },
    displayOrderValue: "1",
    errors: {},
    fieldCodeRef: { current: null },
    statusToggleRef: { current: null },
    categoryOptions: [{ label: "Land", value: "10" }],
    typeOptions: [{ label: "Open Plot", value: "20" }],
    groupOptions: [{ label: "General Specs", value: "General Specs" }],
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

vi.mock("@/components/modules/assets/configuration/master-data/asset-field-definition-master/AssetFieldDefinitionFormFields", () => ({
  AssetFieldDefinitionFormFields: () => <div data-testid="form-fields-section" />,
}));

describe("AssetFieldDefinitionForm Component", () => {
  const defaultProps = {
    id: null,
    categories: [{ id: 10, name: "Land" }],
    types: [{ id: 20, name: "Open Plot" }],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders Add Form inside Drawer", () => {
    render(<AssetFieldDefinitionForm {...defaultProps} />);

    expect(screen.getByTestId("drawer")).toBeInTheDocument();
    expect(screen.getByTestId("form-fields-section")).toBeInTheDocument();
    expect(screen.getByTestId("cancel-button")).toBeInTheDocument();
    expect(screen.getByTestId("save-button")).toBeInTheDocument();
  });

  it("handles cancel button click", () => {
    render(<AssetFieldDefinitionForm {...defaultProps} />);

    fireEvent.click(screen.getByTestId("cancel-button"));
    expect(mockHandleCancel).toHaveBeenCalled();
  });

  it("triggers handleSubmit when form is submitted", () => {
    render(<AssetFieldDefinitionForm {...defaultProps} />);

    const form = screen.getByTestId("drawer-content").querySelector("form");
    fireEvent.submit(form!);

    expect(mockHandleSubmit).toHaveBeenCalled();
  });

  it("renders status toggle card in Edit mode", () => {
    render(<AssetFieldDefinitionForm {...defaultProps} id={1} />);

    expect(screen.getByTestId("status-toggle")).toBeInTheDocument();
  });
});
