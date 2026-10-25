import { describe, it, expect } from "vitest";
import { sanitizeBasicInfoField, validateBuildingBasicInfo } from "@/lib/validation/asset/new-add-new-asset";
import type { BuildingBasicInfoFormData } from "@/types/asset/municipal-Asset/new-add-new-asset";

describe("NewAddNewAsset Field Sanitization & Unicode Support", () => {
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
    propertyNumber: "PROP-123/A-1",
    partitionNo: "PART-1-A",
    upicId: "UPIC-9876",
    surveyNumber: "CSN-45/B",
    plotNumber: "PLOT-12/A",
    mpmsNo: "MPMS-9988",
    attributes: {},
  };

  describe("In-Charge Name Unicode & Sanitization", () => {
    it("allows Marathi Unicode in In-Charge Name", () => {
      const errors = validateBuildingBasicInfo({
        ...baseValidForm,
        inChargeName: "डॉ. राजेश शर्मा",
      });
      expect(errors.inChargeName).toBeUndefined();
    });

    it("disallows digits in In-Charge Name", () => {
      const errors = validateBuildingBasicInfo({
        ...baseValidForm,
        inChargeName: "John Doe 123",
      });
      expect(errors.inChargeName).toMatch(/numbers|digits/i);
    });

    it("disallows special characters in In-Charge Name", () => {
      const errors = validateBuildingBasicInfo({
        ...baseValidForm,
        inChargeName: "John Doe @ Officer",
      });
      expect(errors.inChargeName).toMatch(/letters, spaces, and periods/i);
    });

    it("sanitizes In-Charge Name on typing by stripping digits and symbols", () => {
      const sanitized = sanitizeBasicInfoField("inChargeName", "Dr. Rajesh123 Sharma#@!");
      expect(sanitized).toBe("Dr. Rajesh Sharma");
    });

    it("sanitizes In-Charge Regional Name on typing by stripping digits and symbols", () => {
      const sanitized = sanitizeBasicInfoField("inChargeNameRegional", "डॉ. राजेश123 शर्मा#@!");
      expect(sanitized).toBe("डॉ. राजेश शर्मा");
    });
  });

  describe("Asset Name Unicode & Sanitization", () => {
    it("allows Marathi Unicode in Asset Name", () => {
      const errors = validateBuildingBasicInfo({
        ...baseValidForm,
        assetName: "मनपा सार्वजनिक सभागृह",
      });
      expect(errors.assetName).toBeUndefined();
    });

    it("rejects digits/numbers in Asset Name", () => {
      const errors = validateBuildingBasicInfo({
        ...baseValidForm,
        assetName: "School 102",
      });
      expect(errors.assetName).toMatch(/letters and spaces|no numbers/i);
    });

    it("rejects special characters in Asset Name", () => {
      const errors = validateBuildingBasicInfo({
        ...baseValidForm,
        assetName: "School & Community Center",
      });
      expect(errors.assetName).toMatch(/letters and spaces|no numbers/i);
    });

    it("sanitizes Asset Name on typing by stripping numbers and symbols", () => {
      const sanitized = sanitizeBasicInfoField("assetName", "School $#* 102 Building");
      expect(sanitized).toBe("School   Building");
    });

    it("sanitizes Regional Asset Name on typing by stripping numbers and symbols", () => {
      const sanitized = sanitizeBasicInfoField("assetNameRegional", "मनपा शाळा क्र १२३!@#");
      expect(sanitized).toBe("मनपा शाळा क्र ");
    });
  });

  describe("Dimensions Format & Sanitization", () => {
    it("rejects scientific notation in dimensions", () => {
      const errors = validateBuildingBasicInfo({
        ...baseValidForm,
        length: "10e5",
      });
      expect(errors.length).toMatch(/valid positive number/i);
    });

    it("sanitizes plot length by keeping only digits and single decimal point up to 2 decimal places", () => {
      const sanitized = sanitizeBasicInfoField("length", "12.3.4abc");
      expect(sanitized).toBe("12.34");
    });
  });

  describe("Property Code & Identifier Format & Sanitization", () => {
    it("rejects special characters in Property Number", () => {
      const errors = validateBuildingBasicInfo({
        ...baseValidForm,
        propertyNumber: "PROP#123@!",
      });
      expect(errors.propertyNumber).toMatch(/alphanumeric/i);
    });

    it("rejects special characters in UPIC ID", () => {
      const errors = validateBuildingBasicInfo({
        ...baseValidForm,
        upicId: "UPIC_123$#",
      });
      expect(errors.upicId).toMatch(/alphanumeric characters/i);
    });

    it("sanitizes UPIC ID by removing underscores and special characters", () => {
      const sanitized = sanitizeBasicInfoField("upicId", "UPIC_123#45");
      expect(sanitized).toBe("UPIC12345");
    });

    it("sanitizes CSN No by removing special characters", () => {
      const sanitized = sanitizeBasicInfoField("surveyNumber", "CSN#45/A!");
      expect(sanitized).toBe("CSN45/A");
    });
  });

  describe("Contact & Address Restrictions & Sanitization", () => {
    it("rejects mobile numbers not starting with 6-9", () => {
      const errors = validateBuildingBasicInfo({
        ...baseValidForm,
        inChargeMobile: "1234567890",
      });
      expect(errors.inChargeMobile).toMatch(/starting with 6, 7, 8, or 9/i);
    });

    it("rejects pin codes starting with 0", () => {
      const errors = validateBuildingBasicInfo({
        ...baseValidForm,
        pinCode: "012345",
      });
      expect(errors.pinCode).toMatch(/cannot start with 0|not start/i);
    });

    it("sanitizes mobile number by stripping non-numeric characters", () => {
      const sanitized = sanitizeBasicInfoField("inChargeMobile", "+91 98765-43210");
      expect(sanitized).toBe("919876543210");
    });

    it("rejects full address containing dangerous script characters", () => {
      const errors = validateBuildingBasicInfo({
        ...baseValidForm,
        fullAddress: "123 Street <script> alert(1); </script>",
      });
      expect(errors.fullAddress).toMatch(/invalid special characters/i);
    });

    it("sanitizes full address by removing dangerous brackets and symbols", () => {
      const sanitized = sanitizeBasicInfoField("fullAddress", "Plot 10, Sector-4 <East> $100");
      expect(sanitized).toBe("Plot 10, Sector-4 East 100");
    });
  });
});
