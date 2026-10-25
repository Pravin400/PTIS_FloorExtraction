/**
 * Auditor Application and Dashboard Normalizers & Type Guards
 * Path: src/services/fire-audit/auditor.mapper.ts
 *
 * Runtime validation and mapping logic for fire audit applications and stats.
 * Line ceiling: <= 300 lines.
 */

import {
  AUDITOR_STATUS,
  STATUS_ALIASES,
  RISK_ALIASES,
  AUDITOR_APPLICATION_STATUSES,
  AUDITOR_RISK_CATEGORIES,
} from "@/constants/fire-audit/auditor.constants";
import type {
  AuditorApplication,
  AuditorApplicationType,
  AuditorDashboardStats,
} from "@/types/fire-audit/auditor.types";

export const APP_TYPE_ALIASES: Record<string, AuditorApplicationType> = {
  "New FSC": "New FSC",
  "new fsc": "New FSC",
  "New Audit": "New Audit",
  "new audit": "New Audit",
  Renewal: "Renewal",
  renewal: "Renewal",
  "Renewal Audit": "Renewal Audit",
  "renewal audit": "Renewal Audit",
  "Periodic Audit": "Periodic Audit",
  "periodic audit": "Periodic Audit",
  Unknown: "Unknown",
  unknown: "Unknown",
};

/**
 * Type guard for Auditor Application records.
 * Rejects corrupt records missing essential identification, building info, status, or risk.
 */
export function isAuditorApplicationShape(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;

  const hasValidId = typeof v.id === "string" && v.id.trim().length > 0;
  const hasValidBuilding = typeof v.buildingName === "string" && v.buildingName.trim().length > 0;

  if (!hasValidId || !hasValidBuilding) return false;

  // Reject records with missing or completely unrecognized status
  if (typeof v.status === "string" && v.status.trim().length > 0) {
    const normStatus = STATUS_ALIASES[v.status.trim()];
    if (!normStatus || !(AUDITOR_APPLICATION_STATUSES as readonly string[]).includes(normStatus)) {
      return false;
    }
  } else {
    return false;
  }

  // Reject records with missing or completely unrecognized risk category
  if (typeof v.riskCategory === "string" && v.riskCategory.trim().length > 0) {
    const normRisk = RISK_ALIASES[v.riskCategory.trim()];
    if (!normRisk || !(AUDITOR_RISK_CATEGORIES as readonly string[]).includes(normRisk)) {
      return false;
    }
  } else {
    return false;
  }

  return true;
}

/**
 * Normalizes raw application data into a strongly-typed AuditorApplication.
 * Missing/unrecognized riskCategory or appType are NEVER silently defaulted to Low or New FSC.
 */
export function normalizeAuditorApplication(data: unknown): AuditorApplication {
  const d = (typeof data === "object" && data !== null ? data : {}) as Record<string, unknown>;

  const rawRisk = typeof d.riskCategory === "string" ? d.riskCategory.trim() : "";
  const riskCategory = RISK_ALIASES[rawRisk] || "Unknown";

  const rawStatus = typeof d.status === "string" ? d.status.trim() : "";
  const status = STATUS_ALIASES[rawStatus] || AUDITOR_STATUS.PENDING_VERIFICATION;

  const rawAppType = typeof d.appType === "string" ? d.appType.trim() : "";
  const appType: AuditorApplicationType = APP_TYPE_ALIASES[rawAppType] || "Unknown";

  return {
    id: String(d.id || ""),
    appDate: String(d.appDate || ""),
    appType,
    buildingName: String(d.buildingName || ""),
    propertyId: String(d.propertyId || ""),
    applicant: String(d.applicant || ""),
    mobile: String(d.mobile || ""),
    email: String(d.email || ""),
    address: String(d.address || ""),
    node: String(d.node || ""),
    sector: String(d.sector || ""),
    wardNo: String(d.wardNo || ""),
    buildingType: String(d.buildingType || ""),
    occupancy: String(d.occupancy || ""),
    height: String(d.height || ""),
    floors: String(d.floors || ""),
    plotArea: String(d.plotArea || ""),
    builtupArea: String(d.builtupArea || ""),
    score: typeof d.score === "number" ? d.score : Number(d.score) || 0,
    days: String(d.days || "0 Days"),
    sla: typeof d.sla === "string" ? d.sla : typeof d.days === "string" ? d.days : undefined,
    slaDaysLeft:
      typeof d.slaDaysLeft === "number"
        ? d.slaDaysLeft
        : typeof d.daysLeft === "number"
          ? d.daysLeft
          : undefined,
    dueDate: String(d.dueDate || ""),
    riskCategory,
    auditor: String(d.auditor || ""),
    auditorId: String(d.auditorId || ""),
    auditorDesignation: String(d.auditorDesignation || ""),
    allocationDate: String(d.allocationDate || ""),
    inspectionDate: String(d.inspectionDate || ""),
    reportDate: String(d.reportDate || ""),
    reportNo: String(d.reportNo || ""),
    deficienciesCount:
      typeof d.deficienciesCount === "number"
        ? d.deficienciesCount
        : Number(d.deficienciesCount) || 0,
    status,
    certNo: d.certNo ? String(d.certNo) : undefined,
    issueDate: d.issueDate ? String(d.issueDate) : undefined,
    createdAt:
      typeof d.createdAt === "string"
        ? d.createdAt
        : typeof d.created_at === "string"
          ? d.created_at
          : undefined,
  };
}

/**
 * Validates whether the incoming payload has the required stats structure.
 */
export function isAuditorDashboardStatsShape(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.submitted === "number" &&
    typeof v.pending === "number" &&
    typeof v.returned === "number" &&
    typeof v.reinspect === "number" &&
    typeof v.approved === "number" &&
    typeof v.issued === "number"
  );
}

/**
 * Normalizes stats response from backend.
 */
export function normalizeAuditorDashboardStats(data: unknown): AuditorDashboardStats {
  const d = (typeof data === "object" && data !== null ? data : {}) as Record<string, unknown>;
  const submitted = Number(d.submitted) || 0;
  const pending = Number(d.pending) || 0;
  const returned = Number(d.returned) || 0;
  const reinspect = Number(d.reinspect) || 0;
  const approved = Number(d.approved) || 0;
  const issued = Number(d.issued) || 0;
  const calculatedTotal = submitted + pending + returned + reinspect + approved + issued;
  const total = d.total !== undefined ? Number(d.total) || 0 : calculatedTotal;
  const today = d.today !== undefined ? Number(d.today) || 0 : undefined;
  return { submitted, pending, returned, reinspect, approved, issued, total, today };
}
