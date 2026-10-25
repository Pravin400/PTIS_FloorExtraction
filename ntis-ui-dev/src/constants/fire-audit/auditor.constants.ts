/**
 * Auditor Status, Risk & SLA Constants & Metadata
 * Path: src/constants/fire-audit/auditor.constants.ts
 *
 * Centralized source of truth for Auditor application statuses, risk categories,
 * SLA severity calculations, and associated UI presentation metadata.
 * Line ceiling: <= 300 lines.
 */

import type { ElementType } from "react";
import {
  FileText,
  Clock,
  AlertCircle,
  RotateCw,
  CheckCircle2,
  Award,
} from "lucide-react";
import type { BadgeVariant } from "@/components/common";
import { parseDate, getIstYmdString } from "@/lib/utils/fire-audit/date-utils";

// --- 1. Status Enums & Metadata ---

export const AUDITOR_STATUS = {
  SUBMITTED: "Auditor Report Submitted",
  PENDING_VERIFICATION: "Officer Verification Pending",
  RETURNED: "Returned for Rectification",
  RE_INSPECTION: "Re-Inspection Pending",
  APPROVED: "Approved",
  CERTIFICATE_ISSUED: "Certificate Issued",
} as const;

export const AUDITOR_APPLICATION_STATUSES = [
  AUDITOR_STATUS.SUBMITTED,
  AUDITOR_STATUS.PENDING_VERIFICATION,
  AUDITOR_STATUS.RETURNED,
  AUDITOR_STATUS.RE_INSPECTION,
  AUDITOR_STATUS.APPROVED,
  AUDITOR_STATUS.CERTIFICATE_ISSUED,
] as const;

export type AuditorApplicationStatus = (typeof AUDITOR_APPLICATION_STATUSES)[number];

export interface AuditorStatusMeta {
  status: AuditorApplicationStatus;
  badgeVariant: BadgeVariant;
  translationKey: string;
  statKey: "submitted" | "pending" | "returned" | "reinspect" | "approved" | "issued";
  titleKey: "submitted" | "pending" | "returned" | "reinspect" | "approved" | "issued";
  labelKey:
    | "submittedLabel"
    | "pendingLabel"
    | "returnedLabel"
    | "reinspectLabel"
    | "approvedLabel"
    | "issuedLabel";
  activityPrefix: string;
  icon: ElementType;
  iconColor: string;
  badgeBg: string;
  topBorderColor: string;
}

export const STATUS_META: Record<AuditorApplicationStatus, AuditorStatusMeta> = {
  [AUDITOR_STATUS.SUBMITTED]: {
    status: AUDITOR_STATUS.SUBMITTED,
    badgeVariant: "default",
    translationKey: "auditorReportSubmitted",
    statKey: "submitted",
    titleKey: "submitted",
    labelKey: "submittedLabel",
    activityPrefix: "Auditor Report Submitted",
    icon: FileText,
    iconColor: "text-sky-500",
    badgeBg: "bg-sky-50",
    topBorderColor: "border-t-sky-500",
  },
  [AUDITOR_STATUS.PENDING_VERIFICATION]: {
    status: AUDITOR_STATUS.PENDING_VERIFICATION,
    badgeVariant: "default",
    translationKey: "officerVerificationPending",
    statKey: "pending",
    titleKey: "pending",
    labelKey: "pendingLabel",
    activityPrefix: "Officer Verification",
    icon: Clock,
    iconColor: "text-sky-500",
    badgeBg: "bg-sky-50",
    topBorderColor: "border-t-sky-500",
  },
  [AUDITOR_STATUS.RETURNED]: {
    status: AUDITOR_STATUS.RETURNED,
    badgeVariant: "destructive",
    translationKey: "returnedForRectification",
    statKey: "returned",
    titleKey: "returned",
    labelKey: "returnedLabel",
    activityPrefix: "Returned for Rectification",
    icon: AlertCircle,
    iconColor: "text-rose-500",
    badgeBg: "bg-rose-50",
    topBorderColor: "border-t-rose-500",
  },
  [AUDITOR_STATUS.RE_INSPECTION]: {
    status: AUDITOR_STATUS.RE_INSPECTION,
    badgeVariant: "warning",
    translationKey: "reInspectionPending",
    statKey: "reinspect",
    titleKey: "reinspect",
    labelKey: "reinspectLabel",
    activityPrefix: "Re-Inspection Scheduled",
    icon: RotateCw,
    iconColor: "text-orange-500",
    badgeBg: "bg-orange-50",
    topBorderColor: "border-t-orange-500",
  },
  [AUDITOR_STATUS.APPROVED]: {
    status: AUDITOR_STATUS.APPROVED,
    badgeVariant: "success",
    translationKey: "approved",
    statKey: "approved",
    titleKey: "approved",
    labelKey: "approvedLabel",
    activityPrefix: "Approved",
    icon: CheckCircle2,
    iconColor: "text-emerald-500",
    badgeBg: "bg-emerald-50",
    topBorderColor: "border-t-emerald-500",
  },
  [AUDITOR_STATUS.CERTIFICATE_ISSUED]: {
    status: AUDITOR_STATUS.CERTIFICATE_ISSUED,
    badgeVariant: "success",
    translationKey: "certificateIssued",
    statKey: "issued",
    titleKey: "issued",
    labelKey: "issuedLabel",
    activityPrefix: "Certificate Issued",
    icon: Award,
    iconColor: "text-teal-500",
    badgeBg: "bg-teal-50",
    topBorderColor: "border-t-teal-500",
  },
};

export const STATUS_ALIASES: Record<string, AuditorApplicationStatus> = {
  [AUDITOR_STATUS.SUBMITTED]: AUDITOR_STATUS.SUBMITTED,
  [AUDITOR_STATUS.PENDING_VERIFICATION]: AUDITOR_STATUS.PENDING_VERIFICATION,
  [AUDITOR_STATUS.RETURNED]: AUDITOR_STATUS.RETURNED,
  [AUDITOR_STATUS.RE_INSPECTION]: AUDITOR_STATUS.RE_INSPECTION,
  [AUDITOR_STATUS.APPROVED]: AUDITOR_STATUS.APPROVED,
  [AUDITOR_STATUS.CERTIFICATE_ISSUED]: AUDITOR_STATUS.CERTIFICATE_ISSUED,
  "Returned to Auditor": AUDITOR_STATUS.RETURNED,
  "Re-inspection Scheduled": AUDITOR_STATUS.RE_INSPECTION,
  Submitted: AUDITOR_STATUS.SUBMITTED,
  "Pending Verification": AUDITOR_STATUS.PENDING_VERIFICATION,
  "Verification Pending": AUDITOR_STATUS.PENDING_VERIFICATION,
};

// --- 2. Risk Categories & Metadata ---

export const AUDITOR_RISK_CATEGORIES = ["Low", "Medium", "High", "Unknown"] as const;
export type AuditorRiskCategory = (typeof AUDITOR_RISK_CATEGORIES)[number];

export interface AuditorRiskMeta {
  category: AuditorRiskCategory;
  badgeVariant: "destructive" | "warning" | "success" | "secondary";
  translationKey: "riskHigh" | "riskMedium" | "riskLow" | "riskUnknown";
  shortTranslationKey: "high" | "medium" | "low" | "unknown";
}

export const RISK_META: Record<AuditorRiskCategory, AuditorRiskMeta> = {
  High: { category: "High", badgeVariant: "destructive", translationKey: "riskHigh", shortTranslationKey: "high" },
  Medium: { category: "Medium", badgeVariant: "warning", translationKey: "riskMedium", shortTranslationKey: "medium" },
  Low: { category: "Low", badgeVariant: "success", translationKey: "riskLow", shortTranslationKey: "low" },
  Unknown: { category: "Unknown", badgeVariant: "secondary", translationKey: "riskUnknown", shortTranslationKey: "unknown" },
};

export const RISK_ALIASES: Record<string, AuditorRiskCategory> = {
  High: "High",
  high: "High",
  Medium: "Medium",
  medium: "Medium",
  Low: "Low",
  low: "Low",
  Unknown: "Unknown",
  unknown: "Unknown",
};

// --- 3. SLA Severity Calculations & Metadata ---

export type SlaSeverity = "critical" | "urgent" | "normal";

export interface SlaSeverityMeta {
  severity: SlaSeverity;
  badgeVariant: "destructive" | "warning" | "secondary";
  iconColor: string;
}

export const SLA_SEVERITY_META: Record<SlaSeverity, SlaSeverityMeta> = {
  critical: { severity: "critical", badgeVariant: "destructive", iconColor: "text-rose-500" },
  urgent: { severity: "urgent", badgeVariant: "warning", iconColor: "text-amber-500" },
  normal: { severity: "normal", badgeVariant: "secondary", iconColor: "text-emerald-500" },
};

export function getSlaDaysLeft(
  app: { dueDate?: string; slaDaysLeft?: number; sla?: string; days?: string },
  referenceDate: Date = new Date()
): number | undefined {
  if (typeof app.slaDaysLeft === "number" && !isNaN(app.slaDaysLeft)) {
    return app.slaDaysLeft;
  }
  if (app.dueDate) {
    const due = parseDate(app.dueDate);
    if (due) {
      const refYmd = getIstYmdString(referenceDate);
      const dueYmd = getIstYmdString(due);
      const [ry, rm, rd] = refYmd.split("-").map(Number);
      const [dy, dm, dd] = dueYmd.split("-").map(Number);
      return Math.round((Date.UTC(dy, dm - 1, dd) - Date.UTC(ry, rm - 1, rd)) / 86400000);
    }
  }
  const text = app.sla || app.days || "";
  if (/overdue|expired/i.test(text)) return -1;
  const match = text.match(/^(\d+)\s*d/i) || text.match(/(\d+)\s*days/i);
  return match ? parseInt(match[1], 10) : undefined;
}

export function getSlaSeverity(
  app: { dueDate?: string; slaDaysLeft?: number; sla?: string; days?: string },
  referenceDate: Date = new Date()
): SlaSeverityMeta {
  const daysLeft = getSlaDaysLeft(app, referenceDate);
  if (daysLeft !== undefined) {
    if (daysLeft <= 2) return SLA_SEVERITY_META.critical;
    if (daysLeft <= 5) return SLA_SEVERITY_META.urgent;
    return SLA_SEVERITY_META.normal;
  }
  const text = (app.sla || app.days || "").toLowerCase();
  if (text.includes("urgent") || text.includes("critical") || text.includes("overdue")) {
    return SLA_SEVERITY_META.critical;
  }
  return SLA_SEVERITY_META.normal;
}

export function calculateStatsFromApplications(
  applications: Array<{ status: AuditorApplicationStatus | string }>
): {
  submitted: number;
  pending: number;
  returned: number;
  reinspect: number;
  approved: number;
  issued: number;
  total: number;
  today?: number;
} {
  const stats = {
    submitted: 0,
    pending: 0,
    returned: 0,
    reinspect: 0,
    approved: 0,
    issued: 0,
    total: applications.length,
  };
  for (const app of applications) {
    const status = STATUS_ALIASES[app.status] || (app.status as AuditorApplicationStatus);
    const meta = STATUS_META[status];
    if (meta) {
      stats[meta.statKey]++;
    }
  }
  return stats;
}
