import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { DesignationFormFields } from "@/components/modules/assets/configuration/master-data/designation-master/DesignationFormFields";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

describe("DesignationFormFields", () => {
  const t = (key: string) => {
    const labels: Record<string, string> = {
      "form.fields.designationCode.label": "Code",
      "form.fields.designationCode.placeholder": "Enter code",
      "form.fields.designationName.label": "Name",
      "form.fields.designationName.placeholder": "Enter name",
      "form.fields.designationLocal.label": "Local Name",
      "form.fields.designationLocal.placeholder": "Enter local name",
      "form.fields.designationDescription.label": "Description",
      "form.fields.designationDescription.placeholder": "Enter description",
      "form.fields.owningDepartmentId.label": "Department",
      "form.fields.owningDepartmentId.placeholder": "-- Select --",
    };
    return labels[key] ?? key;
  };

  const defaultProps = {
    designationCodeRef: React.createRef<HTMLInputElement>(),
    formData: {
      designationCode: "",
      designationName: "",
      designationLocal: "",
      designationDescription: "",
      owningDepartmentId: null,
      isActive: true,
    },
    errors: {},
    showError: () => false,
    handleChange: vi.fn(),
    handleBlur: vi.fn(),
    handleSelectChange: vi.fn(),
    departmentOptions: [
      { label: "Dept A", value: "1" },
      { label: "Dept B", value: "2" },
    ],
    t,
  };

  it("renders labels and placeholders correctly", () => {
    render(<DesignationFormFields {...defaultProps} />);
    expect(screen.getByPlaceholderText("Enter code")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter local name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter description")).toBeInTheDocument();
  });

  it("displays validation messages correctly", () => {
    render(
      <DesignationFormFields
        {...defaultProps}
        errors={{ designationCode: "Code is required" }}
        showError={(field) => field === "designationCode"}
      />
    );
    expect(screen.getByText("Code is required")).toBeInTheDocument();
  });
});
