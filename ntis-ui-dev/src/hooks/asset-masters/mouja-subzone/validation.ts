import {
  validateForm,
  commonValidations
} from "@/lib/utils/validation";
import {
  ASSET_MOUJA_NO_REGEX,
  ASSET_MOUJA_NO_SANITIZE,
  ASSET_SUBZONE_NO_REGEX,
  ASSET_SUBZONE_NO_SANITIZE,
  NAME_ONLY_REGEX,
  NAME_ONLY_SANITIZE
} from "@/lib/utils/asset-validation-rules";
import { MoujaFormModel, SubZoneFormModel } from "@/types/asset-masters/mouja-subzone.types";
import { mapSharedApiError, parseReferenceBlockedMessage } from "@/lib/utils/asset-utils/shared-error-mapping";

export const CODE_MAX = 20;
export const NAME_MAX = 100;

export const sanitizeMoujaFieldValue = (name: string, value: string): string => {
  let sanitizedValue = value;
  if (name === "moujaName") {
    sanitizedValue = value.replace(NAME_ONLY_SANITIZE, "").trimStart().replace(/\s{2,}/g, " ");
    if (sanitizedValue.length > NAME_MAX) {
      sanitizedValue = sanitizedValue.substring(0, NAME_MAX);
    }
  } else if (name === "moujaNo") {
    sanitizedValue = value.replace(ASSET_MOUJA_NO_SANITIZE, "").toUpperCase();
    if (sanitizedValue.length > CODE_MAX) {
      sanitizedValue = sanitizedValue.substring(0, CODE_MAX);
    }
  }
  return sanitizedValue;
};

export const sanitizeSubZoneFieldValue = (name: string, value: string): string => {
  let sanitizedValue = value;
  if (name === "subZoneName") {
    sanitizedValue = value.replace(NAME_ONLY_SANITIZE, "").trimStart().replace(/\s{2,}/g, " ");
    if (sanitizedValue.length > NAME_MAX) {
      sanitizedValue = sanitizedValue.substring(0, NAME_MAX);
    }
  } else if (name === "subZoneNo") {
    sanitizedValue = value.replace(ASSET_SUBZONE_NO_SANITIZE, "").toUpperCase();
    if (sanitizedValue.length > CODE_MAX) {
      sanitizedValue = sanitizedValue.substring(0, CODE_MAX);
    }
  }
  return sanitizedValue;
};

export const validateMoujaForm = (
  data: MoujaFormModel,
  t: (key: string, values?: Record<string, string | number | Date>) => string,
  isEdit: boolean
): Partial<Record<keyof MoujaFormModel, string>> => {
  const schema = {
    moujaNo: (val: unknown) => {
      const strVal = String(val ?? "").trim();
      if (!strVal) return t("form.validation.moujaNoRequired");
      if (strVal.length > CODE_MAX) return t("form.validation.moujaNoMaxLength", { count: CODE_MAX });
      if (!ASSET_MOUJA_NO_REGEX.test(strVal)) return t("form.validation.moujaNoFormat");
      return undefined;
    },
    moujaName: (val: unknown) => {
      const str = String(val ?? "").trim();
      if (!str) return t("form.validation.moujaNameRequired");
      if (str.length > NAME_MAX) return t("form.validation.moujaNameMaxLength", { count: NAME_MAX });
      if (!NAME_ONLY_REGEX.test(str)) return t("form.validation.moujaNameFormat");
      return undefined;
    },
    isActive: commonValidations.masterActiveStatus(t, isEdit, "form.validation.mustBeActive"),
  };
  return validateForm(data, schema);
};

export const validateSubZoneForm = (
  data: SubZoneFormModel,
  t: (key: string, values?: Record<string, string | number | Date>) => string,
  isEdit: boolean
): Partial<Record<keyof SubZoneFormModel, string>> => {
  const schema = {
    moujaId: (val: unknown) => {
      const n = typeof val === "number" ? val : Number(val);
      if (!Number.isFinite(n) || n <= 0) return t("form.validation.moujaRequired");
      return undefined;
    },
    subZoneNo: (val: unknown) => {
      const strVal = String(val ?? "").trim();
      if (!strVal) return t("form.validation.subZoneNoRequired");
      if (strVal.length > CODE_MAX) return t("form.validation.subZoneNoMaxLength", { count: CODE_MAX });
      if (!ASSET_SUBZONE_NO_REGEX.test(strVal)) return t("form.validation.subZoneNoFormat");
      return undefined;
    },
    subZoneName: (val: unknown) => {
      const str = String(val ?? "").trim();
      if (!str) return t("form.validation.subZoneNameRequired");
      if (str.length > NAME_MAX) return t("form.validation.subZoneNameMaxLength", { count: NAME_MAX });
      if (!NAME_ONLY_REGEX.test(str)) return t("form.validation.subZoneNameFormat");
      return undefined;
    },
    isActive: commonValidations.masterActiveStatus(t, isEdit, "form.validation.mustBeActive"),
  };
  return validateForm(data, schema);
};

// Reference check (DELETE, or PUT with isActive: false), keyed by the backend's display name and operation:
//   "This Mouja cannot be deleted because it has Sub Zones. Please delete all Sub Zones for this Mouja first."
//   "This Sub Zone cannot be deleted because it has CV Rates. Please delete all CV Rates for this Sub Zone first."
const REFERENCE_BLOCKED_KEYS: Record<string, string> = {
  "Mouja:delete": "apiErrors.moujaDeleteBlocked",
  "Mouja:deactivate": "apiErrors.moujaDeactivateBlocked",
  "Sub Zone:delete": "apiErrors.subZoneDeleteBlocked",
  "Sub Zone:deactivate": "apiErrors.subZoneDeactivateBlocked",
};

function getReferenceBlockedKey(message: string | undefined): string | undefined {
  const blocked = parseReferenceBlockedMessage(message);
  return blocked ? REFERENCE_BLOCKED_KEYS[`${blocked.entity}:${blocked.operation}`] : undefined;
}

/** True when the backend refused to deactivate the record because other records still use it. */
export function isDeactivateBlockedMessage(message: string | undefined): boolean {
  return parseReferenceBlockedMessage(message)?.operation === "deactivate";
}

export function getErrorMessage(
  message: string | undefined,
  statusCode: number | undefined,
  t: (key: string, values?: Record<string, string | number | Date>) => string,
  tCommon: (key: string, values?: Record<string, string | number | Date>) => string,
  fallbackEntityName: string
): string {
  const referenceBlockedKey = getReferenceBlockedKey(message);
  if (referenceBlockedKey) return t(referenceBlockedKey);

  return mapSharedApiError({
    message,
    statusCode,
    t,
    tCommon,
    fallbackEntityName,
  });
}



