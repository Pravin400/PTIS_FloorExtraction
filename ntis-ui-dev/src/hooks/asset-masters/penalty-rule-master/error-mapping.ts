import {
  mapSharedApiError,
  parseReferenceBlockedMessage,
  SharedErrorMapOptions,
  translateReferenceBlockedMessage,
} from "@/lib/utils/asset-utils/shared-error-mapping";
import type { PenaltyRuleFormModel } from "@/types/asset-masters/penalty-rule-master.types";

/**
 * Maps Penalty Rule Master backend API error responses to localized multi-lingual strings (en, mr, hi).
 */
export function getPenaltyRuleErrorMessage(
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
      const parts: string[] = [];
      if (typeof parsed.message === "string" && parsed.message.trim()) {
        parts.push(parsed.message.trim());
      }
      if (parsed.errors && typeof parsed.errors === "object") {
        for (const errList of Object.values(parsed.errors)) {
          if (Array.isArray(errList)) {
            parts.push(...errList.map(String));
          } else if (errList) {
            parts.push(String(errList));
          }
        }
      }
      if (parts.length > 0) {
        rawMsg = parts.join(" ");
      }
    } catch {
      // Keep rawMsg as is if parsing fails
    }
  }

  // Reference check (DELETE, or PUT with isActive: false):
  //   "This Penalty Rule cannot be deleted/deactivated because it is in use."
  const referenceBlocked = translateReferenceBlockedMessage(rawMsg, t, {
    entities: { "Penalty Rule": "apiErrors.referenceBlocked.penaltyRule" },
  });
  if (referenceBlocked) return referenceBlocked;

  const lowerMsg = rawMsg.toLowerCase();

  // 2. Duplicate detection (penaltyrule_code_duplicate, penaltyrule_name_duplicate, "already exist", "duplicate", or HTTP 409)
  if (
    lowerMsg.includes("duplicate") ||
    lowerMsg.includes("already exist") ||
    lowerMsg.includes("already exists") ||
    lowerMsg.includes("penaltyrule_code_duplicate") ||
    lowerMsg.includes("penaltyrule_name_duplicate") ||
    statusCode === 409
  ) {
    const hasCodeDup =
      lowerMsg.includes("code") ||
      lowerMsg.includes("penaltycode") ||
      lowerMsg.includes("penaltyrule_code_duplicate");

    const hasNameDup =
      lowerMsg.includes("name") ||
      lowerMsg.includes("penaltyname") ||
      lowerMsg.includes("penaltyrule_name_duplicate");

    // Both code and name duplicate at the same time:
    if (hasCodeDup && hasNameDup) {
      try {
        const bothDup = t("apiErrors.Penaltyrule_Both_Duplicate");
        if (bothDup && bothDup !== "apiErrors.Penaltyrule_Both_Duplicate" && !bothDup.includes("apiErrors")) {
          return bothDup;
        }
      } catch {}

      let codeMsg = "";
      try {
        const c = t("apiErrors.Penaltyrule_Code_Duplicate");
        if (c && c !== "apiErrors.Penaltyrule_Code_Duplicate" && !c.includes("apiErrors")) codeMsg = c;
      } catch {}
      if (!codeMsg) {
        try {
          const c = t("form.validation.penaltyCodeDuplicate");
          if (c && c !== "form.validation.penaltyCodeDuplicate" && !c.includes("form.validation")) codeMsg = c;
        } catch {}
      }

      let nameMsg = "";
      try {
        const n = t("apiErrors.Penaltyrule_Name_Duplicate");
        if (n && n !== "apiErrors.Penaltyrule_Name_Duplicate" && !n.includes("apiErrors")) nameMsg = n;
      } catch {}
      if (!nameMsg) {
        try {
          const n = t("form.validation.penaltyNameDuplicate");
          if (n && n !== "form.validation.penaltyNameDuplicate" && !n.includes("form.validation")) nameMsg = n;
        } catch {}
      }

      if (codeMsg && nameMsg) {
        return `${codeMsg}. ${nameMsg}`;
      } else if (codeMsg) {
        return codeMsg;
      } else if (nameMsg) {
        return nameMsg;
      }
    }

    if (hasCodeDup) {
      try {
        const penaltyCodeDup = t("apiErrors.Penaltyrule_Code_Duplicate");
        if (penaltyCodeDup && penaltyCodeDup !== "apiErrors.Penaltyrule_Code_Duplicate" && !penaltyCodeDup.includes("apiErrors")) {
          return penaltyCodeDup;
        }
      } catch {}
      try {
        const codeValid = t("form.validation.penaltyCodeDuplicate");
        if (codeValid && codeValid !== "form.validation.penaltyCodeDuplicate" && !codeValid.includes("form.validation")) {
          return codeValid;
        }
      } catch {}
    }

    if (hasNameDup) {
      try {
        const penaltyNameDup = t("apiErrors.Penaltyrule_Name_Duplicate");
        if (penaltyNameDup && penaltyNameDup !== "apiErrors.Penaltyrule_Name_Duplicate" && !penaltyNameDup.includes("apiErrors")) {
          return penaltyNameDup;
        }
      } catch {}
      try {
        const nameValid = t("form.validation.penaltyNameDuplicate");
        if (nameValid && nameValid !== "form.validation.penaltyNameDuplicate" && !nameValid.includes("form.validation")) {
          return nameValid;
        }
      } catch {}
    }

    try {
      const formDup = t("form.messages.duplicate");
      if (formDup && formDup !== "form.messages.duplicate" && !formDup.includes("form.messages")) {
        return formDup;
      }
    } catch {}
    try {
      const apiDup = t("apiErrors.duplicateRecord");
      if (apiDup && apiDup !== "apiErrors.duplicateRecord" && !apiDup.includes("apiErrors")) {
        return apiDup;
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

export interface PenaltyRuleApiErrorResult {
  fieldErrors: Partial<Record<keyof PenaltyRuleFormModel, string>>;
  globalMessage: string;
}

/**
 * Parses backend API errors and returns both specific field-level errors (e.g. penaltyCode, penaltyName) and global toast message.
 */
export function parsePenaltyRuleApiErrors(
  message: string | undefined,
  statusCode: number | undefined,
  t: (key: string, values?: Record<string, string | number | Date>) => string,
  tCommon: (key: string, values?: Record<string, string | number | Date>) => string
): PenaltyRuleApiErrorResult {
  const globalMessage = getPenaltyRuleErrorMessage(message, statusCode, t, tCommon);

  // Deactivating a Penalty Rule that is in use: show the reason under the status toggle.
  if (parseReferenceBlockedMessage(message)?.operation === "deactivate") {
    return { fieldErrors: { isActive: globalMessage }, globalMessage };
  }

  const fieldErrors: Partial<Record<keyof PenaltyRuleFormModel, string>> = {};

  let rawMsg = (message || "").trim();

  if (rawMsg.startsWith("{") && rawMsg.endsWith("}")) {
    try {
      const parsed = JSON.parse(rawMsg);
      const parts: string[] = [];
      if (typeof parsed.message === "string" && parsed.message.trim()) {
        parts.push(parsed.message.trim());
      }
      if (parsed.errors && typeof parsed.errors === "object") {
        for (const [key, errVal] of Object.entries(parsed.errors)) {
          const lowerKey = key.toLowerCase();
          const errTextRaw = Array.isArray(errVal) ? String(errVal[0] || "") : String(errVal || "");
          if (errTextRaw) parts.push(errTextRaw);
          const errTextLower = errTextRaw.toLowerCase();
          const isDup = errTextLower.includes("duplicate") || errTextLower.includes("already exist") || errTextLower.includes("already exists") || errTextLower.includes("penaltyrule_code_duplicate") || errTextLower.includes("penaltyrule_name_duplicate") || statusCode === 409;
          const localizedErr = isDup ? getDuplicateErrorMessageForPenaltyField(lowerKey, t) : globalMessage;

          if (lowerKey.includes("code") || lowerKey === "penaltycode") {
            fieldErrors.penaltyCode = localizedErr;
          } else if (lowerKey.includes("name") || lowerKey === "penaltyname") {
            fieldErrors.penaltyName = localizedErr;
          } else if (
            lowerKey.includes("percent") ||
            lowerKey.includes("value") ||
            lowerKey === "penaltypercentage" ||
            lowerKey === "penaltyvalue"
          ) {
            fieldErrors.penaltyValue = localizedErr;
          } else if (lowerKey.includes("calculation") || lowerKey === "calculationtype") {
            fieldErrors.calculationType = localizedErr;
          } else if (lowerKey.includes("grace") || lowerKey === "graceperioddays") {
            fieldErrors.gracePeriodDays = localizedErr;
          }
        }
      }
      if (parts.length > 0) {
        rawMsg = parts.join(" ");
      }
    } catch {
      // Ignore parse failure
    }
  }

  const lowerMsg = rawMsg.toLowerCase();
  const isDuplicate =
    statusCode === 409 ||
    lowerMsg.includes("duplicate") ||
    lowerMsg.includes("already exist") ||
    lowerMsg.includes("already exists") ||
    lowerMsg.includes("penaltyrule_code_duplicate") ||
    lowerMsg.includes("penaltyrule_name_duplicate");

  if (isDuplicate) {
    const hasCode =
      lowerMsg.includes("code") ||
      lowerMsg.includes("penaltycode") ||
      lowerMsg.includes("penaltyrule_code_duplicate");

    const hasName =
      lowerMsg.includes("name") ||
      lowerMsg.includes("penaltyname") ||
      lowerMsg.includes("penaltyrule_name_duplicate") ||
      lowerMsg.includes("description");

    if (hasCode && !fieldErrors.penaltyCode) {
      fieldErrors.penaltyCode = getDuplicateErrorMessageForPenaltyField("penaltycode", t);
    }
    if (hasName && !fieldErrors.penaltyName) {
      fieldErrors.penaltyName = getDuplicateErrorMessageForPenaltyField("penaltyname", t);
    }
    if (!hasCode && !hasName && Object.keys(fieldErrors).length === 0) {
      // Generic duplicate message (e.g. "This record already exists"):
      fieldErrors.penaltyName = getDuplicateErrorMessageForPenaltyField("penaltyname", t);
    }
  }

  return {
    fieldErrors,
    globalMessage,
  };
}

function getDuplicateErrorMessageForPenaltyField(
  fieldKey: string,
  t: (key: string) => string
): string {
  if (fieldKey.includes("name") || fieldKey === "penaltyname") {
    try {
      const nameDup = t("form.validation.penaltyNameDuplicate");
      if (nameDup && nameDup !== "form.validation.penaltyNameDuplicate" && !nameDup.includes("form.validation")) {
        return nameDup;
      }
    } catch {}
    try {
      const nameApiDup = t("apiErrors.Penaltyrule_Name_Duplicate");
      if (nameApiDup && nameApiDup !== "apiErrors.Penaltyrule_Name_Duplicate" && !nameApiDup.includes("apiErrors")) {
        return nameApiDup;
      }
    } catch {}
    return "Penalty name already exists";
  }

  try {
    const codeDup = t("form.validation.penaltyCodeDuplicate");
    if (codeDup && codeDup !== "form.validation.penaltyCodeDuplicate" && !codeDup.includes("form.validation")) {
      return codeDup;
    }
  } catch {}

  try {
    const codeDup = t("apiErrors.Penaltyrule_Code_Duplicate");
    if (codeDup && codeDup !== "apiErrors.Penaltyrule_Code_Duplicate" && !codeDup.includes("apiErrors")) {
      return codeDup;
    }
  } catch {}

  try {
    const dup = t("form.messages.duplicate");
    if (dup && dup !== "form.messages.duplicate" && !dup.includes("form.messages")) {
      return dup;
    }
  } catch {}

  return "Penalty code already exists";
}
