import {
  mapSharedApiError,
  parseReferenceBlockedMessage,
  SharedErrorMapOptions,
  translateReferenceBlockedMessage,
} from "@/lib/utils/asset-utils/shared-error-mapping";
import type { OwningDepartmentFormModel } from "@/types/asset-masters/owning-department.types";

/**
 * Maps Owning Department Master backend API error responses to localized multi-lingual strings (en, mr, hi).
 */
export function getOwningDepartmentErrorMessage(
  message: string | undefined,
  statusCode: number | undefined,
  t: (key: string, values?: Record<string, string | number | Date>) => string,
  tCommon: (key: string, values?: Record<string, string | number | Date>) => string,
  fallbackEntityName?: string
): string {
  let rawMsg = (message || "").trim();

  if (rawMsg.startsWith("{") && rawMsg.endsWith("}")) {
    try {
      const parsed = JSON.parse(rawMsg);
      if (parsed.errors && typeof parsed.errors === "object") {
        const firstErrorKey = Object.keys(parsed.errors)[0];
        if (firstErrorKey) {
          const errorsList = parsed.errors[firstErrorKey];
          if (Array.isArray(errorsList) && errorsList.length > 0) {
            rawMsg = String(errorsList[0]);
          } else if (typeof errorsList === "string") {
            rawMsg = errorsList;
          }
        }
      } else if (typeof parsed.message === "string" && parsed.message.trim()) {
        rawMsg = parsed.message.trim();
      }
    } catch {
      // Keep rawMsg as is if parsing fails
    }
  }

  // Reference check (DELETE, or PUT with isActive: false):
  //   "This Owning Department cannot be deleted because it has Designations. Please delete all Designations for this Owning Department first."
  //   "This Owning Department cannot be deleted because it is in use."
  const referenceBlocked = translateReferenceBlockedMessage(rawMsg, t, {
    entities: { "Owning Department": "apiErrors.referenceBlocked.owningDepartment" },
    masters: { Designations: "apiErrors.referenceMasters.designations" },
    andKey: "apiErrors.referenceMasters.and",
  });
  if (referenceBlocked) return referenceBlocked;

  const lowerMsg = rawMsg.toLowerCase();

  if (
    lowerMsg.includes("duplicate") ||
    lowerMsg.includes("already exist") ||
    lowerMsg.includes("already exists") ||
    lowerMsg.includes("owningdepartment_duplicate") ||
    statusCode === 409
  ) {
    const hasNameDup =
      lowerMsg.includes("name") ||
      lowerMsg.includes("department") ||
      lowerMsg.includes("owningdepartment") ||
      lowerMsg.includes("owningdepartment_duplicate");

    if (hasNameDup) {
      try {
        const deptDup = t("apiErrors.OwningDepartment_Duplicate");
        if (deptDup && deptDup !== "apiErrors.OwningDepartment_Duplicate" && !deptDup.includes("apiErrors")) {
          return deptDup;
        }
      } catch {}
      try {
        const nameDup = t("form.validation.departmentNameDuplicate");
        if (nameDup && nameDup !== "form.validation.departmentNameDuplicate" && !nameDup.includes("form.validation")) {
          return nameDup;
        }
      } catch {}
    }

    try {
      const formDup = t("form.messages.duplicate");
      if (formDup && formDup !== "form.messages.duplicate" && !formDup.includes("form.messages.duplicate")) {
        return formDup;
      }
    } catch {}
    try {
      const apiDup = t("apiErrors.duplicateRecord");
      if (apiDup && apiDup !== "apiErrors.duplicateRecord" && !apiDup.includes("apiErrors.duplicateRecord")) {
        return apiDup;
      }
    } catch {}
    try {
      const deptDup = t("apiErrors.OwningDepartment_Duplicate");
      if (deptDup && deptDup !== "apiErrors.OwningDepartment_Duplicate" && !deptDup.includes("apiErrors")) {
        return deptDup;
      }
    } catch {}
  }

  return mapSharedApiError({
    message: rawMsg || message,
    statusCode,
    t: t as SharedErrorMapOptions["t"],
    tCommon: tCommon as SharedErrorMapOptions["tCommon"],
    fallbackEntityName: fallbackEntityName || t("title"),
  });
}

export interface OwningDepartmentApiErrorResult {
  fieldErrors: Partial<Record<keyof OwningDepartmentFormModel, string>>;
  globalMessage: string;
}

/**
 * Parses backend API errors and returns both specific field-level errors (e.g. owningDepartmentName) and global toast message.
 */
export function parseOwningDepartmentApiErrors(
  message: string | undefined,
  statusCode: number | undefined,
  t: (key: string, values?: Record<string, string | number | Date>) => string,
  tCommon: (key: string, values?: Record<string, string | number | Date>) => string
): OwningDepartmentApiErrorResult {
  const globalMessage = getOwningDepartmentErrorMessage(message, statusCode, t, tCommon);

  // Deactivating an Owning Department that is in use: show the reason under the status toggle.
  if (parseReferenceBlockedMessage(message)?.operation === "deactivate") {
    return { fieldErrors: { isActive: globalMessage }, globalMessage };
  }

  const fieldErrors: Partial<Record<keyof OwningDepartmentFormModel, string>> = {};

  const rawMsg = (message || "").trim();

  if (rawMsg.startsWith("{") && rawMsg.endsWith("}")) {
    try {
      const parsed = JSON.parse(rawMsg);
      if (parsed.errors && typeof parsed.errors === "object") {
        for (const [key, errVal] of Object.entries(parsed.errors)) {
          const lowerKey = key.toLowerCase();
          const errTextLower = (Array.isArray(errVal) ? String(errVal[0] || "") : String(errVal || "")).toLowerCase();
          const isDup = errTextLower.includes("duplicate") || errTextLower.includes("already exist") || errTextLower.includes("already exists") || errTextLower.includes("owningdepartment_duplicate") || statusCode === 409;
          const localizedErr = isDup ? getDuplicateErrorMessageForDeptField("owningdepartmentname", t) : globalMessage;

          if (lowerKey.includes("name") || lowerKey.includes("department")) {
            fieldErrors.owningDepartmentName = localizedErr;
          } else if (lowerKey.includes("description")) {
            fieldErrors.description = globalMessage;
          }
        }
      }
    } catch {
      // Ignore parse failure
    }
  }

  if (Object.keys(fieldErrors).length === 0) {
    const lowerMsg = rawMsg.toLowerCase();
    if (
      statusCode === 409 ||
      lowerMsg.includes("duplicate") ||
      lowerMsg.includes("already exist") ||
      lowerMsg.includes("already exists") ||
      lowerMsg.includes("owningdepartment_duplicate")
    ) {
      fieldErrors.owningDepartmentName = getDuplicateErrorMessageForDeptField("owningdepartmentname", t);
    }
  }

  return {
    fieldErrors,
    globalMessage,
  };
}

function getDuplicateErrorMessageForDeptField(
  _fieldKey: string,
  t: (key: string) => string
): string {
  try {
    const nameDup = t("form.validation.departmentNameDuplicate");
    if (nameDup && nameDup !== "form.validation.departmentNameDuplicate" && !nameDup.includes("form.validation")) {
      return nameDup;
    }
  } catch {}

  try {
    const deptDup = t("apiErrors.OwningDepartment_Duplicate");
    if (deptDup && deptDup !== "apiErrors.OwningDepartment_Duplicate" && !deptDup.includes("apiErrors")) {
      return deptDup;
    }
  } catch {}

  try {
    const dup = t("form.messages.duplicate");
    if (dup && dup !== "form.messages.duplicate" && !dup.includes("form.messages")) {
      return dup;
    }
  } catch {}

  return "Owning department name already exists";
}
