import { AssessmentYearRangeConfig } from "@/types/assessment-year-range.types";

/**
 * Configuration for Capital Value (CV) Assessment Year Range
 */
export const capitalValueConfig: AssessmentYearRangeConfig = {
  type: "CV",
  endpoint: "AssessmentYearRangeCV",
  idField: "id",
  routePath: "/property-tax/assessment-year-range/capitalvalue",
  translationNamespace: "assessmentYearRange.capitalValue",
};
