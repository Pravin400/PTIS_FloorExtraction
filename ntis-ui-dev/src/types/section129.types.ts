/**
 * Section 129A single-assessment screen — API-shaped types, mirroring the backend's
 * Section129ScheduleDto / Section129ScheduleRowDto / Section129ApplyRequestDto
 * (NtisPlatform.Application.DTOs.Section129). JSON keys are camelCase (ASP.NET Core default).
 */

export interface Section129ScheduleRowApi {
  srNo: number;
  financeYearId: number;
  financialYear: string;
  stage: string;
  municipalPct: number | null;
  stageTax: number;
  oldGpTax: number;
  applicableTax: number;
  totalDemand: number;
  differenceFrom100: number;
  ruleApplied: string;
  status: "Current" | "Completed" | "Future" | string;
}

export interface Section129StageApi {
  code: string;
  displayName: string;
  subtitle: string;
  percentage: number;
  isCurrent: boolean;
  isCompleted: boolean;
}

export interface Section129ScheduleApi {
  propertyId: number;
  /** The property's ward id (PTIS.WardMaster.Id) — lets the caller pre-select the Ward/Property No
   *  dropdowns to match this property regardless of which search path resolved it. */
  wardId: number;
  baseTaxCode?: string;
  /** The base tax code the EXISTING schedule was actually built under — may differ from baseTaxCode
   *  when SECTION129_STAGE_BASE_TAXCODE was changed after this property was applied. Null when no
   *  schedule rows exist yet. */
  appliedBaseTaxCode?: string | null;
  currentFinancialYear: string | null;
  upic: string;
  oldGpNo: string | null;
  ownerName: string;
  address: string;
  useType: string;
  zone: string;
  isApplied: boolean;
  assessmentYear: string | null;
  appliedDate: string | null;
  /** Ward-wide Area Inclusion Date auto-fetched from WardSection129DateMaster — read-only, not officer-entered. */
  areaInclusionDate: string | null;
  /** This property's own Occupancy Certificate date (earliest active OC) — read-only. Only populated once `isApplied`. */
  ocDate: string | null;
  /** The "use OC Date as the basis" checkbox: false = ward Area Inclusion Date anchors the schedule, true = this property's OC Date. */
  useOcDateBasis: boolean;
  oldTax: number;
  fullGeneralTax: number;
  taxableValue: number;
  generalTaxRate: number;
  areaChanged: boolean;
  useChanged: boolean;
  otherStructuralChange: boolean;
  otherStructuralChangeEffectiveDate: string | null;
  changeDetailsRemark: string | null;
  caseStatus: "NotApplied" | "Applied" | "Calculated" | string;
  remarks: string | null;
  rows: Section129ScheduleRowApi[];
  stages?: Section129StageApi[];
  /** Machine-readable reason a Recalculate call was skipped (no writes) — "BasisNotCalculated" | "BaseTaxCodeChanged" | null. */
  recalculateBlockedReason?: string | null;
}

export interface Section129ApplyRequest {
  startFinanceYearIdOverride?: number | null;
  /** false (default) = anchor to the ward's Area Inclusion Date; true = anchor to this property's own OC Date. */
  useOcDateBasis?: boolean;
  areaChanged: boolean;
  useChanged: boolean;
  otherStructuralChange: boolean;
  otherStructuralChangeEffectiveDate?: string | null;
  changeDetailsRemark?: string | null;
  remarks?: string | null;
}

/** Body of POST .../section129a-recalculate — the officer's current Property-Change-Check facts and OC-Date checkbox. */
export interface Section129RecalculateRequest {
  areaChanged: boolean;
  useChanged: boolean;
  otherStructuralChange: boolean;
  otherStructuralChangeEffectiveDate?: string | null;
  changeDetailsRemark?: string | null;
  /** Flipping this wipes and rebuilds the whole schedule from the new anchor year. */
  useOcDateBasis: boolean;
}
