/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AssetDocumentDefinitionFormFields } from "@/components/modules/assets/configuration/master-data/asset-document-definition-master/AssetDocumentDefinitionFormFields";

vi.mock("@/components/common", () => ({
  Input: ({ name, value, onChange, onBlur, label }: any) => (
    <div>
      <label>{label}</label>
      <input data-testid={`input-${name}`} name={name} value={value || ""} onChange={onChange} onBlur={onBlur} />
    </div>
  ),
  TextArea: ({ name, value, onChange, onBlur, label }: any) => (
    <div>
      <label>{label}</label>
      <textarea data-testid={`textarea-${name}`} name={name} value={value || ""} onChange={onChange} onBlur={onBlur} />
    </div>
  ),
  ValidationMessage: ({ message, visible }: any) =>
    visible ? <div data-testid="validation-error">{message}</div> : null,
  SearchSelect: ({ name, onChange, options, value }: any) => (
    <select data-testid={`select-${name}`} value={value || ""} onChange={(e) => onChange(name, e.target.value)}>
      {options?.map((opt: any) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  ),
  ToggleSwitch: ({ checked, onChange }: any) => (
    <input type="checkbox" data-testid="toggle-required" checked={checked} onChange={(e) => onChange(e.target.checked)} />
  ),
}));

describe("AssetDocumentDefinitionFormFields Component", () => {
  const mockHandleChange = vi.fn();
  const mockHandleBlur = vi.fn();
  const mockHandleSelectChange = vi.fn();
  const mockHandleToggleRequired = vi.fn();

  const defaultProps = {
    documentCodeRef: { current: null },
    formData: {
      documentCode: "DOC01",
      documentName: "Title Deed",
      description: "Property deed",
      isRequired: true,
      displayOrder: 1,
      assetCategoryId: 10,
      assetTypeId: 20,
      isActive: true,
    },
    displayOrderValue: "1",
    errors: {},
    showError: () => false,
    handleChange: mockHandleChange,
    handleBlur: mockHandleBlur,
    handleSelectChange: mockHandleSelectChange,
    handleToggleRequired: mockHandleToggleRequired,
    categoryOptions: [{ label: "Land", value: "10" }],
    typeOptions: [{ label: "Open Plot", value: "20" }],
    t: (key: string) => key,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all form fields correctly", () => {
    render(<AssetDocumentDefinitionFormFields {...defaultProps} />);

    expect(screen.getByTestId("input-documentCode")).toBeInTheDocument();
    expect(screen.getByTestId("input-documentName")).toBeInTheDocument();
    expect(screen.getByTestId("textarea-description")).toBeInTheDocument();
    expect(screen.getByTestId("input-displayOrder")).toBeInTheDocument();
    expect(screen.getByTestId("toggle-required")).toBeInTheDocument();
  });

  it("triggers handleChange on documentName input", () => {
    render(<AssetDocumentDefinitionFormFields {...defaultProps} />);

    fireEvent.change(screen.getByTestId("input-documentName"), { target: { name: "documentName", value: "New Deed" } });
    expect(mockHandleChange).toHaveBeenCalled();
  });

  it("triggers handleToggleRequired on switch click", () => {
    render(<AssetDocumentDefinitionFormFields {...defaultProps} />);

    fireEvent.click(screen.getByTestId("toggle-required"));
    expect(mockHandleToggleRequired).toHaveBeenCalled();
  });
});
