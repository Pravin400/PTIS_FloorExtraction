import { describe, it, expect } from "vitest";
import { createTranslator } from "next-intl";
import { getOwningDepartmentErrorMessage, parseOwningDepartmentApiErrors } from "@/hooks/asset-masters/owning-department/error-mapping";
import owningDepartmentEn from "@/i18n/locales/en/owningDepartment.json";
import commonEn from "@/i18n/locales/en/common.json";

const t = createTranslator({ locale: "en", messages: { owningDepartment: owningDepartmentEn }, namespace: "owningDepartment" });
const tCommon = createTranslator({ locale: "en", messages: { common: commonEn }, namespace: "common" });

// The backend's reference-check messages (ReferenceValidationService, DisplayAs "Owning Department", CheckMasters "Designations").
const DELETE_HAS = "This Owning Department cannot be deleted because it has Designations. Please delete all Designations for this Owning Department first.";
const DEACTIVATE_HAS = "This Owning Department cannot be deactivated because it has Designations. Please delete all Designations for this Owning Department first.";
const DELETE_IN_USE = "This Owning Department cannot be deleted because it is in use.";
const DEACTIVATE_IN_USE = "This Owning Department cannot be deactivated because it is in use.";

describe("owning department reference errors", () => {
  it.each([DELETE_HAS, DEACTIVATE_HAS, DELETE_IN_USE, DEACTIVATE_IN_USE])("translates %s", (message) => {
    expect(getOwningDepartmentErrorMessage(message, 400, t as never, tCommon as never)).toBe(message);
  });

  it.each([DEACTIVATE_HAS, DEACTIVATE_IN_USE])("puts the deactivate message on isActive: %s", (message) => {
    expect(parseOwningDepartmentApiErrors(message, 400, t as never, tCommon as never)).toEqual({
      fieldErrors: { isActive: message },
      globalMessage: message,
    });
  });

  it.each([DELETE_HAS, DELETE_IN_USE])("adds no field error for the delete message: %s", (message) => {
    expect(parseOwningDepartmentApiErrors(message, 400, t as never, tCommon as never).fieldErrors).toEqual({});
  });
});
