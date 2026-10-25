import { AssessmentYearRangeConfig } from "@/types/assessment-year-range.types";

/**
 * Configuration for Rateable Value (RV) Assessment Year Range
 */
export const rateableValueConfig: AssessmentYearRangeConfig = {
  type: "RV",
  endpoint: "AssessmentYearRange",
  idField: "id",
  routePath: "/property-tax/assessment-year-range/rateablevalue",
  translationNamespace: "assessmentYearRange.rateableValue",
};
