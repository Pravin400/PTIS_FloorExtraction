import type { Section129ScheduleApi } from "@/types/section129.types";
import type { SingleAssessmentForm, SingleAssessmentResult } from "@/types/extended-area-assessment.types";

/** Extracts a 4-digit year from a string like "2020" or "2020-21", mirroring the backend's own leniency. */
export function extractYear(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = value.match(/\d{4}/);
  return match ? parseInt(match[0], 10) : null;
}

const CASE_STATUS_MAP: Record<string, SingleAssessmentForm["caseStatus"]> = {
  NotApplied: "Draft",
  Applied: "Calculated",
  Calculated: "Calculated",
};

export function emptyForm(): SingleAssessmentForm {
  return {
    upic: "",
    oldGpNo: "",
    ownerName: "",
    address: "",
    useType: "",
    zone: "",
    inclusionDate: "",
    ocDate: "",
    useOcDateBasis: false,
    oldTax: 0,
    fullGeneral: 0,
    taxableValue: 0,
    generalRate: 0,
    areaChanged: "no",
    useChanged: "no",
    otherChanged: "no",
    changeDate: "",
    changeDetails: "",
    caseStatus: "Draft",
    officer: "",
    remarks: "",
  };
}

export function emptyResult(currentFy: string): SingleAssessmentResult {
  return {
    rows: [],
    currentFy,
    currentPct: 0,
    stageLabel: "",
    applicableGeneralTax: 0,
    totalDemand: 0,
    ruleLabel: "",
    sumApplicable: 0,
    sumTotalDemand: 0,
  };
}

/** Maps the backend's Section129ScheduleApi onto the screen's existing form + schedule shapes. */
export function mapApiToUi(api: Section129ScheduleApi): { form: Partial<SingleAssessmentForm>; result: SingleAssessmentResult } {
  const rows = api.rows.map((r) => ({
    srNo: r.srNo,
    financialYear: r.financialYear,
    stage: r.stage,
    municipalPctLabel: r.municipalPct == null ? "—" : `${r.municipalPct}%`,
    stageTax: r.stageTax,
    oldGpTax: r.oldGpTax,
    applicableTax: r.applicableTax,
    totalDemand: r.totalDemand,
    difference: r.differenceFrom100,
    ruleApplied: r.ruleApplied,
    status: (r.status === "Current" || r.status === "Completed" || r.status === "Future" ? r.status : "Future") as
      | "Current"
      | "Completed"
      | "Future",
  }));

  const currentApiRow = api.rows.find((r) => r.status === "Current") ?? api.rows[api.rows.length - 1];
  const currentRow = rows.find((r) => r.status === "Current") ?? rows[rows.length - 1];

  return {
    form: {
      upic: api.upic,
      oldGpNo: api.oldGpNo ?? "",
      ownerName: api.ownerName,
      address: api.address,
      useType: api.useType,
      zone: api.zone,
      inclusionDate: api.areaInclusionDate?.slice(0, 10) ?? "",
      ocDate: api.ocDate?.slice(0, 10) ?? "",
      useOcDateBasis: api.useOcDateBasis ?? false,
      oldTax: api.oldTax,
      fullGeneral: api.fullGeneralTax,
      taxableValue: api.taxableValue,
      generalRate: api.generalTaxRate,
      areaChanged: api.areaChanged ? "yes" : "no",
      useChanged: api.useChanged ? "yes" : "no",
      otherChanged: api.otherStructuralChange ? "yes" : "no",
      changeDate: api.otherStructuralChangeEffectiveDate?.slice(0, 10) ?? "",
      changeDetails: api.changeDetailsRemark ?? "",
      caseStatus: CASE_STATUS_MAP[api.caseStatus] ?? "Draft",
      remarks: api.remarks ?? "",
    },
    result: {
      baseTaxCode: api.baseTaxCode ?? "General Tax",
      rows,
      currentFy: api.currentFinancialYear ?? currentRow?.financialYear ?? "",
      currentPct: currentApiRow?.municipalPct ?? 0,
      stageLabel: currentRow?.stage ?? "",
      applicableGeneralTax: currentRow?.applicableTax ?? 0,
      totalDemand: currentRow?.totalDemand ?? api.fullGeneralTax,
      ruleLabel: currentRow?.ruleApplied ?? "",
      sumApplicable: rows.reduce((sum, r) => sum + r.applicableTax, 0),
      sumTotalDemand: rows.reduce((sum, r) => sum + r.totalDemand, 0),
      stages: api.stages?.map((s) => ({
        code: s.code,
        displayName: s.displayName,
        subtitle: s.subtitle,
        percentage: s.percentage,
        isCurrent: s.isCurrent,
        isCompleted: s.isCompleted,
      })),
    },
  };
}
