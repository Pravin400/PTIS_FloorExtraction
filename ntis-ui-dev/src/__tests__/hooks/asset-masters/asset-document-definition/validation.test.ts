import { describe, it, expect } from "vitest";
import { createTranslator } from "next-intl";
import assetDocumentDefinitionEn from "@/i18n/locales/en/assetDocumentDefinition.json";
import {
  sanitizeFieldValue,
  validateAssetDocumentDefinitionForm,
  resolveDocumentDefinitionBackendError,
  CODE_MAX,
  NAME_MAX,
  DESCRIPTION_MAX,
} from "@/hooks/asset-masters/asset-document-definition/validation";
import { AssetDocumentDefinitionFormModel } from "@/types/asset-masters/asset-document-definition.types";

const tEn = createTranslator({ locale: "en", messages: { assetDocumentDefinition: assetDocumentDefinitionEn }, namespace: "assetDocumentDefinition" });

const mockT = (key: string, values?: Record<string, string | number | Date>): string => {
  if (values?.count) return `${key} max ${values.count}`;
  if (values?.default) return String(values.default);
  return key;
};

const validFormData: AssetDocumentDefinitionFormModel = {
  id: 1,
  assetCategoryId: 10,
  assetTypeId: 20,
  documentCode: "DOC_01",
  documentName: "Title Deed",
  description: "Official Property Title Deed Document",
  isRequired: true,
  displayOrder: 1,
  isActive: true,
};

describe("Asset Document Definition - Sanitization", () => {
  it("sanitizes documentCode correctly by uppercasing and stripping invalid characters", () => {
    expect(sanitizeFieldValue("documentCode", "doc_01@#$")).toBe("DOC_01");
    expect(sanitizeFieldValue("documentCode", "a".repeat(60))).toHaveLength(CODE_MAX);
  });

  it("sanitizes documentName using ASSET_MASTER_NAME_SANITIZE", () => {
    expect(sanitizeFieldValue("documentName", "  Title Deed_01!  ")).toBe("Title Deed_01 ");
    expect(sanitizeFieldValue("documentName", "a".repeat(120))).toHaveLength(NAME_MAX);
  });

  it("sanitizes description using DESCRIPTION_SANITIZE", () => {
    expect(sanitizeFieldValue("description", "  Description text @#$ 123  ")).toBe("Description text 123 ");
    expect(sanitizeFieldValue("description", "b".repeat(250))).toHaveLength(DESCRIPTION_MAX);
  });
});

describe("Asset Document Definition - Validation", () => {
  it("returns no errors for valid form data", () => {
    const errors = validateAssetDocumentDefinitionForm(validFormData, mockT, false);
    expect(Object.keys(errors)).toHaveLength(0);
  });

  describe("documentCode validation", () => {
    it("fails when documentCode is empty", () => {
      const errors = validateAssetDocumentDefinitionForm({ ...validFormData, documentCode: "" }, mockT, false);
      expect(errors.documentCode).toBe("form.validation.documentCodeRequired");
    });

    it("fails when documentCode exceeds max length", () => {
      const errors = validateAssetDocumentDefinitionForm(
        { ...validFormData, documentCode: "A".repeat(51) },
        mockT,
        false
      );
      expect(errors.documentCode).toContain("documentCodeMaxLength");
    });

    it("fails when documentCode is all zeros", () => {
      const errors = validateAssetDocumentDefinitionForm({ ...validFormData, documentCode: "0000" }, mockT, false);
      expect(errors.documentCode).toBe("form.validation.documentCodeAllZeros");
    });

    it("fails when documentCode has invalid characters", () => {
      const errors = validateAssetDocumentDefinitionForm({ ...validFormData, documentCode: "DOC@#$" }, mockT, false);
      expect(errors.documentCode).toBe("form.validation.documentCodeFormat");
    });
  });

  describe("documentName validation", () => {
    it("fails when documentName is empty", () => {
      const errors = validateAssetDocumentDefinitionForm({ ...validFormData, documentName: "" }, mockT, false);
      expect(errors.documentName).toBe("form.validation.documentNameRequired");
    });

    it("fails when documentName exceeds max length", () => {
      const errors = validateAssetDocumentDefinitionForm(
        { ...validFormData, documentName: "A".repeat(101) },
        mockT,
        false
      );
      expect(errors.documentName).toContain("documentNameMaxLength");
    });

    it("fails when documentName is all zeros", () => {
      const errors = validateAssetDocumentDefinitionForm({ ...validFormData, documentName: "0000" }, mockT, false);
      expect(errors.documentName).toBe("form.validation.documentNameAllZeros");
    });

    it("fails when documentName has invalid format", () => {
      const errors = validateAssetDocumentDefinitionForm({ ...validFormData, documentName: "Name@#$" }, mockT, false);
      expect(errors.documentName).toBe("form.validation.documentNameFormat");
    });
  });

  describe("description validation", () => {
    it("fails when description is empty", () => {
      const errors = validateAssetDocumentDefinitionForm({ ...validFormData, description: "" }, mockT, false);
      expect(errors.description).toBe("form.validation.descriptionRequired");
    });

    it("fails when description exceeds max length", () => {
      const errors = validateAssetDocumentDefinitionForm(
        { ...validFormData, description: "A".repeat(201) },
        mockT,
        false
      );
      expect(errors.description).toContain("descriptionMaxLength");
    });

    it("fails when description is all zeros", () => {
      const errors = validateAssetDocumentDefinitionForm({ ...validFormData, description: "0000" }, mockT, false);
      expect(errors.description).toBe("form.validation.descriptionAllZeros");
    });
  });

  describe("displayOrder and active status validation", () => {
    it("fails when displayOrder is empty", () => {
      const errors = validateAssetDocumentDefinitionForm({ ...validFormData, displayOrder: "" }, mockT, false);
      expect(errors.displayOrder).toBe("form.validation.displayOrderRequired");
    });

    it("fails when displayOrder is invalid or out of range", () => {
      const errors = validateAssetDocumentDefinitionForm({ ...validFormData, displayOrder: 0 }, mockT, false);
      expect(errors.displayOrder).toBe("form.validation.displayOrderInvalid");
    });

    it("fails when isActive is false on create", () => {
      const errors = validateAssetDocumentDefinitionForm({ ...validFormData, isActive: false }, mockT, false);
      expect(errors.isActive).toBe("form.validation.mustBeActive");
    });

    it("allows isActive false on edit", () => {
      const errors = validateAssetDocumentDefinitionForm({ ...validFormData, isActive: false }, mockT, true);
      expect(errors.isActive).toBeUndefined();
    });

    it("fails when assetCategoryId or assetTypeId is missing or invalid", () => {
      const catErr = validateAssetDocumentDefinitionForm({ ...validFormData, assetCategoryId: 0 }, mockT, false);
      expect(catErr.assetCategoryId).toBe("form.validation.assetCategoryRequired");

      const typeErr = validateAssetDocumentDefinitionForm({ ...validFormData, assetTypeId: 0 }, mockT, false);
      expect(typeErr.assetTypeId).toBe("form.validation.assetTypeRequired");
    });
  });

  describe("resolveDocumentDefinitionBackendError helper", () => {
    it("handles DocumentCode duplicate error string", () => {
      const result = resolveDocumentDefinitionBackendError(
        "AssetDocumentDefinition_DocumentCode_Duplicate",
        mockT,
        (k) => k
      );
      expect(result.toastMessage).toBe("errors.duplicateDocumentCode");
      expect(result.fieldError).toEqual({ field: "documentCode", message: "errors.duplicateDocumentCode" });
    });

    it("handles DocumentName duplicate error string", () => {
      const result = resolveDocumentDefinitionBackendError(
        "AssetDocumentDefinition_DocumentName_Duplicate",
        mockT,
        (k) => k
      );
      expect(result.toastMessage).toBe("errors.duplicateDocumentName");
      expect(result.fieldError).toEqual({ field: "documentName", message: "errors.duplicateDocumentName" });
    });

    it("handles generic DocumentDefinition duplicate error string", () => {
      const result = resolveDocumentDefinitionBackendError(
        "A record with the same details already exists.",
        mockT,
        (k) => k
      );
      expect(result.toastMessage).toBe("errors.duplicate");
      expect(result.fieldError).toEqual({ field: "documentName", message: "errors.duplicateDocumentName" });
    });

    it.each([
      "This Asset Document Definition cannot be deleted because it is in use.",
      "This Asset Document Definition cannot be deactivated because it is in use.",
    ])("translates the backend reference message %s", (message) => {
      const result = resolveDocumentDefinitionBackendError(message, tEn as never, (k) => k);
      expect(result.toastMessage).toBe(message);
      expect(result.fieldError).toBeUndefined();
    });

    it("handles invalid asset category or type error code", () => {
      const catResult = resolveDocumentDefinitionBackendError(
        "AssetDocumentDefinition_AssetCategoryId_Invalid",
        mockT,
        (k) => k
      );
      expect(catResult.toastMessage).toBe("errors.invalidAssetCategory");
      expect(catResult.fieldError).toEqual({ field: "assetCategoryId", message: "errors.invalidAssetCategory" });

      const typeResult = resolveDocumentDefinitionBackendError(
        "AssetDocumentDefinition_AssetTypeId_Invalid",
        mockT,
        (k) => k
      );
      expect(typeResult.toastMessage).toBe("errors.invalidAssetType");
      expect(typeResult.fieldError).toEqual({ field: "assetTypeId", message: "errors.invalidAssetType" });
    });
  });
});
