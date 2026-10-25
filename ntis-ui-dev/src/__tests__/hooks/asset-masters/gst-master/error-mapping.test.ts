import { describe, it, expect, vi } from "vitest";
import { getGstMasterErrorMessage, parseGstMasterApiErrors } from "@/hooks/asset-masters/gst-master/error-mapping";

describe("GST Master error-mapping getGstMasterErrorMessage", () => {
  const mockT = vi.fn((key: string) => {
    const translations: Record<string, string> = {
      "title": "GST Master",
      "form.messages.duplicate": "This record already exists",
      "apiErrors.duplicateRecord": "This record already exists",
      "apiErrors.GST_TaxCode_Duplicate": "GST Tax Code already exists",
      "apiErrors.deleteBlockedInUse": "This GST cannot be deleted because it is in use.",
      "apiErrors.deactivateBlockedInUse": "This GST cannot be deactivated because it is in use.",
      "apiErrors.operationFailed": "Operation failed",
    };
    return translations[key] || key;
  });

  const mockTCommon = vi.fn((key: string) => {
    const translations: Record<string, string> = {
      "errors.generic": "Failed to connect to the server",
      "errors.deleteError": "Failed to delete",
    };
    return translations[key] || key;
  });

  it("should return localized duplicate message when message contains GST_TaxCode_Duplicate", () => {
    const result = getGstMasterErrorMessage("GST_TaxCode_Duplicate", 400, mockT, mockTCommon);
    expect(result).toBe("This record already exists");
  });

  it("should return localized duplicate message when message contains 'Create GST master failed: GST_TaxCode_Duplicate'", () => {
    const result = getGstMasterErrorMessage("Create GST master failed: GST_TaxCode_Duplicate", 400, mockT, mockTCommon);
    expect(result).toBe("This record already exists");
  });

  it("should return localized duplicate message when message contains 'already exist'", () => {
    const result = getGstMasterErrorMessage("Tax code 'GST_18' already exists.", 400, mockT, mockTCommon);
    expect(result).toBe("This record already exists");
  });

  it("should return localized duplicate message when statusCode is 409", () => {
    const result = getGstMasterErrorMessage("", 409, mockT, mockTCommon);
    expect(result).toBe("This record already exists");
  });

  it("should parse JSON error response payload containing validation errors", () => {
    const jsonMsg = JSON.stringify({
      statusCode: 400,
      errors: { TaxCode: ["GST_TaxCode_Duplicate"] }
    });
    const result = getGstMasterErrorMessage(jsonMsg, 400, mockT, mockTCommon);
    expect(result).toBe("This record already exists");
  });

  it("should return the localized delete reference error", () => {
    const result = getGstMasterErrorMessage("This GST cannot be deleted because it is in use.", 400, mockT, mockTCommon);
    expect(result).toBe("This GST cannot be deleted because it is in use.");
  });

  it("should return the localized deactivate reference error", () => {
    const result = getGstMasterErrorMessage("This GST cannot be deactivated because it is in use.", 400, mockT, mockTCommon);
    expect(result).toBe("This GST cannot be deactivated because it is in use.");
  });

  it("should return raw error message as fallback if no duplicate or reference match", () => {
    const customError = "Custom backend validation error";
    const result = getGstMasterErrorMessage(customError, 400, mockT, mockTCommon);
    expect(result).toBe(customError);
  });
});

describe("GST Master parseGstMasterApiErrors", () => {
  const mockT = vi.fn((key: string) => {
    const translations: Record<string, string> = {
      "title": "GST Master",
      "form.messages.duplicate": "This record already exists",
      "form.validation.taxCodeDuplicate": "Tax code already exists",
      "form.validation.taxNameDuplicate": "Tax name already exists",
      "apiErrors.deactivateBlockedInUse": "This GST cannot be deactivated because it is in use.",
    };
    return translations[key] || key;
  });

  const mockTCommon = vi.fn((key: string) => key);

  it("should bind the deactivate reference error to the status toggle", () => {
    const result = parseGstMasterApiErrors("This GST cannot be deactivated because it is in use.", 400, mockT, mockTCommon);
    expect(result.fieldErrors).toEqual({ isActive: "This GST cannot be deactivated because it is in use." });
    expect(result.globalMessage).toBe("This GST cannot be deactivated because it is in use.");
  });

  it("should parse fieldErrors and map taxCode duplicate error correctly", () => {
    const jsonMsg = JSON.stringify({
      errors: { TaxCode: ["GST_TaxCode_Duplicate"] }
    });
    const result = parseGstMasterApiErrors(jsonMsg, 400, mockT, mockTCommon);
    expect(result.fieldErrors.taxCode).toBe("Tax code already exists");
  });

  it("should parse fieldErrors and map taxName duplicate error correctly", () => {
    const jsonMsg = JSON.stringify({
      errors: { TaxName: ["Tax name already exists"] }
    });
    const result = parseGstMasterApiErrors(jsonMsg, 400, mockT, mockTCommon);
    expect(result.fieldErrors.taxName).toBe("Tax name already exists");
  });

  it("should fallback taxName field error when generic duplicate message 'This record already exists' or 409 is returned", () => {
    const result = parseGstMasterApiErrors("This record already exists", 409, mockT, mockTCommon);
    expect(result.fieldErrors.taxName).toBe("Tax name already exists");
    expect(result.fieldErrors.taxCode).toBeUndefined();
  });

  it("should map taxCode field error when message explicitly mentions code", () => {
    const result = parseGstMasterApiErrors("Tax code GST_01 already exists", 400, mockT, mockTCommon);
    expect(result.fieldErrors.taxCode).toBe("Tax code already exists");
    expect(result.fieldErrors.taxName).toBeUndefined();
  });
});
