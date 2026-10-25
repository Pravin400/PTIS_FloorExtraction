import { describe, it, expect } from "vitest";

// Import types to verify they exist
import type {
  FloorFactorCVMaster,
  FloorFactorCVMasterCreate,
  FloorFactorCVMasterUpdate,
} from "@/types/floor-cv-weightageMaster.types";

describe("Weightage Master CV - Type Definitions", () => {
  describe("FloorFactorCVMaster Types", () => {
    it("FloorFactorCVMaster type is correctly structured", () => {
      const mockData: FloorFactorCVMaster = {
        id: 1,
        floorId: 2,
        factorWithLift: 1.2,
        factorWithoutLift: 1.0,
        yearRangeCVId: 1,
        isActive: true,
        createdDate: "2024-01-01",
      };
      
      expect(mockData.id).toBe(1);
      expect(mockData.factorWithLift).toBe(1.2);
      expect(mockData.factorWithoutLift).toBe(1.0);
      expect(mockData.floorId).toBe(2);
    });

    it("FloorFactorCVMasterCreate type accepts required fields", () => {
      const createData: FloorFactorCVMasterCreate = {
        isActive: true,
        createdBy: 1,
        floorId: 2,
        factorWithLift: 1.3,
        factorWithoutLift: 1.1,
        yearRangeCVId: 1,
      };
      
      expect(createData.factorWithLift).toBe(1.3);
      expect(createData.factorWithoutLift).toBe(1.1);
      expect(createData.createdBy).toBe(1);
    });

    it("FloorFactorCVMasterUpdate type includes required fields", () => {
      const updateData: FloorFactorCVMasterUpdate = {
        isActive: true,
        updatedBy: 1,
        floorId: 2,
        factorWithLift: 1.4,
        factorWithoutLift: 1.2,
        yearRangeCVId: 1,
      };
      
      expect(updateData.factorWithLift).toBe(1.4);
      expect(updateData.updatedBy).toBe(1);
    });
  });

  describe("Type Safety", () => {
    it("enforces required fields in create types", () => {
      const createData: FloorFactorCVMasterCreate = {
        isActive: true,
        createdBy: 1,
        floorId: 1,
        factorWithLift: 1.0,
        factorWithoutLift: 0.9,
        yearRangeCVId: 1,
      };
      
      // All required fields must be present
      expect(createData).toHaveProperty("factorWithLift");
      expect(createData).toHaveProperty("factorWithoutLift");
      expect(createData).toHaveProperty("yearRangeCVId");
      expect(createData).toHaveProperty("floorId");
      expect(createData).toHaveProperty("createdBy");
    });
  });

  describe("Data Validation", () => {
    it("validates floor lift and non-lift factors", () => {
      const data: FloorFactorCVMaster = {
        id: 1,
        floorId: 1,
        factorWithLift: 1.2,
        factorWithoutLift: 1.0,
        yearRangeCVId: 1,
        isActive: true,
        createdDate: "2024-01-01",
      };
      
      expect(data.factorWithLift).toBeGreaterThan(0);
      expect(data.factorWithoutLift).toBeGreaterThan(0);
      // Typically factor with lift should be >= factor without lift
      expect(data.factorWithLift).toBeGreaterThanOrEqual(data.factorWithoutLift);
    });

    it("validates boolean isActive field", () => {
      const testData: FloorFactorCVMaster = {
        id: 1,
        floorId: 1,
        factorWithLift: 1.0,
        factorWithoutLift: 0.9,
        yearRangeCVId: 1,
        isActive: true,
        createdDate: "2024-01-01",
      };
      
      expect(typeof testData.isActive).toBe("boolean");
      
      testData.isActive = false;
      expect(testData.isActive).toBe(false);
    });
  });
});
