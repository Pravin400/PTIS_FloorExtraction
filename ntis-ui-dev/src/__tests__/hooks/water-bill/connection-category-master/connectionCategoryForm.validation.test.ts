import { describe, it, expect } from "vitest";
import { validateConnectionCategoryForm } from "@/lib/validations/water-bill/connectionCategoryForm.validation";
import { METERED_BILLING_METHODS, NON_METERED_BILLING_METHODS } from "@/types/waterBill/connectionCategoryMaster.types";
import type { ConnectionCategoryFormModel } from "@/types/waterBill/connectionCategoryMaster.types";

const mockT = (key: string) => key;

describe("validateConnectionCategoryForm", () => {
  const validMeteredData: ConnectionCategoryFormModel = {
    connectionCategoryCode: "REG",
    connectionCategory: "Regular Metered",
    billingFrequencyId: 1,
    isMetered: true,
    billingMethod: "Metered",
    description: "Valid description",
    isActive: true,
  };

  it("returns no errors for valid data", () => {
    const errors = validateConnectionCategoryForm(validMeteredData, mockT);
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it("validates required connectionCategoryCode", () => {
    const errors = validateConnectionCategoryForm(
      { ...validMeteredData, connectionCategoryCode: "" },
      mockT
    );
    expect(errors.connectionCategoryCode).toBe("validation.connectionCategoryCodeRequired");
  });

  it("validates connectionCategoryCode max length", () => {
    const errors = validateConnectionCategoryForm(
      { ...validMeteredData, connectionCategoryCode: "A".repeat(31) },
      mockT
    );
    expect(errors.connectionCategoryCode).toBe("validation.connectionCategoryCodeLength");
  });

  it("validates required connectionCategory", () => {
    const errors = validateConnectionCategoryForm(
      { ...validMeteredData, connectionCategory: "   " },
      mockT
    );
    expect(errors.connectionCategory).toBe("validation.connectionCategoryRequired");
  });

  it("validates connectionCategory max length", () => {
    const errors = validateConnectionCategoryForm(
      { ...validMeteredData, connectionCategory: "B".repeat(151) },
      mockT
    );
    expect(errors.connectionCategory).toBe("validation.connectionCategoryLength");
  });

  it("validates required billingFrequencyId", () => {
    const errors = validateConnectionCategoryForm(
      { ...validMeteredData, billingFrequencyId: null },
      mockT
    );
    expect(errors.billingFrequencyId).toBe("validation.billingFrequencyRequired");
  });

  it("validates invalid billingMethod for metered connections", () => {
    const errors = validateConnectionCategoryForm(
      { ...validMeteredData, isMetered: true, billingMethod: "Flat" },
      mockT
    );
    expect(errors.billingMethod).toBe("validation.billingMethodInvalid");
  });

  it("validates invalid billingMethod for non-metered connections", () => {
    const errors = validateConnectionCategoryForm(
      { ...validMeteredData, isMetered: false, billingMethod: "Metered" },
      mockT
    );
    expect(errors.billingMethod).toBe("validation.billingMethodInvalid");
  });

  it("validates description max length", () => {
    const errors = validateConnectionCategoryForm(
      { ...validMeteredData, description: "D".repeat(301) },
      mockT
    );
    expect(errors.description).toBe("validation.descriptionLength");
  });

  it("exports constants properly", () => {
    expect(METERED_BILLING_METHODS).toContain("Metered");
    expect(NON_METERED_BILLING_METHODS).toContain("Flat");
  });
});
