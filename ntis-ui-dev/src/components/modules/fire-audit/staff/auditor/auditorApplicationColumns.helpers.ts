/**
 * Auditor Application Table Column Helpers & Translation Mappings
 * Path: src/components/modules/fire-audit/staff/auditor/auditorApplicationColumns.helpers.ts
 *
 * Dedicated localization helper functions and dictionaries for column formatting.
 * Line ceiling: <= 300 lines.
 */

import {
  AUDITOR_STATUS,
  RISK_ALIASES,
  RISK_META,
} from "@/types/fire-audit/auditor.types";

export const STATUS_TRANSLATION_KEYS: Record<string, string> = {
  [AUDITOR_STATUS.SUBMITTED.toLowerCase()]: "auditorReportSubmitted",
  [AUDITOR_STATUS.PENDING_VERIFICATION.toLowerCase()]: "officerVerificationPending",
  [AUDITOR_STATUS.RETURNED.toLowerCase()]: "returnedForRectification",
  [AUDITOR_STATUS.RE_INSPECTION.toLowerCase()]: "reInspectionPending",
  [AUDITOR_STATUS.APPROVED.toLowerCase()]: "approved",
  [AUDITOR_STATUS.CERTIFICATE_ISSUED.toLowerCase()]: "certificateIssued",
  submitted: "auditorReportSubmitted",
  pending: "officerVerificationPending",
  returned: "returnedForRectification",
  "re-inspection": "reInspectionPending",
  reinspection: "reInspectionPending",
};

export const RISK_TRANSLATION_KEYS: Record<string, string> = {
  high: "high",
  medium: "medium",
  low: "low",
  unknown: "unknown",
};

export const APP_TYPE_TRANSLATION_KEYS: Record<string, string> = {
  "new fsc": "newFsc",
  "new audit": "newAudit",
  renewal: "renewal",
  "renewal audit": "renewalAudit",
  "periodic audit": "periodicAudit",
  unknown: "unknown",
};

export const BUILDING_TYPE_TRANSLATION_KEYS: Record<string, string> = {
  business: "business",
  institutional: "institutional",
  mercantile: "mercantile",
  commercial: "commercial",
  residential: "residential",
  healthcare: "healthcare",
  "healthcare / hospital": "healthcare",
  hospital: "healthcare",
  educational: "educational",
  assembly: "assembly",
  industrial: "industrial",
  storage: "storage",
  hazardous: "hazardous",
};

export function localizeValue(
  val: string | undefined,
  map: Record<string, string>,
  prefix: string,
  t: (k: string) => string,
  tSecondary?: (k: string) => string
): string {
  if (!val) return "";
  const key = map[val.toLowerCase().trim()];
  if (!key) return val;
  if (tSecondary) {
    try {
      const res = tSecondary(key);
      if (res && res !== key) return res;
    } catch {
      // fallback
    }
  }
  try {
    const res = t(`${prefix}.${key}`);
    if (res && res !== `${prefix}.${key}`) return res;
  } catch {
    // fallback
  }
  return val;
}

export const getLocalizedStatus = (
  status: string,
  t: (k: string) => string,
  tStatus?: (k: string) => string
) => localizeValue(status, STATUS_TRANSLATION_KEYS, "status", t, tStatus);

export const getLocalizedRiskCategory = (
  cat: string,
  t: (k: string) => string,
  tFields?: (k: string) => string
) => {
  const risk = RISK_ALIASES[cat] || "Low";
  const fieldKey = RISK_META[risk].translationKey;
  return localizeValue(cat, RISK_TRANSLATION_KEYS, "risk", t, tFields ? () => tFields(fieldKey) : undefined);
};

export const getLocalizedAppType = (
  appType: string,
  t: (k: string) => string,
  tFields?: (k: string) => string
) => localizeValue(appType, APP_TYPE_TRANSLATION_KEYS, "appTypes", t, tFields);

export const getLocalizedBuildingType = (
  type: string,
  t: (k: string) => string,
  tFields?: (k: string) => string
) => localizeValue(type, BUILDING_TYPE_TRANSLATION_KEYS, "buildingTypes", t, tFields);
