import { apiClient } from "@/services/api.service";
import { ApiError } from "@/lib/utils/api";
import type { JurisdictionOverlayRow, JurisdictionScope } from "@/types/fire-audit/jurisdiction.types";

const RESOURCE = "/JurisdictionOverlayMaster";
const PAGE_SIZE = 100;

interface RawOverlay {
  id?: number;
  Id?: number;
  ulbId?: number | null;
  UlbId?: number | null;
  stateCode?: string | null;
  StateCode?: string | null;
  stateName?: string | null;
  StateName?: string | null;
  actTitle?: string | null;
  ActTitle?: string | null;
  rulesTitle?: string | null;
  RulesTitle?: string | null;
  municipalActTitle?: string | null;
  MunicipalActTitle?: string | null;
  byeLawTitle?: string | null;
  ByeLawTitle?: string | null;
  sectionRefs?: string | null;
  SectionRefs?: string | null;
  issuingAuthorityLabel?: string | null;
  IssuingAuthorityLabel?: string | null;
  certificateFormCode?: string | null;
  CertificateFormCode?: string | null;
  auditReportFormCode?: string | null;
  AuditReportFormCode?: string | null;
  hasOwnFireBrigade?: boolean;
  HasOwnFireBrigade?: boolean;
  validityMonths?: number | null;
  ValidityMonths?: number | null;
  reminderOffsetsCsv?: string | null;
  ReminderOffsetsCsv?: string | null;
  effectiveFrom?: string | null;
  EffectiveFrom?: string | null;
  effectiveTo?: string | null;
  EffectiveTo?: string | null;
  isActive?: boolean;
  IsActive?: boolean;
}

interface PagedOverlays {
  items?: RawOverlay[];
  Items?: RawOverlay[];
  totalCount?: number;
  TotalCount?: number;
}

export interface JurisdictionOverlayWriteBody {
  ulbId: number | null;
  stateCode: string | null;
  stateName: string | null;
  actTitle: string | null;
  rulesTitle: string | null;
  municipalActTitle: string | null;
  byeLawTitle: string | null;
  sectionRefs: string | null;
  issuingAuthorityLabel: string;
  certificateFormCode: string | null;
  auditReportFormCode: string | null;
  hasOwnFireBrigade: boolean;
  validityMonths: number;
  reminderOffsetsCsv: string | null;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  isActive: boolean;
  createdBy?: number | null;
  updatedBy?: number | null;
}

function text(value: string | null | undefined): string {
  return value?.trim() ?? "";
}

function dateOnly(value: string | null | undefined): string {
  if (!value?.trim()) return "";
  return value.slice(0, 10);
}

function scopeOf(ulbId: number | null, stateName: string, stateCode: string): JurisdictionScope {
  if (ulbId != null && ulbId > 0) return "ULB";
  if (stateName || stateCode) return "State";
  return "National";
}

export function normalizeJurisdictionOverlay(raw: RawOverlay): JurisdictionOverlayRow {
  const ulbId = raw.ulbId ?? raw.UlbId ?? null;
  const stateCode = text(raw.stateCode ?? raw.StateCode);
  const stateName = text(raw.stateName ?? raw.StateName);
  return {
    id: raw.id ?? raw.Id ?? 0,
    scope: scopeOf(ulbId, stateName, stateCode),
    ulbId,
    stateCode,
    stateName,
    actTitle: text(raw.actTitle ?? raw.ActTitle),
    rulesTitle: text(raw.rulesTitle ?? raw.RulesTitle),
    municipalActTitle: text(raw.municipalActTitle ?? raw.MunicipalActTitle),
    byeLawTitle: text(raw.byeLawTitle ?? raw.ByeLawTitle),
    sectionRefs: text(raw.sectionRefs ?? raw.SectionRefs),
    issuingAuthorityLabel: text(raw.issuingAuthorityLabel ?? raw.IssuingAuthorityLabel),
    certificateFormCode: text(raw.certificateFormCode ?? raw.CertificateFormCode),
    auditReportFormCode: text(raw.auditReportFormCode ?? raw.AuditReportFormCode),
    hasOwnFireBrigade: raw.hasOwnFireBrigade ?? raw.HasOwnFireBrigade ?? true,
    validityMonths: raw.validityMonths ?? raw.ValidityMonths ?? null,
    reminderOffsetsCsv: text(raw.reminderOffsetsCsv ?? raw.ReminderOffsetsCsv),
    effectiveFrom: dateOnly(raw.effectiveFrom ?? raw.EffectiveFrom),
    effectiveTo: dateOnly(raw.effectiveTo ?? raw.EffectiveTo),
    isActive: raw.isActive ?? raw.IsActive ?? false,
  };
}

function fail(response: { statusCode?: number; error?: string }, message: string): never {
  throw new ApiError(response.statusCode || 500, response.error || message, message);
}

export async function listJurisdictionOverlays(): Promise<JurisdictionOverlayRow[]> {
  const rows: JurisdictionOverlayRow[] = [];
  let pageNumber = 1;
  let totalCount = Number.POSITIVE_INFINITY;

  while (rows.length < totalCount && pageNumber <= 20) {
    const response = await apiClient.get<PagedOverlays>(
      `${RESOURCE}?PageNumber=${pageNumber}&PageSize=${PAGE_SIZE}`
    );
    if (!response.success || !response.data) fail(response, "Fetch jurisdiction rules failed");

    const items = response.data.items ?? response.data.Items ?? [];
    totalCount = response.data.totalCount ?? response.data.TotalCount ?? items.length;
    rows.push(...items.map(normalizeJurisdictionOverlay));
    if (items.length === 0) break;
    pageNumber += 1;
  }

  return rows;
}

export async function createJurisdictionOverlay(body: JurisdictionOverlayWriteBody): Promise<void> {
  const response = await apiClient.post<unknown>(RESOURCE, body);
  if (!response.success) fail(response, "Create jurisdiction rule failed");
}

export async function updateJurisdictionOverlay(id: number, body: JurisdictionOverlayWriteBody): Promise<void> {
  const response = await apiClient.put<unknown>(`${RESOURCE}/${id}`, body);
  if (!response.success) fail(response, "Update jurisdiction rule failed");
}
