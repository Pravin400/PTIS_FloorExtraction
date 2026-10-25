import { describe, it, expect } from "vitest";
import { validateBuildingBasicInfo } from "@/lib/validation/asset/new-add-new-asset";
import type { BuildingBasicInfoFormData } from "@/types/asset/municipal-Asset/new-add-new-asset";

describe("NewAddNewAsset Field Validation Limits & Constraints", () => {
  const baseValidForm: BuildingBasicInfoFormData = {
    category: "Building",
    categoryId: 1,
    assetType: "Office",
    typeId: 1,
    assetName: "Municipal Community Hall",
    assetNameRegional: "मनपा सभागृह",
    department: "1",
    ownershipType: "municipal",
    operationalControl: "1",
    fullAddress: "123 Municipal Road, Central Ward",
    locality: "Central",
    pinCode: "400001",
    zone: "1",
    subzone: "1",
    ward: "1",
    mouja: "1",
    length: "20.5",
    width: "15.0",
    landArea: "307.50",
    inChargeName: "Dr. R. K. Sharma",
    inChargeDesignation: "1",
    inChargeMobile: "9876543210",
    inChargeEmail: "officer@example.com",
    propertyNumber: "12345678",
    partitionNo: "PART-1-A",
    upicId: "UPIC-9876",
    surveyNumber: "CSN-45/B",
    plotNumber: "PLOT-12/A",
    pTaxId: "PTAX12345",
    mpmsNo: "MPMS-9988",
    attributes: {},
  };

  it("validates that base valid form has zero errors", () => {
    const errors = validateBuildingBasicInfo(baseValidForm);
    expect(errors).toEqual({});
  });

  describe("In-Charge Name Boundary (Max 40 characters)", () => {
    it("allows up to 40 characters in In-Charge Name", () => {
      const errors = validateBuildingBasicInfo({
        ...baseValidForm,
        inChargeName: "Dr. Rajeshwar Kumar Sharma Senior Offic",
      });
      expect(errors.inChargeName).toBeUndefined();
    });

    it("rejects In-Charge Name exceeding 40 characters", () => {
      const errors = validateBuildingBasicInfo({
        ...baseValidForm,
        inChargeName: "Dr. Rajeshwar Kumar Sharma Senior Officer Extra",
      });
      expect(errors.inChargeName).toMatch(/cannot exceed 40 characters/i);
    });
  });

  describe("Asset Name Boundary (Max 150 characters)", () => {
    it("allows letters and spaces up to 150 characters", () => {
      const errors = validateBuildingBasicInfo({
        ...baseValidForm,
        assetName: "Municipal Community Hall",
      });
      expect(errors.assetName).toBeUndefined();
    });

    it("rejects Asset Name exceeding 150 characters", () => {
      const errors = validateBuildingBasicInfo({
        ...baseValidForm,
        assetName: "A".repeat(151),
      });
      expect(errors.assetName).toMatch(/cannot exceed 150 characters/i);
    });
  });

  describe("Dimensions (Plot Length & Plot Width: decimal(12,2), positive only)", () => {
    it("accepts valid decimal(12,2) length and width", () => {
      const errors = validateBuildingBasicInfo({
        ...baseValidForm,
        length: "125.50",
        width: "99.99",
      });
      expect(errors.length).toBeUndefined();
      expect(errors.width).toBeUndefined();
    });

    it("rejects non-numeric plot length", () => {
      const errors = validateBuildingBasicInfo({
        ...baseValidForm,
        length: "abc",
      });
      expect(errors.length).toMatch(/valid positive number/i);
    });

    it("rejects negative plot width", () => {
      const errors = validateBuildingBasicInfo({
        ...baseValidForm,
        width: "-10",
      });
      expect(errors.width).toMatch(/valid positive number/i);
    });

    it("rejects more than 2 decimal places", () => {
      const errors = validateBuildingBasicInfo({
        ...baseValidForm,
        length: "12.345",
      });
      expect(errors.length).toMatch(/valid positive number/i);
    });
  });

  describe("Property Code & Identifier Fields (Limits)", () => {
    it("accepts Property No up to 12 digits and rejects > 12 digits", () => {
      const valid = validateBuildingBasicInfo({
        ...baseValidForm,
        propertyNumber: "123456789012",
      });
      expect(valid.propertyNumber).toBeUndefined();

      const invalid = validateBuildingBasicInfo({
        ...baseValidForm,
        propertyNumber: "1234567890123",
      });
      expect(invalid.propertyNumber).toMatch(/cannot exceed 12 digits/i);
    });

    it("accepts Partition No up to 10 characters and rejects > 10 characters", () => {
      const valid = validateBuildingBasicInfo({
        ...baseValidForm,
        partitionNo: "PART-12345",
      });
      expect(valid.partitionNo).toBeUndefined();

      const invalid = validateBuildingBasicInfo({
        ...baseValidForm,
        partitionNo: "PART-123456",
      });
      expect(invalid.partitionNo).toMatch(/cannot exceed 10 characters/i);
    });

    it("accepts UPIC ID up to 15 characters, allowing hyphens and slashes", () => {
      const valid = validateBuildingBasicInfo({
        ...baseValidForm,
        upicId: "UPIC-12345/A-99",
      });
      expect(valid.upicId).toBeUndefined();

      const invalid = validateBuildingBasicInfo({
        ...baseValidForm,
        upicId: "UPIC-12345/A-999",
      });
      expect(invalid.upicId).toMatch(/cannot exceed 15 characters/i);
    });

    it("accepts Plot Number up to 12 characters and rejects > 12 characters", () => {
      const valid = validateBuildingBasicInfo({
        ...baseValidForm,
        plotNumber: "PLOT-1234/A-",
      });
      expect(valid.plotNumber).toBeUndefined();

      const invalid = validateBuildingBasicInfo({
        ...baseValidForm,
        plotNumber: "PLOT-12345/A-99",
      });
      expect(invalid.plotNumber).toMatch(/cannot exceed 12 characters/i);
    });

    it("accepts PTax ID up to 10 characters and rejects > 10 characters", () => {
      const valid = validateBuildingBasicInfo({
        ...baseValidForm,
        pTaxId: "PTAX-12345",
      });
      expect(valid.pTaxId).toBeUndefined();

      const invalid = validateBuildingBasicInfo({
        ...baseValidForm,
        pTaxId: "PTAX-1234567",
      });
      expect(invalid.pTaxId).toMatch(/cannot exceed 10 characters/i);
    });

    it("accepts MPMS Number up to 12 characters and rejects > 12 characters", () => {
      const valid = validateBuildingBasicInfo({
        ...baseValidForm,
        mpmsNo: "MPMS-12/A123",
      });
      expect(valid.mpmsNo).toBeUndefined();

      const invalid = validateBuildingBasicInfo({
        ...baseValidForm,
        mpmsNo: "MPMS-12/A12345",
      });
      expect(invalid.mpmsNo).toMatch(/cannot exceed 12 characters/i);
    });
  });

  describe("Email Field (Max 40 characters, proper format)", () => {
    it("accepts valid email up to 40 characters", () => {
      const valid = validateBuildingBasicInfo({
        ...baseValidForm,
        inChargeEmail: "admin.officer@mcgm.gov.in",
      });
      expect(valid.inChargeEmail).toBeUndefined();
    });

    it("rejects email exceeding 40 characters", () => {
      const invalid = validateBuildingBasicInfo({
        ...baseValidForm,
        inChargeEmail: "verylongemailaddress1234567890@domain.com",
      });
      expect(invalid.inChargeEmail).toMatch(/cannot exceed 40 characters/i);
    });

    it("rejects email with invalid format", () => {
      const invalid = validateBuildingBasicInfo({
        ...baseValidForm,
        inChargeEmail: "invalid-email-address",
      });
      expect(invalid.inChargeEmail).toMatch(/valid email/i);
    });
  });

  describe("Address Fields (Max 500 characters)", () => {
    it("accepts address up to 500 characters", () => {
      const valid = validateBuildingBasicInfo({
        ...baseValidForm,
        fullAddress: "A".repeat(500),
      });
      expect(valid.fullAddress).toBeUndefined();
    });

    it("rejects address exceeding 500 characters", () => {
      const invalid = validateBuildingBasicInfo({
        ...baseValidForm,
        fullAddress: "A".repeat(501),
      });
      expect(invalid.fullAddress).toMatch(/cannot exceed 500 characters/i);
    });
  });
});
