import { describe, it, expect } from "vitest";
import {
  validateInventoryConditionForm,
  validateInventoryConditionServerInput,
} from "@/hooks/asset-masters/inventory-condition/validation";
import type { InventoryConditionFormModel } from "@/types/asset-masters/inventory-condition.types";

describe("Inventory Condition Validation", () => {
  const t = (key: string) => key;

  describe("Client Validation - validateInventoryConditionForm", () => {
    it("validates required fields on create", () => {
      const emptyData: InventoryConditionFormModel = {
        conditionCategory: "",
        categoryId: 0,
        conditionName: "",
        conditionFactor: "",
        displayOrder: "",
        isActive: false,
      };

      const errors = validateInventoryConditionForm(emptyData, t, false);
      expect(errors.conditionCategory).toBeDefined();
      expect(errors.categoryId).toBeDefined();
      expect(errors.conditionName).toBeDefined();
      expect(errors.conditionFactor).toBeDefined();
      expect(errors.isActive).toBeDefined();
    });

    it("passes for valid Asset condition", () => {
      const validData: InventoryConditionFormModel = {
        conditionCategory: "Asset",
        categoryId: 1,
        conditionName: "Good Condition",
        conditionFactor: 0.85,
        displayOrder: 1,
        description: "Standard good condition",
        isActive: true,
      };

      const errors = validateInventoryConditionForm(validData, t, false);
      expect(Object.keys(errors).length).toBe(0);
    });

    it("passes for valid Inventory condition", () => {
      const validData: InventoryConditionFormModel = {
        conditionCategory: "Inventory",
        categoryId: 2,
        conditionName: "Needs Repair",
        conditionFactor: 0.4,
        displayOrder: 2,
        isActive: true,
      };

      const errors = validateInventoryConditionForm(validData, t, false);
      expect(Object.keys(errors).length).toBe(0);
    });

    it("rejects invalid condition factor out of range", () => {
      const invalidData: InventoryConditionFormModel = {
        conditionCategory: "Asset",
        categoryId: 1,
        conditionName: "Broken",
        conditionFactor: 1.5,
        displayOrder: 1,
        isActive: true,
      };

      const errors = validateInventoryConditionForm(invalidData, t, false);
      expect(errors.conditionFactor).toBeDefined();
    });
  });

  describe("Server Validation - validateInventoryConditionServerInput", () => {
    it("rejects missing categoryType and categoryId without silent coercion", () => {
      const data: InventoryConditionFormModel = {
        conditionCategory: "" as "" | "Asset" | "Inventory",
        categoryId: 0,
        conditionName: "Test",
        conditionFactor: 0.5,
        displayOrder: 1,
        isActive: true,
      };

      const result = validateInventoryConditionServerInput(data, false);
      expect(result.isValid).toBe(false);
      expect(result.errors.conditionCategory).toBeDefined();
      expect(result.errors.categoryId).toBeDefined();
    });

    it("rejects invalid conditionFactor without silent coercion", () => {
      const data: InventoryConditionFormModel = {
        conditionCategory: "Asset",
        categoryId: 1,
        conditionName: "Test",
        conditionFactor: "invalid_num" as unknown as number,
        displayOrder: 1,
        isActive: true,
      };

      const result = validateInventoryConditionServerInput(data, false);
      expect(result.isValid).toBe(false);
      expect(result.errors.conditionFactor).toBeDefined();
    });

    it("returns sanitized DTO when input is completely valid", () => {
      const data: InventoryConditionFormModel = {
        conditionCategory: "Asset",
        categoryId: 5,
        conditionName: "  Excellent Condition  ",
        description: "  Looks brand new  ",
        conditionFactor: "0.95",
        displayOrder: "2",
        isActive: true,
      };

      const result = validateInventoryConditionServerInput(data, false);
      expect(result.isValid).toBe(true);
      expect(result.sanitizedDto).toEqual({
        conditionCategory: "Asset",
        categoryId: 5,
        conditionName: "Excellent Condition",
        description: "Looks brand new",
        conditionFactor: 0.95,
        displayOrder: 2,
        isActive: true,
      });
    });
  });
});
