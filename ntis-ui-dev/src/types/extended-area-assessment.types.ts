/**
 * Section 129A — Extended Area Property Tax Assessment.
 * Ported from the two reference calculators (single editable assessment +
 * bulk property update) into typed models the React screens work against.
 * Everything here is a pure client-side calculation — there is no backend
 * list to fetch; a case is only ever saved locally (see
 * `useSingleAssessment`'s save/load) until a real API is wired in.
 */

export type YesNo = "yes" | "no";
export type PolicyMode = "conditional" | "unconditional";
export type CaseStatus = "Draft" | "Calculated" | "Verified" | "Approved";
export type ScheduleRowStatus = "Current" | "Completed" | "Future";

export interface SelectOption {
  label: string;
  value: string;
}

/* ================= Single Assessment ================= */

export interface SingleAssessmentForm {
  upic: string;
  oldGpNo: string;
  ownerName: string;
  address: string;
  useType: string;
  zone: string;
  inclusionDate: string;
  /** This property's own Occupancy Certificate date — read-only, only populated once Section 129A has been applied. */
  ocDate: string;
  /** "Use OC Date as the basis" checkbox — false anchors to the ward's Area Inclusion Date. */
  useOcDateBasis: boolean;
  oldTax: number;
  fullGeneral: number;
  taxableValue: number;
  generalRate: number;
  areaChanged: YesNo;
  useChanged: YesNo;
  otherChanged: YesNo;
  changeDate: string;
  changeDetails: string;
  caseStatus: CaseStatus;
  officer: string;
  remarks: string;
}

export interface ScheduleRow {
  srNo: number;
  financialYear: string;
  stage: string;
  municipalPctLabel: string;
  stageTax: number;
  oldGpTax: number;
  applicableTax: number;
  totalDemand: number;
  difference: number;
  ruleApplied: string;
  status: ScheduleRowStatus;
}

export interface TimelineStageStep {
  code: string;
  displayName: string;
  subtitle: string;
  percentage: number;
  isCurrent: boolean;
  isCompleted: boolean;
}

export interface SingleAssessmentResult {
  baseTaxCode?: string;
  rows: ScheduleRow[];
  currentFy: string;
  currentPct: number;
  stageLabel: string;
  applicableGeneralTax: number;
  totalDemand: number;
  ruleLabel: string;
  sumApplicable: number;
  sumTotalDemand: number;
  stages?: TimelineStageStep[];
}

/* ================= Bulk Update ================= */

export interface BulkPropertyRow {
  id: number;
  upic: string;
  oldGpNo: string;
  owner: string;
  inclusionDate: string;
  assessmentDate: string;
  oldTax: number;
  fullTax: number;
  policyMode: PolicyMode;
  oldArea: number;
  newArea: number;
  areaThreshold: number;
  areaRuleEnabled: YesNo;
  useChanged: YesNo;
  otherChanged: YesNo;
  useDisqualify: YesNo;
  otherDisqualify: YesNo;
  changeDate: string;
  selected: boolean;
}

export interface BulkComputedResult {
  fy: string;
  stage: string;
  tax: number;
}

export type BulkApplyField =
  | "assessmentDate"
  | "inclusionDate"
  | "useChanged"
  | "otherChanged"
  | "policyMode"
  | "oldArea"
  | "newArea"
  | "areaThreshold"
  | "areaRuleEnabled"
  | "useDisqualify"
  | "otherDisqualify"
  | "changeDate";
