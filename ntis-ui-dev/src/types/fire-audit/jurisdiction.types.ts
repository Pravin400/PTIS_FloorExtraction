/** Maps to FAS.JurisdictionOverlayMaster (Stage 1 master). */
export interface JurisdictionOverlayRow extends Record<string, unknown> {
  id: number;
  /** Set by the form until the signed-in council id is available from the API. */
  scope?: JurisdictionScope;
  ulbId: number | null;
  stateCode: string;
  stateName: string;
  actTitle: string;
  rulesTitle: string;
  municipalActTitle: string;
  byeLawTitle: string;
  sectionRefs: string;
  issuingAuthorityLabel: string;
  certificateFormCode: string;
  auditReportFormCode: string;
  hasOwnFireBrigade: boolean;
  validityMonths: number | null;
  reminderOffsetsCsv: string;
  effectiveFrom: string;
  effectiveTo: string;
  isActive: boolean;
}

export type JurisdictionScope = "National" | "State" | "ULB";

/** Payload the jurisdiction screen sends to the save action. */
export interface JurisdictionOverlayInput {
  id: number | null;
  scope: JurisdictionScope;
  stateCode: string;
  stateName: string;
  actTitle: string;
  rulesTitle: string;
  municipalActTitle: string;
  byeLawTitle: string;
  sectionRefs: string;
  issuingAuthorityLabel: string;
  certificateFormCode: string;
  auditReportFormCode: string;
  hasOwnFireBrigade: boolean;
  validityMonths: number;
  reminderOffsetsCsv: string;
  effectiveFrom: string;
  effectiveTo: string;
  isActive: boolean;
}

/** @deprecated Use JurisdictionOverlayRow; kept for gradual migration. */
export interface JurisdictionRow extends JurisdictionOverlayRow {
  scope: JurisdictionScope;
  authority: string;
  legalBasis: string;
  auditForm: string;
  certificateForm: string;
  needsSetup: boolean;
}

export function jurisdictionScope(row: Pick<JurisdictionOverlayRow, "ulbId" | "stateName" | "stateCode" | "scope">): JurisdictionScope {
  if (row.scope) return row.scope;
  if (row.ulbId != null && row.ulbId > 0) return "ULB";
  if (row.stateName.trim() || row.stateCode.trim()) return "State";
  return "National";
}

export function jurisdictionLegalBasisSummary(row: Pick<JurisdictionOverlayRow, "actTitle" | "rulesTitle" | "municipalActTitle" | "byeLawTitle">): string {
  return row.actTitle.trim() || row.byeLawTitle.trim() || row.municipalActTitle.trim() || row.rulesTitle.trim();
}

export function jurisdictionNeedsSetup(row: Pick<JurisdictionOverlayRow, "issuingAuthorityLabel">): boolean {
  return row.issuingAuthorityLabel.trim() === "";
}

export function toLegacyJurisdictionRow(row: JurisdictionOverlayRow): JurisdictionRow {
  return {
    ...row,
    scope: jurisdictionScope(row),
    authority: row.issuingAuthorityLabel,
    legalBasis: jurisdictionLegalBasisSummary(row),
    auditForm: row.auditReportFormCode,
    certificateForm: row.certificateFormCode,
    needsSetup: jurisdictionNeedsSetup(row),
  };
}
