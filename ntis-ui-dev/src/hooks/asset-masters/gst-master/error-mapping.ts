import { mapSharedApiError, parseReferenceBlockedMessage, SharedErrorMapOptions } from "@/lib/utils/asset-utils/shared-error-mapping";
import type { GstMasterFormModel } from "@/types/asset-masters/gst-master.types";

/**
 * Maps GST Master backend API error responses to localized multi-lingual strings (en, mr, hi).
 */
export function getGstMasterErrorMessage(
  message: string | undefined,
  statusCode: number | undefined,
  t: (key: string, values?: Record<string, string | number | Date>) => string,
  tCommon: (key: string, values?: Record<string, string | number | Date>) => string,
  fallbackEntityName?: string
): string {
  let rawMsg = (message || "").trim();

  // 1. Handle JSON error payload (e.g. ValidationErrorResponse or ASP.NET ModelState format)
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

  // Reference check (DELETE, or PUT with isActive: false): "This GST cannot be deleted/deactivated because it is in use."
  const blocked = parseReferenceBlockedMessage(rawMsg);
  if (blocked) return t(`apiErrors.${blocked.operation}BlockedInUse`);

  const lowerMsg = rawMsg.toLowerCase();

  // 2. Duplicate detection (GST_TaxCode_Duplicate, GST_TaxName_Duplicate, "already exist", "duplicate", or HTTP 409)
  if (
    lowerMsg.includes("duplicate") ||
    lowerMsg.includes("already exist") ||
    lowerMsg.includes("already exists") ||
    lowerMsg.includes("gst_taxcode_duplicate") ||
    lowerMsg.includes("gst_taxname_duplicate") ||
    statusCode === 409
  ) {
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
      const taxCodeDup = t("apiErrors.GST_TaxCode_Duplicate");
      if (taxCodeDup && taxCodeDup !== "apiErrors.GST_TaxCode_Duplicate" && !taxCodeDup.includes("apiErrors.GST_TaxCode_Duplicate")) {
        return taxCodeDup;
      }
    } catch {}
  }

  // 3. Fallback to mapSharedApiError for standard status code errors
  return mapSharedApiError({
    message: rawMsg || message,
    statusCode,
    t: t as SharedErrorMapOptions["t"],
    tCommon: tCommon as SharedErrorMapOptions["tCommon"],
    fallbackEntityName: fallbackEntityName || t("title"),
  });
}

export interface GstMasterApiErrorResult {
  fieldErrors: Partial<Record<keyof GstMasterFormModel, string>>;
  globalMessage: string;
}

/**
 * Parses backend API errors and returns both specific field-level errors (e.g. taxCode, taxName) and global toast message.
 */
export function parseGstMasterApiErrors(
  message: string | undefined,
  statusCode: number | undefined,
  t: (key: string, values?: Record<string, string | number | Date>) => string,
  tCommon: (key: string, values?: Record<string, string | number | Date>) => string
): GstMasterApiErrorResult {
  const globalMessage = getGstMasterErrorMessage(message, statusCode, t, tCommon);

  // Deactivating a GST that is in use: show the reason under the status toggle.
  if (parseReferenceBlockedMessage(message)?.operation === "deactivate") {
    return { fieldErrors: { isActive: globalMessage }, globalMessage };
  }

  const fieldErrors: Partial<Record<keyof GstMasterFormModel, string>> = {};

  const rawMsg = (message || "").trim();

  if (rawMsg.startsWith("{") && rawMsg.endsWith("}")) {
    try {
      const parsed = JSON.parse(rawMsg);
      if (parsed.errors && typeof parsed.errors === "object") {
        for (const [key, errVal] of Object.entries(parsed.errors)) {
          const lowerKey = key.toLowerCase();
          const errTextLower = (Array.isArray(errVal) ? String(errVal[0] || "") : String(errVal || "")).toLowerCase();
          const isDup = errTextLower.includes("duplicate") || errTextLower.includes("already exist") || errTextLower.includes("already exists") || errTextLower.includes("gst_taxcode_duplicate") || errTextLower.includes("gst_taxname_duplicate") || statusCode === 409;
          const localizedErr = isDup ? getDuplicateErrorMessageForField(lowerKey, t) : globalMessage;

          if (lowerKey.includes("code") || lowerKey === "taxcode") {
            fieldErrors.taxCode = localizedErr;
          } else if (lowerKey.includes("name") || lowerKey === "taxname") {
            fieldErrors.taxName = localizedErr;
          } else if (lowerKey.includes("percent") || lowerKey === "taxpercentage") {
            fieldErrors.taxPercentage = localizedErr;
          } else if (lowerKey.includes("effectivefrom")) {
            fieldErrors.effectiveFromDate = localizedErr;
          } else if (lowerKey.includes("effectiveto")) {
            fieldErrors.effectiveToDate = localizedErr;
          }
        }
      }
    } catch {
      // Ignore JSON parse failure
    }
  }

  // Fallback field error binding if JSON parsing did not return explicit field mapping
  if (Object.keys(fieldErrors).length === 0) {
    const lowerMsg = rawMsg.toLowerCase();
    if (
      statusCode === 409 ||
      lowerMsg.includes("duplicate") ||
      lowerMsg.includes("already exist") ||
      lowerMsg.includes("already exists") ||
      lowerMsg.includes("gst_taxcode_duplicate") ||
      lowerMsg.includes("gst_taxname_duplicate")
    ) {
      if (lowerMsg.includes("code") || lowerMsg.includes("taxcode")) {
        fieldErrors.taxCode = getDuplicateErrorMessageForField("taxcode", t);
      }
      if (lowerMsg.includes("name") || lowerMsg.includes("taxname") || lowerMsg.includes("description")) {
        fieldErrors.taxName = getDuplicateErrorMessageForField("taxname", t);
      }
      if (Object.keys(fieldErrors).length === 0) {
        // Generic duplicate message (e.g. "This record already exists"):
        // Assign to taxName because when user retains existing name and submits a new code,
        // taxName is the conflicting existing field.
        fieldErrors.taxName = getDuplicateErrorMessageForField("taxname", t);
      }
    }
  }

  return {
    fieldErrors,
    globalMessage,
  };
}

function getDuplicateErrorMessageForField(
  fieldKey: string,
  t: (key: string) => string
): string {
  if (fieldKey.includes("name") || fieldKey === "taxname") {
    try {
      const nameDup = t("form.validation.taxNameDuplicate");
      if (nameDup && nameDup !== "form.validation.taxNameDuplicate" && !nameDup.includes("form.validation")) {
        return nameDup;
      }
    } catch {}
    return "Tax name already exists";
  }

  try {
    const codeDup = t("form.validation.taxCodeDuplicate");
    if (codeDup && codeDup !== "form.validation.taxCodeDuplicate" && !codeDup.includes("form.validation")) {
      return codeDup;
    }
  } catch {}

  try {
    const codeDup = t("apiErrors.GST_TaxCode_Duplicate");
    if (codeDup && codeDup !== "apiErrors.GST_TaxCode_Duplicate" && !codeDup.includes("apiErrors")) {
      return codeDup;
    }
  } catch {}

  try {
    const dup = t("form.messages.duplicate");
    if (dup && dup !== "form.messages.duplicate" && !dup.includes("form.messages")) {
      return dup;
    }
  } catch {}

  return "Tax code already exists";
}
