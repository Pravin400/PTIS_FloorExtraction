import {
  mapSharedApiError,
  parseReferenceBlockedMessage,
  SharedErrorMapOptions,
  translateReferenceBlockedMessage,
} from "@/lib/utils/asset-utils/shared-error-mapping";
import type { GrievanceWorkflowStageMasterFormModel } from "@/types/asset-masters/grievance-workflow-stage-master.types";

export function extractRawErrorMessage(message: string | undefined): string {
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
      // Keep rawMsg
    }
  }

  return rawMsg;
}

export function getGrievanceWorkflowStageMasterErrorMessage(
  message: string | undefined,
  statusCode: number | undefined,
  t: (key: string, values?: Record<string, string | number | Date>) => string,
  tCommon: (key: string, values?: Record<string, string | number | Date>) => string,
  fallbackEntityName?: string
): string {
  const rawMsg = extractRawErrorMessage(message);

  if (statusCode === 401 || rawMsg === "UNAUTHORIZED" || rawMsg.toLowerCase().includes("unauthorized")) {
    return tCommon("errors.unauthorized") || "You are not authorized";
  }

  if (statusCode === 400 && (rawMsg === "INVALID_ID" || rawMsg.includes("Valid Grievance Workflow Stage Master ID"))) {
    return tCommon("validation.invalidId") || tCommon("errors.invalidId") || "Valid ID is required";
  }

  const referenceBlocked = translateReferenceBlockedMessage(rawMsg, t, {
    entities: {
      "Workflow Stage": "apiErrors.referenceBlocked.workflowStage",
      "Grievance Workflow Stage": "apiErrors.referenceBlocked.workflowStage",
    },
    masters: {
      "Stage Access Control": "apiErrors.referenceMasters.stageAccessControl",
      "Stage Access Controls": "apiErrors.referenceMasters.stageAccessControl",
    },
    andKey: "apiErrors.referenceMasters.and",
  });
  if (referenceBlocked) return referenceBlocked;

  const blocked = parseReferenceBlockedMessage(rawMsg);
  if (blocked) return t(`apiErrors.${blocked.operation}BlockedInUse`);

  const lowerMsg = (message ? message + " " + rawMsg : rawMsg).toLowerCase();

  const isExplicitDuplicate =
    lowerMsg.includes("duplicate") ||
    lowerMsg.includes("already exist") ||
    lowerMsg.includes("already exists") ||
    lowerMsg.includes("grievanceworkflowstage_stagecode_duplicate") ||
    lowerMsg.includes("grievanceworkflowstage_stagename_duplicate") ||
    lowerMsg.includes("grievanceworkflowstage_stageorder_duplicate");

  const isInUseOrReferenced =
    lowerMsg.includes("in use") ||
    lowerMsg.includes("reference") ||
    lowerMsg.includes("foreign key") ||
    lowerMsg.includes("associated") ||
    lowerMsg.includes("delete");

  // If a 409 Conflict occurs with reference / in-use indicators, report blocked in-use
  if (statusCode === 409 && isInUseOrReferenced && !isExplicitDuplicate) {
    try {
      const inUseMsg = t("apiErrors.deleteBlockedInUse") || t("apiErrors.inUse");
      if (inUseMsg && !inUseMsg.includes("apiErrors.")) return inUseMsg;
    } catch {}
    return "This workflow stage cannot be deleted because it is in use.";
  }

  if (isExplicitDuplicate || statusCode === 409) {
    const hasCodeDup =
      lowerMsg.includes("stagecode") ||
      lowerMsg.includes("stage_code") ||
      lowerMsg.includes("stage code") ||
      lowerMsg.includes("grievanceworkflowstage_stagecode_duplicate");

    const hasNameDup =
      lowerMsg.includes("stagename") ||
      lowerMsg.includes("stage_name") ||
      lowerMsg.includes("stage name") ||
      lowerMsg.includes("grievanceworkflowstage_stagename_duplicate");

    const hasOrderDup =
      lowerMsg.includes("stageorder") ||
      lowerMsg.includes("stage_order") ||
      lowerMsg.includes("stage order") ||
      lowerMsg.includes("grievanceworkflowstage_stageorder_duplicate") ||
      lowerMsg.includes("stage order '");

    // All three duplicate
    if (hasCodeDup && hasNameDup && hasOrderDup) {
      try {
        const allDup = t("form.validation.stageAllDuplicate");
        if (allDup && !allDup.includes("form.validation")) return allDup;
      } catch {}
    }

    // Code & Order duplicate
    if (hasCodeDup && hasOrderDup) {
      try {
        const codeOrderDup = t("form.validation.stageCodeAndStageOrderDuplicate");
        if (codeOrderDup && !codeOrderDup.includes("form.validation")) return codeOrderDup;
      } catch {}
    }

    // Code & Name duplicate
    if (hasCodeDup && hasNameDup) {
      try {
        const codeNameDup = t("form.validation.stageCodeAndStageNameDuplicate");
        if (codeNameDup && !codeNameDup.includes("form.validation")) return codeNameDup;
      } catch {}
    }

    // Name & Order duplicate
    if (hasNameDup && hasOrderDup) {
      try {
        const nameOrderDup = t("form.validation.stageNameAndStageOrderDuplicate");
        if (nameOrderDup && !nameOrderDup.includes("form.validation")) return nameOrderDup;
      } catch {}
    }

    // Single field duplicate
    if (hasCodeDup) {
      try {
        const codeDup = t("form.validation.stageCodeDuplicate");
        if (codeDup && codeDup !== "form.validation.stageCodeDuplicate" && !codeDup.includes("form.validation")) {
          return codeDup;
        }
      } catch {}
    }

    if (hasNameDup) {
      try {
        const nameDup = t("form.validation.stageNameDuplicate");
        if (nameDup && nameDup !== "form.validation.stageNameDuplicate" && !nameDup.includes("form.validation")) {
          return nameDup;
        }
      } catch {}
    }

    if (hasOrderDup) {
      try {
        const orderDup = t("form.validation.stageOrderDuplicate");
        if (orderDup && orderDup !== "form.validation.stageOrderDuplicate" && !orderDup.includes("form.validation")) {
          return orderDup;
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
      const apiDup = t("apiErrors.GrievanceWorkflowStage_StageCode_Duplicate");
      if (apiDup && apiDup !== "apiErrors.GrievanceWorkflowStage_StageCode_Duplicate") {
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

export interface GrievanceWorkflowStageMasterApiErrorResult {
  fieldErrors: Partial<Record<keyof GrievanceWorkflowStageMasterFormModel, string>>;
  globalMessage: string;
}

export function parseGrievanceWorkflowStageMasterApiErrors(
  message: string | unknown,
  statusCode: number | undefined,
  t: (key: string, values?: Record<string, string | number | Date>) => string,
  tCommon: (key: string, values?: Record<string, string | number | Date>) => string
): GrievanceWorkflowStageMasterApiErrorResult {
  const strMessage = typeof message === "string" ? message : undefined;
  const rawMsg = extractRawErrorMessage(strMessage);
  const globalMessage = getGrievanceWorkflowStageMasterErrorMessage(strMessage, statusCode, t, tCommon);

  if (parseReferenceBlockedMessage(rawMsg)?.operation === "deactivate") {
    return { fieldErrors: { isActive: globalMessage }, globalMessage };
  }

  const fieldErrors: Partial<Record<keyof GrievanceWorkflowStageMasterFormModel, string>> = {};
  const trimmedMsg = (strMessage || "").trim();

  // If a fieldErrors record was provided directly (e.g. from server action validation)
  if (typeof message === "object" && message !== null) {
    const rawObj = message as Record<string, unknown>;
    if (rawObj.fieldErrors && typeof rawObj.fieldErrors === "object") {
      const errMap = rawObj.fieldErrors as Record<string, string>;
      for (const [fName, fCode] of Object.entries(errMap)) {
        if (fName === "stageCode") {
          fieldErrors.stageCode = fCode === "REQUIRED" ? t("form.validation.stageCodeRequired") : t("form.validation.stageCodeFormat");
        } else if (fName === "stageName") {
          fieldErrors.stageName = fCode === "REQUIRED" ? t("form.validation.stageNameRequired") : t("form.validation.stageNameFormat");
        } else if (fName === "stageOrder") {
          fieldErrors.stageOrder = fCode === "REQUIRED" ? t("form.validation.stageOrderRequired") : t("form.validation.stageOrderInvalid");
        } else if (fName === "status") {
          fieldErrors.status = fCode === "REQUIRED" ? t("form.validation.statusRequired") : t("form.validation.statusFormat");
        }
      }
    }
  }

  if (trimmedMsg.startsWith("{") && trimmedMsg.endsWith("}")) {
    try {
      const parsed = JSON.parse(trimmedMsg);
      if (parsed.errors && typeof parsed.errors === "object") {
        for (const [key, errVal] of Object.entries(parsed.errors)) {
          const lowerKey = key.toLowerCase();
          const errTextLower = (Array.isArray(errVal) ? String(errVal[0] || "") : String(errVal || "")).toLowerCase();
          const isDup =
            errTextLower.includes("duplicate") ||
            errTextLower.includes("already exist") ||
            errTextLower.includes("already exists") ||
            errTextLower.includes("grievanceworkflowstage_stagecode_duplicate") ||
            errTextLower.includes("grievanceworkflowstage_stagename_duplicate") ||
            errTextLower.includes("grievanceworkflowstage_stageorder_duplicate") ||
            statusCode === 409;

          if (lowerKey.includes("stagecode") || (lowerKey.includes("code") && !lowerKey.includes("order"))) {
            fieldErrors.stageCode = isDup
              ? t("form.validation.stageCodeDuplicate") || t("form.validation.duplicate")
              : globalMessage;
          } else if (lowerKey.includes("ulbtype")) {
            fieldErrors.ulbTypeId = globalMessage;
          } else if (lowerKey.includes("stagename") || (lowerKey.includes("name") && !lowerKey.includes("code"))) {
            fieldErrors.stageName = isDup
              ? t("form.validation.stageNameDuplicate") || t("form.validation.duplicate")
              : globalMessage;
          } else if (lowerKey.includes("stageorder") || lowerKey.includes("order")) {
            fieldErrors.stageOrder = isDup
              ? t("form.validation.stageOrderDuplicate") || t("form.validation.duplicate")
              : globalMessage;
          }
        }
      }
    } catch {
      // Ignore
    }
  }

  if (Object.keys(fieldErrors).length === 0) {
    const lowerMsg = rawMsg.toLowerCase();
    if (
      statusCode === 409 ||
      lowerMsg.includes("duplicate") ||
      lowerMsg.includes("already exist") ||
      lowerMsg.includes("already exists") ||
      lowerMsg.includes("a record with the same details already exists") ||
      lowerMsg.includes("grievanceworkflowstage_stagecode_duplicate") ||
      lowerMsg.includes("grievanceworkflowstage_stagename_duplicate") ||
      lowerMsg.includes("grievanceworkflowstage_stageorder_duplicate")
    ) {
      if (
        lowerMsg.includes("stagecode") ||
        lowerMsg.includes("stage_code") ||
        lowerMsg.includes("stage code") ||
        lowerMsg.includes("grievanceworkflowstage_stagecode_duplicate")
      ) {
        fieldErrors.stageCode = t("form.validation.stageCodeDuplicate") || t("form.validation.duplicate");
      }
      if (
        lowerMsg.includes("stagename") ||
        lowerMsg.includes("stage_name") ||
        lowerMsg.includes("stage name") ||
        lowerMsg.includes("grievanceworkflowstage_stagename_duplicate")
      ) {
        fieldErrors.stageName = t("form.validation.stageNameDuplicate") || t("form.validation.duplicate");
      }
      if (
        lowerMsg.includes("stageorder") ||
        lowerMsg.includes("stage_order") ||
        lowerMsg.includes("stage order") ||
        lowerMsg.includes("grievanceworkflowstage_stageorder_duplicate") ||
        lowerMsg.includes("stage order '")
      ) {
        fieldErrors.stageOrder = t("form.validation.stageOrderDuplicate") || t("form.validation.duplicate");
      }
    }
  }

  return {
    fieldErrors,
    globalMessage,
  };
}
