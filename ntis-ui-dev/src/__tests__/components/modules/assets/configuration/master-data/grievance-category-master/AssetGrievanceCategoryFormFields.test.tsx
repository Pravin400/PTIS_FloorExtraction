import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { AssetGrievanceCategoryFormFields } from "@/components/modules/assets/configuration/master-data/grievance-category-master/AssetGrievanceCategoryFormFields";

describe("AssetGrievanceCategoryFormFields", () => {
  const t = (key: string) => {
    const labels: Record<string, string> = {
      "form.fields.typeCode": "Grievance Type Code",
      "form.fields.typeCodePlaceholder": "Enter type code",
      "form.fields.name": "Category Name",
      "form.fields.namePlaceholder": "Enter name",
      "form.fields.nameLocal": "Local Name",
      "form.fields.nameLocalPlaceholder": "Enter local name",
      "form.fields.codeFormat": "Code Format",
      "form.fields.codeFormatPlaceholder": "Enter code format",
      "form.fields.sla": "SLA Days",
      "form.fields.slaPlaceholder": "Enter SLA",
      "form.fields.displaySequence": "Display Sequence",
      "form.fields.displaySequencePlaceholder": "Enter display sequence",
      "form.fields.targetTableName": "Target Table",
      "form.fields.targetTableNamePlaceholder": "Enter target table",
      "form.fields.requiresFieldCorrection": "Requires Field Correction",
      "form.fields.requiresFieldCorrectionDesc": "Check if correction required",
      "form.fields.description": "Description",
      "form.fields.descPlaceholder": "Enter description",
    };
    return labels[key] ?? key;
  };

  const tCommon = (key: string) => key;

  const defaultProps = {
    firstInputRef: React.createRef<HTMLInputElement>(),
    formData: {
      grievanceTypeCode: "",
      grievanceTypeName: "",
      grievanceTypeNameLocal: "",
      codeFormat: "",
      slaDays: null,
      displaySequence: 0,
      targetTableName: "",
      description: "",
      isActive: true,
    },
    slaValue: "",
    displaySequenceValue: "0",
    errors: {},
    showError: () => false,
    handleChange: vi.fn(),
    handleBlur: vi.fn(),
    handleToggleFieldCorrection: vi.fn(),
    t,
    tCommon,
  };

  it("renders labels and placeholders correctly", () => {
    render(<AssetGrievanceCategoryFormFields {...defaultProps} />);
    expect(screen.getByPlaceholderText("Enter type code")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter code format")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter SLA")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter display sequence")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter description")).toBeInTheDocument();
  });

  it("renders validation messages when showError resolves to true", () => {
    render(
      <AssetGrievanceCategoryFormFields
        {...defaultProps}
        errors={{ grievanceTypeCode: "Type Code is required" }}
        showError={(field) => field === "grievanceTypeCode"}
      />
    );
    expect(screen.getByText("Type Code is required")).toBeInTheDocument();
  });

  it("calls handleChange on input edit", () => {
    render(<AssetGrievanceCategoryFormFields {...defaultProps} />);
    const input = screen.getByPlaceholderText("Enter type code");
    fireEvent.change(input, { target: { value: "GRV_CODE" } });
    expect(defaultProps.handleChange).toHaveBeenCalled();
  });


});
