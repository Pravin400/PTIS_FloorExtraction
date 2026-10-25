import React from 'react';
import {
  MapPin,
  ClipboardCheck,
  FileEdit,
  Calculator,
  Building2,
  Send,
  Scale,
  Receipt,
  Printer,
  Award,
  Home,
  Zap,
  Droplet,
  ShieldCheck,
  Building,
  Link,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import {
  WorkflowStageDto,
  CertificateTypeDto,
  ApartmentQCTopSectionBelowFlexResponseDto,
  ApartmentQCTopSectionBelowFlexItemsDto,
} from '@/types/property-tax/apartment';

export interface PtisStatusBadgeItem {
  id: string;
  type: 'stage' | 'certificate';
  label: string;
  code?: string | null;
  value: string;
  secondaryValue?: string | null;
  icon: React.ReactNode;
  valueColorClass: string;
  iconBgClass: string;
  iconColorClass: string;
  badgeBgClass?: string;
  badgeBorderClass?: string;
  isCompletedOrIssued: boolean;

  // Rich API metadata for display and detailed view
  description?: string | null;
  certificateNo?: string | null;
  issueDate?: string | null;
  issueDateFormatted?: string | null;
  createdBy?: number | null;
  createdByName?: string | null;
  createdDate?: string | null;
  createdDateFormatted?: string | null;
  updatedBy?: number | null;
  updatedByName?: string | null;
  updatedDate?: string | null;
  updatedDateFormatted?: string | null;

  rawStage?: WorkflowStageDto;
  rawCert?: CertificateTypeDto;
}

const ICON_SIZE_CLASS = 'w-3.5 h-3.5';

/** Keyword-to-Icon lookup mapping table for efficient rule matching */
const ICON_KEYWORD_RULES: ReadonlyArray<readonly [readonly string[], React.ReactNode]> = [
  [['geo', 'gis', 'sequence', 'location'], <MapPin key="gis" className={ICON_SIZE_CLASS} />],
  [['survey', 'internal'], <ClipboardCheck key="survey" className={ICON_SIZE_CLASS} />],
  [['data', 'entry', 'edit'], <FileEdit key="data" className={ICON_SIZE_CLASS} />],
  [['assess'], <Calculator key="assess" className={ICON_SIZE_CLASS} />],
  [['ulb', 'approval'], <Building2 key="ulb" className={ICON_SIZE_CLASS} />],
  [['notice', 'distribut', 'mail'], <Send key="notice" className={ICON_SIZE_CLASS} />],
  [['hearing', 'appeal', 'court'], <Scale key="hearing" className={ICON_SIZE_CLASS} />],
  [['recovery', 'collection', 'wallet'], <Receipt key="recovery" className={ICON_SIZE_CLASS} />],
  [['bill', 'generation', 'invoice'], <Printer key="bill" className={ICON_SIZE_CLASS} />],
  [['completion'], <Award key="completion" className={ICON_SIZE_CLASS} />],
  [['occupancy', 'possession'], <Home key="occupancy" className={ICON_SIZE_CLASS} />],
  [['electric', 'power'], <Zap key="electric" className={ICON_SIZE_CLASS} />],
  [['water'], <Droplet key="water" className={ICON_SIZE_CLASS} />],
  [['fire', 'noc'], <ShieldCheck key="fire" className={ICON_SIZE_CLASS} />],
  [['trade', 'license'], <Building key="trade" className={ICON_SIZE_CLASS} />],
  [['permission', 'link'], <Link key="permission" className={ICON_SIZE_CLASS} />],
] as const;

/** Optimized helper function to return contextual Lucide icons based on stage/certificate name */
export function getWorkflowContextIcon(name: string, isCompletedOrIssued: boolean): React.ReactNode {
  const norm = (name || '').toLowerCase().trim();
  if (!norm) {
    return isCompletedOrIssued ? <CheckCircle2 className={ICON_SIZE_CLASS} /> : <Clock className={ICON_SIZE_CLASS} />;
  }

  const match = ICON_KEYWORD_RULES.find(([keywords]) =>
    keywords.some((kw) => norm.includes(kw))
  );

  if (match) return match[1];

  return isCompletedOrIssued ? <CheckCircle2 className={ICON_SIZE_CLASS} /> : <Clock className={ICON_SIZE_CLASS} />;
}

/** Robust boolean/status evaluator that handles boolean, numbers (1/0), strings ("true", "1", "completed", "issued") */
export function parseBooleanStatus(val: unknown): boolean {
  if (val === true || val === 1) return true;
  if (typeof val === 'string') {
    const s = val.trim().toLowerCase();
    return s === 'true' || s === '1' || s === 'yes' || s === 'completed' || s === 'issued';
  }
  return false;
}

/** Formats ISO dates into clean display dates: DD/MM/YYYY */
export function formatWorkflowDate(dateStr?: string | null): string | null {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      const parts = String(dateStr).split('T')[0];
      return parts || null;
    }
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return String(dateStr);
  }
}

/** Formats ISO dates into clean display date & time: DD/MM/YYYY hh:mm A */
export function formatWorkflowDateTime(dateStr?: string | null): string | null {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${day}/${month}/${year} ${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
  } catch {
    return String(dateStr);
  }
}

/** Default empty badges array to prevent rendering static hardcoded dummy data */
export const DEFAULT_STATUS_BADGES: PtisStatusBadgeItem[] = [];

/** Dynamic utility to build badge items array from backend workflow API payload only */
export function buildBadgesFromPayload(
  payload: Record<string, unknown> | ApartmentQCTopSectionBelowFlexResponseDto | ApartmentQCTopSectionBelowFlexItemsDto | null | undefined
): PtisStatusBadgeItem[] {
  if (!payload) return [];

  const rawObj = payload as Record<string, unknown>;
  const source = (rawObj.items ?? rawObj.data ?? rawObj.result ?? rawObj) as Record<string, unknown>;

  const rawStages = source?.workflowStages ?? (source as Record<string, unknown>)?.WorkflowStages;
  const rawCerts = source?.certificateTypes ?? (source as Record<string, unknown>)?.CertificateTypes;

  const stages = Array.isArray(rawStages) ? (rawStages as WorkflowStageDto[]) : [];
  const certs = Array.isArray(rawCerts) ? (rawCerts as CertificateTypeDto[]) : [];

  if (stages.length === 0 && certs.length === 0) return [];

  const mappedBadges: PtisStatusBadgeItem[] = new Array(stages.length + certs.length);
  let index = 0;

  for (let i = 0; i < stages.length; i++) {
    const stage = stages[i];
    const anyStage = stage as unknown as Record<string, unknown>;

    const stageId = Number(stage.stageId ?? anyStage.StageId ?? (i + 1));
    const stageName = String(stage.stageName ?? anyStage.StageName ?? `Stage ${stageId}`);
    const description = (stage.description ?? anyStage.Description ?? null) as string | null;
    const createdBy = (stage.createdBy ?? anyStage.CreatedBy ?? null) as number | null;
    const createdByName = (stage.createdByName ?? anyStage.CreatedByName ?? null) as string | null;
    const createdDate = (stage.createdDate ?? anyStage.CreatedDate ?? null) as string | null;
    const updatedBy = (stage.updatedBy ?? anyStage.UpdatedBy ?? null) as number | null;
    const updatedByName = (stage.updatedByName ?? anyStage.UpdatedByName ?? null) as string | null;
    const updatedDate = (stage.updatedDate ?? anyStage.UpdatedDate ?? null) as string | null;

    // Detect completion status robustly from boolean flag, PascalCase, or populated creation log
    const isDone =
      parseBooleanStatus(stage.isCompleted) ||
      parseBooleanStatus(anyStage.IsCompleted) ||
      parseBooleanStatus(anyStage.is_completed) ||
      parseBooleanStatus(anyStage.completed) ||
      String(anyStage.status || '').toLowerCase() === 'completed';

    const createdDateFormatted = formatWorkflowDate(createdDate);
    const createdDateTimeFormatted = formatWorkflowDateTime(createdDate);
    const updatedDateTimeFormatted = formatWorkflowDateTime(updatedDate);

    mappedBadges[index++] = {
      id: `stage-${stageId}`,
      type: 'stage',
      label: stageName,
      code: null,
      value: isDone ? 'Completed' : 'Pending',
      secondaryValue: isDone && createdDateFormatted ? createdDateFormatted : null,
      icon: getWorkflowContextIcon(stageName, isDone),
      valueColorClass: isDone ? 'text-emerald-700' : 'text-amber-700',
      iconBgClass: isDone ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200',
      iconColorClass: isDone ? 'text-emerald-600' : 'text-amber-600',
      badgeBgClass: isDone ? 'bg-emerald-50/40 hover:bg-emerald-50' : 'bg-amber-50/30 hover:bg-amber-50/60',
      badgeBorderClass: isDone ? 'border-emerald-200' : 'border-amber-200',
      isCompletedOrIssued: isDone,

      description,
      certificateNo: null,
      issueDate: null,
      issueDateFormatted: null,
      createdBy,
      createdByName,
      createdDate,
      createdDateFormatted: createdDateTimeFormatted,
      updatedBy,
      updatedByName,
      updatedDate,
      updatedDateFormatted: updatedDateTimeFormatted,

      rawStage: stage,
    };
  }

  for (let i = 0; i < certs.length; i++) {
    const cert = certs[i];
    const anyCert = cert as unknown as Record<string, unknown>;

    const certId = Number(cert.certificateTypeId ?? anyCert.CertificateTypeId ?? (i + 1));
    const certName = String(cert.certificateTypeName ?? anyCert.CertificateTypeName ?? `Certificate ${certId}`);
    const certCode = (cert.certificateTypeCode ?? anyCert.CertificateTypeCode ?? null) as string | null;
    const certNo = (cert.certificateNo ?? anyCert.CertificateNo ?? null) as string | null;
    const issueDate = (cert.issueDate ?? anyCert.IssueDate ?? null) as string | null;
    const description = (cert.description ?? anyCert.Description ?? null) as string | null;
    const createdBy = (cert.createdBy ?? anyCert.CreatedBy ?? null) as number | null;
    const createdByName = (cert.createdByName ?? anyCert.CreatedByName ?? null) as string | null;
    const createdDate = (cert.createdDate ?? anyCert.CreatedDate ?? null) as string | null;
    const updatedBy = (cert.updatedBy ?? anyCert.UpdatedBy ?? null) as number | null;
    const updatedByName = (cert.updatedByName ?? anyCert.UpdatedByName ?? null) as string | null;
    const updatedDate = (cert.updatedDate ?? anyCert.UpdatedDate ?? null) as string | null;

    // Detect issued status robustly from flag, presence of certificate number, or issue date
    const hasCertNo = Boolean(certNo && String(certNo).trim() !== '' && String(certNo).trim() !== '-');
    const hasIssueDate = Boolean(issueDate && String(issueDate).trim() !== '');

    const isIssued =
      parseBooleanStatus(cert.isIssued) ||
      parseBooleanStatus(anyCert.IsIssued) ||
      parseBooleanStatus(anyCert.is_issued) ||
      parseBooleanStatus(anyCert.issued) ||
      String(anyCert.status || '').toLowerCase() === 'issued' ||
      hasCertNo ||
      hasIssueDate;

    const issueDateFormatted = formatWorkflowDate(issueDate);
    const createdDateTimeFormatted = formatWorkflowDateTime(createdDate);
    const updatedDateTimeFormatted = formatWorkflowDateTime(updatedDate);

    mappedBadges[index++] = {
      id: `cert-${certId}`,
      type: 'certificate',
      label: certName,
      code: certCode,
      value: isIssued ? (hasCertNo ? `Issued: ${certNo}` : 'Issued') : 'Not Issued',
      secondaryValue: isIssued ? (issueDateFormatted ?? (hasCertNo ? certNo : null)) : null,
      icon: getWorkflowContextIcon(certName, isIssued),
      valueColorClass: isIssued ? 'text-emerald-700' : 'text-rose-700',
      iconBgClass: isIssued ? 'bg-emerald-50 border border-emerald-200' : 'bg-rose-50 border border-rose-200',
      iconColorClass: isIssued ? 'text-emerald-600' : 'text-rose-600',
      badgeBgClass: isIssued ? 'bg-emerald-50/40 hover:bg-emerald-50' : 'bg-rose-50/30 hover:bg-rose-50/60',
      badgeBorderClass: isIssued ? 'border-emerald-200' : 'border-rose-200',
      isCompletedOrIssued: isIssued,

      description,
      certificateNo: certNo,
      issueDate,
      issueDateFormatted,
      createdBy,
      createdByName,
      createdDate,
      createdDateFormatted: createdDateTimeFormatted,
      updatedBy,
      updatedByName,
      updatedDate,
      updatedDateFormatted: updatedDateTimeFormatted,

      rawCert: cert,
    };
  }

  return mappedBadges;
}
