import { describe, it, expect, vi } from "vitest";
import { getOwningDepartmentErrorMessage, parseOwningDepartmentApiErrors } from "@/hooks/asset-masters/owning-department/error-mapping";

describe("Owning Department Master error-mapping getOwningDepartmentErrorMessage", () => {
  const mockT = vi.fn((key: string) => {
    const translations: Record<string, string> = {
      "title": "Owning Department Master",
      "form.messages.duplicate": "This record already exists",
      "apiErrors.duplicateRecord": "This record already exists",
      "apiErrors.OwningDepartment_Duplicate": "Owning department name already exists",
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

  it("should return localized duplicate message when message contains OwningDepartment_Duplicate", () => {
    const result = getOwningDepartmentErrorMessage("OwningDepartment_Duplicate", 400, mockT, mockTCommon);
    expect(result).toBe("Owning department name already exists");
  });

  it("should return localized duplicate message when message contains 'Create Owning Department failed: OwningDepartment_Duplicate'", () => {
    const result = getOwningDepartmentErrorMessage("Create Owning Department failed: OwningDepartment_Duplicate", 400, mockT, mockTCommon);
    expect(result).toBe("Owning department name already exists");
  });

  it("should return localized duplicate message when statusCode is 409", () => {
    const result = getOwningDepartmentErrorMessage("", 409, mockT, mockTCommon);
    expect(result).toBe("This record already exists");
  });

  it("should parse JSON error response payload containing validation errors", () => {
    const jsonMsg = JSON.stringify({
      statusCode: 400,
      errors: { OwningDepartmentName: ["OwningDepartment_Duplicate"] }
    });
    const result = getOwningDepartmentErrorMessage(jsonMsg, 400, mockT, mockTCommon);
    expect(result).toBe("Owning department name already exists");
  });
});

describe("Owning Department Master parseOwningDepartmentApiErrors", () => {
  const mockT = vi.fn((key: string) => {
    const translations: Record<string, string> = {
      "title": "Owning Department Master",
      "form.messages.duplicate": "This record already exists",
      "form.validation.departmentNameDuplicate": "Owning department name already exists",
    };
    return translations[key] || key;
  });

  const mockTCommon = vi.fn((key: string) => key);

  it("should parse fieldErrors and map owningDepartmentName duplicate error correctly", () => {
    const jsonMsg = JSON.stringify({
      errors: { OwningDepartmentName: ["OwningDepartment_Duplicate"] }
    });
    const result = parseOwningDepartmentApiErrors(jsonMsg, 400, mockT, mockTCommon);
    expect(result.fieldErrors.owningDepartmentName).toBe("Owning department name already exists");
  });

  it("should fallback owningDepartmentName field error when HTTP status is 409 Conflict without field key in JSON", () => {
    const result = parseOwningDepartmentApiErrors("Conflict", 409, mockT, mockTCommon);
    expect(result.fieldErrors.owningDepartmentName).toBe("Owning department name already exists");
  });
});
