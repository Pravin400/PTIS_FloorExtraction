import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { FormFieldsSection } from "@/components/modules/property-tax/property-type-master/components/FormFieldsSection";
import type { PropertyTypeFormModel } from "@/types/property-type.types";
import type { PropertyTypeCategory } from "@/types/property-type-category.types";

describe("FormFieldsSection", () => {
  const mockFormData: PropertyTypeFormModel = {
    id: 0,
    propertyDescription: "",
    type: "",
    propertyTypeGroup: "",
    propertyTypeCategoryId: 0,
    searchSequence: 0,
    isActive: true,
  };

  const mockCategories = [
    { id: 1, propertyTypeCategory: "Category 1", isActive: true },
    { id: 2, propertyTypeCategory: "Category 2", isActive: true },
  ] as PropertyTypeCategory[];

  const defaultProps = {
    formData: mockFormData,
    searchSequenceValue: "0",
    handleChange: vi.fn(),
    handleBlur: vi.fn(),
    handleCategoryChange: vi.fn(),
    handleTypeChange: vi.fn(),
    errors: {},
    showError: vi.fn().mockReturnValue(false),
    categories: mockCategories,
    t: (key: string) => key,
  };

  it("renders all form fields correctly", () => {
    render(<FormFieldsSection {...defaultProps} />);

    expect(screen.getByText("form.fields.descriptionEnglish.label")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("form.fields.descriptionEnglish.placeholder")).toBeInTheDocument();

    expect(screen.getByText("form.fields.propertyDescription.label")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("form.fields.propertyDescription.placeholder")).toBeInTheDocument();

    expect(screen.getByRole("combobox", { name: /form\.fields\.type\.label/i })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /form\.fields\.category\.label/i })).toBeInTheDocument();

    expect(screen.queryByText("form.fields.propertyTypeGroup.label")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("form.fields.propertyTypeGroup.placeholder")).not.toBeInTheDocument();

    expect(screen.getByLabelText("form.fields.searchSequence.label")).toBeInTheDocument();
  });

  it("calls handleChange when input values change", () => {
    render(<FormFieldsSection {...defaultProps} />);

    const descInput = screen.getByPlaceholderText("form.fields.propertyDescription.placeholder");
    fireEvent.change(descInput, { target: { value: "New Description" } });
    expect(defaultProps.handleChange).toHaveBeenCalled();
  });

  it("calls handleBlur when inputs lose focus", () => {
    render(<FormFieldsSection {...defaultProps} />);

    const descInput = screen.getByPlaceholderText("form.fields.propertyDescription.placeholder");
    fireEvent.blur(descInput);
    expect(defaultProps.handleBlur).toHaveBeenCalled();
  });

  it("calls handleTypeChange when a type is selected", () => {
    render(<FormFieldsSection {...defaultProps} />);

    const typeSelect = screen.getByRole("combobox", { name: "form.fields.type.label" });
    fireEvent.click(typeSelect);
    
    // Select the "R" option
    const option = screen.getByText("R");
    fireEvent.click(option);

    expect(defaultProps.handleTypeChange).toHaveBeenCalledWith("R");
  });

  it("calls handleCategoryChange when a category is selected", () => {
    render(<FormFieldsSection {...defaultProps} />);

    const categorySelect = screen.getByRole("combobox", { name: "form.fields.category.label" });
    fireEvent.click(categorySelect);
    
    // Select the "Category 1" option
    const option = screen.getByText("Category 1");
    fireEvent.click(option);

    expect(defaultProps.handleCategoryChange).toHaveBeenCalledWith("1");
  });

  it("displays validation error messages when showError is true", () => {
    const errorProps = {
      ...defaultProps,
      errors: {
        propertyDescription: "Description is required",
      },
      showError: (field: keyof PropertyTypeFormModel) => field === "propertyDescription",
    };

    render(<FormFieldsSection {...errorProps} />);

    expect(screen.getByText("Description is required")).toBeInTheDocument();
  });
});
