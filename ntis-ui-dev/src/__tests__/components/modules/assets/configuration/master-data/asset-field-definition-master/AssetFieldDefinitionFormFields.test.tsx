/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AssetFieldDefinitionFormFields } from "@/components/modules/assets/configuration/master-data/asset-field-definition-master/AssetFieldDefinitionFormFields";

vi.mock("@/components/common", () => ({
  Input: ({ name, value, onChange, onBlur, label }: any) => (
    <div>
      <label>{label}</label>
      <input data-testid={`input-${name}`} name={name} value={value || ""} onChange={onChange} onBlur={onBlur} />
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
  TextArea: ({ name, value, onChange, onBlur, label }: any) => (
    <div>
      <label>{label}</label>
      <textarea data-testid={`textarea-${name}`} name={name} value={value || ""} onChange={onChange} onBlur={onBlur} />
    </div>
  ),
}));

describe("AssetFieldDefinitionFormFields Component", () => {
  const mockHandleChange = vi.fn();
  const mockHandleBlur = vi.fn();
  const mockHandleSelectChange = vi.fn();
  const mockHandleToggleRequired = vi.fn();

  const defaultProps = {
    fieldCodeRef: { current: null },
    formData: {
      fieldCode: "FLD01",
      fieldName: "Total Area",
      fieldLabel: "Total Area Label",
      fieldType: "text",
      fieldGroup: "General Specs",
      isRequired: false,
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
    groupOptions: [{ label: "General Specs", value: "General Specs" }],
    t: (key: string) => key,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all form fields correctly", () => {
    render(<AssetFieldDefinitionFormFields {...defaultProps} />);

    expect(screen.getByTestId("input-fieldCode")).toBeInTheDocument();
    expect(screen.getByTestId("input-fieldName")).toBeInTheDocument();
    expect(screen.getByTestId("input-fieldLabel")).toBeInTheDocument();
    expect(screen.getByTestId("input-fieldGroup")).toBeInTheDocument();
    expect(screen.getByTestId("input-displayOrder")).toBeInTheDocument();
    expect(screen.getByTestId("toggle-required")).toBeInTheDocument();
  });

  it("renders optionsJson textarea when fieldType is select, checkbox, or radio", () => {
    render(
      <AssetFieldDefinitionFormFields
        {...defaultProps}
        formData={{ ...defaultProps.formData, fieldType: "select", optionsJson: "Male, Female" }}
      />
    );

    expect(screen.getByTestId("textarea-optionsJson")).toBeInTheDocument();
  });

  it("triggers handleChange on fieldName input", () => {
    render(<AssetFieldDefinitionFormFields {...defaultProps} />);

    fireEvent.change(screen.getByTestId("input-fieldName"), { target: { name: "fieldName", value: "New Name" } });
    expect(mockHandleChange).toHaveBeenCalled();
  });

  it("triggers handleToggleRequired on switch click", () => {
    render(<AssetFieldDefinitionFormFields {...defaultProps} />);

    fireEvent.click(screen.getByTestId("toggle-required"));
    expect(mockHandleToggleRequired).toHaveBeenCalled();
  });
});
