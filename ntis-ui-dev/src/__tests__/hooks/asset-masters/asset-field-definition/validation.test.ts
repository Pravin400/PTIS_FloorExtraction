import {
  sanitizeFieldDefinitionValue,
  validateAssetFieldDefinitionForm,
  formatOptionsJson,
  parseOptionsJsonToDisplay,
  resolveFieldDefinitionBackendError,
  CODE_MAX,
  NAME_MAX,
  LABEL_MAX,
  GROUP_MAX,
  OPTIONS_MAX,
} from "@/hooks/asset-masters/asset-field-definition/validation";
import { createTranslator } from "next-intl";
import assetFieldDefinitionEn from "@/i18n/locales/en/assetFieldDefinition.json";
import { AssetFieldDefinitionFormModel } from "@/types/asset-masters/asset-field-definition.types";

const tEn = createTranslator({ locale: "en", messages: { assetFieldDefinition: assetFieldDefinitionEn }, namespace: "assetFieldDefinition" });

const mockT = (key: string, values?: Record<string, string | number | Date>): string => {
  if (values?.count) return `${key} max ${values.count}`;
  if (values?.default) return String(values.default);
  return key;
};

const validFormData: AssetFieldDefinitionFormModel = {
  id: 1,
  assetCategoryId: 10,
  assetTypeId: 20,
  fieldCode: "FIELD_01",
  fieldName: "Building Name",
  fieldLabel: "Building Name Label",
  fieldType: "text",
  fieldGroup: "General Specs",
  isRequired: false,
  displayOrder: 1,
  isActive: true,
};

describe("Asset Field Definition - OptionsJson Formatting & Parsing", () => {
  it("formats comma separated options into JSON array string", () => {
    expect(formatOptionsJson("Male, Female")).toBe('["Male","Female"]');
    expect(formatOptionsJson("  Option A , Option B , Option C ")).toBe('["Option A","Option B","Option C"]');
  });

  it("formats valid JSON array string correctly", () => {
    expect(formatOptionsJson('["Male", "Female"]')).toBe('["Male","Female"]');
  });

  it("returns null for empty or whitespace options", () => {
    expect(formatOptionsJson("   ")).toBeNull();
    expect(formatOptionsJson(null)).toBeNull();
  });

  it("parses optionsJson for form display", () => {
    expect(parseOptionsJsonToDisplay('["Male","Female"]')).toBe("Male, Female");
    expect(parseOptionsJsonToDisplay(null)).toBe("");
    expect(parseOptionsJsonToDisplay("Plain string")).toBe("Plain string");
  });
});

describe("Asset Field Definition - Sanitization", () => {
  it("sanitizes fieldCode correctly by uppercasing and stripping invalid characters", () => {
    expect(sanitizeFieldDefinitionValue("fieldCode", "field_01@#$")).toBe("FIELD_01");
    expect(sanitizeFieldDefinitionValue("fieldCode", "a".repeat(60))).toHaveLength(CODE_MAX);
  });

  it("sanitizes fieldName using NAME_ONLY_SANITIZE (letters and spaces only)", () => {
    expect(sanitizeFieldDefinitionValue("fieldName", "  Building 123 #Name  ")).toBe("Building Name ");
    expect(sanitizeFieldDefinitionValue("fieldName", "Test   Name")).toBe("Test Name");
    expect(sanitizeFieldDefinitionValue("fieldName", "a".repeat(120))).toHaveLength(NAME_MAX);
  });

  it("sanitizes fieldLabel using NAME_ONLY_SANITIZE", () => {
    expect(sanitizeFieldDefinitionValue("fieldLabel", "Label-123!")).toBe("Label");
    expect(sanitizeFieldDefinitionValue("fieldLabel", "  Field   Label  ")).toBe("Field Label ");
    expect(sanitizeFieldDefinitionValue("fieldLabel", "b".repeat(120))).toHaveLength(LABEL_MAX);
  });

  it("sanitizes fieldGroup using NAME_ONLY_SANITIZE", () => {
    expect(sanitizeFieldDefinitionValue("fieldGroup", "Group-01_Test!")).toBe("GroupTest");
    expect(sanitizeFieldDefinitionValue("fieldGroup", "  Group   Details  ")).toBe("Group Details ");
    expect(sanitizeFieldDefinitionValue("fieldGroup", "c".repeat(120))).toHaveLength(GROUP_MAX);
  });

  it("sanitizes optionsJson by truncating to OPTIONS_MAX length", () => {
    expect(sanitizeFieldDefinitionValue("optionsJson", "a".repeat(600))).toHaveLength(OPTIONS_MAX);
  });
});

describe("Asset Field Definition - Validation", () => {
  it("returns no errors for valid form data", () => {
    const errors = validateAssetFieldDefinitionForm(validFormData, mockT, false);
    expect(Object.keys(errors)).toHaveLength(0);
  });

  describe("optionsJson validation for checkbox, radio, select", () => {
    it("fails when fieldType is checkbox and optionsJson is empty", () => {
      const errors = validateAssetFieldDefinitionForm({ ...validFormData, fieldType: "checkbox", optionsJson: "" }, mockT, false);
      expect(errors.optionsJson).toBe("Options are required for checkbox, radio, and select field types");
    });

    it("fails when fieldType is radio and optionsJson is empty", () => {
      const errors = validateAssetFieldDefinitionForm({ ...validFormData, fieldType: "radio", optionsJson: "   " }, mockT, false);
      expect(errors.optionsJson).toBe("Options are required for checkbox, radio, and select field types");
    });

    it("fails when fieldType is select and optionsJson is empty", () => {
      const errors = validateAssetFieldDefinitionForm({ ...validFormData, fieldType: "select", optionsJson: undefined }, mockT, false);
      expect(errors.optionsJson).toBe("Options are required for checkbox, radio, and select field types");
    });

    it("fails when optionsJson exceeds max length", () => {
      const errors = validateAssetFieldDefinitionForm({ ...validFormData, fieldType: "select", optionsJson: "a".repeat(501) }, mockT, false);
      expect(errors.optionsJson).toContain("form.validation.optionsJsonMaxLength");
    });

    it("passes when fieldType is select and optionsJson is provided within max length (with or without space after comma)", () => {
      expect(validateAssetFieldDefinitionForm({ ...validFormData, fieldType: "select", optionsJson: "Male, Female" }, mockT, false).optionsJson).toBeUndefined();
      expect(validateAssetFieldDefinitionForm({ ...validFormData, fieldType: "select", optionsJson: "Male,Female" }, mockT, false).optionsJson).toBeUndefined();
      expect(validateAssetFieldDefinitionForm({ ...validFormData, fieldType: "select", optionsJson: "पुरुष, महिला" }, mockT, false).optionsJson).toBeUndefined();
      expect(validateAssetFieldDefinitionForm({ ...validFormData, fieldType: "select", optionsJson: "पुरुष,महिला" }, mockT, false).optionsJson).toBeUndefined();
    });

    it("fails when optionsJson format is invalid (e.g. consecutive spaces, invalid symbols)", () => {
      const errors = validateAssetFieldDefinitionForm({ ...validFormData, fieldType: "select", optionsJson: "Male,  Female" }, mockT, false);
      expect(errors.optionsJson).toBe("Options must be comma-separated letters or numbers (e.g. Male, Female)");
    });
  });

  describe("fieldCode validation", () => {
    it("fails when fieldCode is empty", () => {
      const errors = validateAssetFieldDefinitionForm({ ...validFormData, fieldCode: "" }, mockT, false);
      expect(errors.fieldCode).toBe("form.validation.fieldCodeRequired");
    });

    it("fails when fieldCode exceeds max length", () => {
      const errors = validateAssetFieldDefinitionForm(
        { ...validFormData, fieldCode: "A".repeat(51) },
        mockT,
        false
      );
      expect(errors.fieldCode).toContain("fieldCodeMaxLength");
    });

    it("fails when fieldCode is all zeros", () => {
      const errors = validateAssetFieldDefinitionForm({ ...validFormData, fieldCode: "0000" }, mockT, false);
      expect(errors.fieldCode).toBe("form.validation.fieldCodeAllZeros");
    });

    it("fails when fieldCode has invalid characters", () => {
      const errors = validateAssetFieldDefinitionForm({ ...validFormData, fieldCode: "FIELD@#$" }, mockT, false);
      expect(errors.fieldCode).toBe("form.validation.fieldCodeFormat");
    });
  });

  describe("fieldName validation (Name Only Regex)", () => {
    it("fails when fieldName is empty", () => {
      const errors = validateAssetFieldDefinitionForm({ ...validFormData, fieldName: "" }, mockT, false);
      expect(errors.fieldName).toBe("form.validation.fieldNameRequired");
    });

    it("fails when fieldName exceeds max length", () => {
      const errors = validateAssetFieldDefinitionForm(
        { ...validFormData, fieldName: "A".repeat(101) },
        mockT,
        false
      );
      expect(errors.fieldName).toContain("fieldNameMaxLength");
    });

    it("fails when fieldName is all zeros", () => {
      const errors = validateAssetFieldDefinitionForm({ ...validFormData, fieldName: "0000" }, mockT, false);
      expect(errors.fieldName).toBe("form.validation.fieldNameAllZeros");
    });

    it("fails when fieldName contains numbers or symbols", () => {
      const errors = validateAssetFieldDefinitionForm({ ...validFormData, fieldName: "Field123" }, mockT, false);
      expect(errors.fieldName).toBe("Field Name must contain letters and spaces only");
    });

    it("passes when fieldName contains letters and spaces only", () => {
      const errors = validateAssetFieldDefinitionForm({ ...validFormData, fieldName: "Building Specifications" }, mockT, false);
      expect(errors.fieldName).toBeUndefined();
    });
  });

  describe("fieldLabel validation (Name Only Regex)", () => {
    it("fails when fieldLabel is empty", () => {
      const errors = validateAssetFieldDefinitionForm({ ...validFormData, fieldLabel: "" }, mockT, false);
      expect(errors.fieldLabel).toBe("form.validation.fieldLabelRequired");
    });

    it("fails when fieldLabel exceeds max length", () => {
      const errors = validateAssetFieldDefinitionForm(
        { ...validFormData, fieldLabel: "A".repeat(101) },
        mockT,
        false
      );
      expect(errors.fieldLabel).toContain("fieldLabelMaxLength");
    });

    it("fails when fieldLabel is all zeros", () => {
      const errors = validateAssetFieldDefinitionForm({ ...validFormData, fieldLabel: "0000" }, mockT, false);
      expect(errors.fieldLabel).toBe("form.validation.fieldLabelAllZeros");
    });

    it("fails when fieldLabel contains numbers or symbols", () => {
      const errors = validateAssetFieldDefinitionForm({ ...validFormData, fieldLabel: "Label 123!" }, mockT, false);
      expect(errors.fieldLabel).toBe("Field Label must contain letters and spaces only");
    });
  });

  describe("fieldGroup validation (Name Only Regex)", () => {
    it("fails when fieldGroup is empty", () => {
      const errors = validateAssetFieldDefinitionForm({ ...validFormData, fieldGroup: "" }, mockT, false);
      expect(errors.fieldGroup).toBe("Field Group is required");
    });

    it("fails when fieldGroup exceeds max length", () => {
      const errors = validateAssetFieldDefinitionForm(
        { ...validFormData, fieldGroup: "A".repeat(101) },
        mockT,
        false
      );
      expect(errors.fieldGroup).toContain("fieldGroupMaxLength");
    });

    it("fails when fieldGroup is all zeros", () => {
      const errors = validateAssetFieldDefinitionForm({ ...validFormData, fieldGroup: "0000" }, mockT, false);
      expect(errors.fieldGroup).toBe("form.validation.fieldGroupAllZeros");
    });

    it("fails when fieldGroup contains numbers or symbols", () => {
      const errors = validateAssetFieldDefinitionForm({ ...validFormData, fieldGroup: "Group_123" }, mockT, false);
      expect(errors.fieldGroup).toBe("Field Group must contain letters and spaces only");
    });
  });

  describe("scope, type and status validation", () => {
    it("fails when fieldType is empty", () => {
      const errors = validateAssetFieldDefinitionForm({ ...validFormData, fieldType: "" }, mockT, false);
      expect(errors.fieldType).toBe("form.validation.fieldTypeRequired");
    });

    it("fails when assetCategoryId is invalid or zero", () => {
      const errors = validateAssetFieldDefinitionForm({ ...validFormData, assetCategoryId: 0 }, mockT, false);
      expect(errors.assetCategoryId).toBe("form.validation.assetCategoryRequired");
    });

    it("fails when assetTypeId is invalid or zero", () => {
      const errors = validateAssetFieldDefinitionForm({ ...validFormData, assetTypeId: 0 }, mockT, false);
      expect(errors.assetTypeId).toBe("form.validation.assetTypeRequired");
    });

    it("fails when displayOrder is empty", () => {
      const errors = validateAssetFieldDefinitionForm({ ...validFormData, displayOrder: "" }, mockT, false);
      expect(errors.displayOrder).toBe("form.validation.displayOrderRequired");
    });

    it("fails when displayOrder is invalid or out of range", () => {
      const errors = validateAssetFieldDefinitionForm({ ...validFormData, displayOrder: 0 }, mockT, false);
      expect(errors.displayOrder).toBe("form.validation.displayOrderInvalid");
    });

    it("fails when isActive is false on create", () => {
      const errors = validateAssetFieldDefinitionForm({ ...validFormData, isActive: false }, mockT, false);
      expect(errors.isActive).toBe("form.validation.mustBeActive");
    });

    it("allows isActive false on edit", () => {
      const errors = validateAssetFieldDefinitionForm({ ...validFormData, isActive: false }, mockT, true);
      expect(errors.isActive).toBeUndefined();
    });
  });

  describe("resolveFieldDefinitionBackendError helper", () => {
    it("handles FieldCode duplicate error string", () => {
      const result = resolveFieldDefinitionBackendError(
        "AssetFieldDefinition_FieldCode_Duplicate",
        mockT,
        (k) => k
      );
      expect(result.toastMessage).toBe("errors.duplicateFieldCode");
      expect(result.fieldError).toEqual({ field: "fieldCode", message: "errors.duplicateFieldCode" });
    });

    it("handles FieldName duplicate error string", () => {
      const result = resolveFieldDefinitionBackendError(
        "AssetFieldDefinition_FieldName_Duplicate",
        mockT,
        (k) => k
      );
      expect(result.toastMessage).toBe("errors.duplicateFieldName");
      expect(result.fieldError).toEqual({ field: "fieldName", message: "errors.duplicateFieldName" });
    });

    it("handles generic FieldDefinition duplicate error string", () => {
      const result = resolveFieldDefinitionBackendError(
        "A record with the same details already exists.",
        mockT,
        (k) => k
      );
      expect(result.toastMessage).toBe("errors.duplicate");
      expect(result.fieldError).toEqual({ field: "fieldName", message: "errors.duplicateFieldName" });
    });

    it.each([
      "This Asset Field Definition cannot be deleted because it is in use.",
      "This Asset Field Definition cannot be deactivated because it is in use.",
    ])("translates the backend reference message %s", (message) => {
      const result = resolveFieldDefinitionBackendError(message, tEn as never, (k) => k);
      expect(result.toastMessage).toBe(message);
      expect(result.fieldError).toBeUndefined();
    });
  });
});
