import { getSafeMessage } from "@/lib/utils/asset-utils/createSafeMasterTranslator";
import {
  parseReferenceBlockedMessage,
  translateReferenceBlockedMessage,
} from "@/lib/utils/asset-utils/shared-error-mapping";

/** True when the backend refused to deactivate the record because other records still use it. */
export function isDeactivateBlockedMessage(message: string | undefined): boolean {
  return parseReferenceBlockedMessage(message)?.operation === "deactivate";
}

export const mapOwnershipTypeApiError = (
  result: { statusCode?: number; message?: string; error?: string; success?: boolean },
  t: (key: string, values?: Record<string, string | number | Date>) => string,
  tCommon: (key: string, values?: Record<string, string | number | Date>) => string
): string => {
  // Reference check (DELETE, or PUT with isActive: false):
  //   "This Ownership Type cannot be deleted/deactivated because it is in use."
  const referenceBlocked = translateReferenceBlockedMessage(result.message || result.error, t, {
    entities: { "Ownership Type": "apiErrors.referenceBlocked.ownershipType" },
  });
  if (referenceBlocked) return referenceBlocked;

  const rawMsg = (result.message || result.error || "").replace(/\.$/, "");
  if (result.error === "duplicate" || rawMsg.toLowerCase().includes("duplicate") || rawMsg.toLowerCase().includes("already exists")) {
    return (
      getSafeMessage(t, "configuration.masterData.form.errors.nameDuplicate") ||
      getSafeMessage(t, "configuration.masterData.form.validation.duplicateRecord") ||
      getSafeMessage(t, "validation.duplicateRecord") ||
      getSafeMessage(t, "errors.duplicateRecord") ||
      "Record already exists."
    );
  }

  const errorMap: Record<number, string> = {
    409:
      getSafeMessage(t, "configuration.masterData.form.errors.nameDuplicate") ||
      getSafeMessage(t, "configuration.masterData.form.validation.duplicateRecord") ||
      getSafeMessage(t, "validation.duplicateRecord") ||
      "Record already exists.",
    404: tCommon("errors.notFound") || "Record not found.",
    401: tCommon("errors.unauthorized"),
    403: tCommon("errors.unauthorized"),
  };

  const code = result.statusCode ?? 0;
  if (errorMap[code]) return errorMap[code];

  if (code >= 500) return tCommon("errors.serverError") || "Server error occurred.";
  return result.message || result.error || tCommon("errors.generic") || "Operation failed.";
};
