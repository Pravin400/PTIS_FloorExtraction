import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { FormFieldsSection } from "@/components/modules/assets/configuration/master-data/asset-category-master/FormFieldsSection";
import {
  CODE_MAX,
  NAME_MAX,
  DESCRIPTION_MAX,
  VALUATION_TYPE_MAX,
  sanitizeFieldValue,
} from "@/hooks/asset-masters/asset-category/validation";
import type { AssetCategoryFormModel } from "@/types/asset-masters/asset-category.types";

describe("FormFieldsSection - Input Length Restrictions", () => {
  const defaultFormData: AssetCategoryFormModel = {
    id: undefined,
    code: "",
    name: "",
    description: "",
    isMovable: false,
    hasFloorDetails: false,
    hasInventory: false,
    isInventoryMandatory: false,
    hasLegalCompliance: false,
    valuationType: "",
    isActive: true,
  };

  const defaultProps = {
    formData: defaultFormData,
    errors: {},
    showError: vi.fn().mockReturnValue(false),
    onChange: vi.fn(),
    onBlur: vi.fn(),
    onCheckboxChange: vi.fn(),
    t: (key: string) => key,
    isPending: false,
  };

  it("enforces maxLength=" + VALUATION_TYPE_MAX + " on valuationType input element", () => {
    render(<FormFieldsSection {...defaultProps} />);

    const valuationInput = screen.getByPlaceholderText("placeholders.valuationType") as HTMLInputElement;
    expect(valuationInput).toBeInTheDocument();
    expect(valuationInput.maxLength).toBe(VALUATION_TYPE_MAX);
  });

  it("enforces correct maxLength on all text fields", () => {
    render(<FormFieldsSection {...defaultProps} />);

    const codeInput = screen.getByPlaceholderText("placeholders.code") as HTMLInputElement;
    expect(codeInput.maxLength).toBe(CODE_MAX);

    const nameInput = screen.getByPlaceholderText("placeholders.name") as HTMLInputElement;
    expect(nameInput.maxLength).toBe(NAME_MAX);

    const descInput = screen.getByPlaceholderText("placeholders.description") as HTMLTextAreaElement;
    expect(descInput.maxLength).toBe(DESCRIPTION_MAX);
  });

  it("sanitizes and truncates valuationType exceeding " + VALUATION_TYPE_MAX + " characters (e.g. 50 R's)", () => {
    const longInput = "RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR"; // 50 chars
    expect(longInput.length).toBe(50);

    const sanitized = sanitizeFieldValue("valuationType", longInput);
    expect(sanitized.length).toBe(VALUATION_TYPE_MAX);
    expect(sanitized).toBe("RRRRRRRRRRRRRRRRRRRR"); // strictly 20 chars
  });
});
