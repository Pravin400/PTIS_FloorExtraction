import { AssessmentYearRangeConfig } from "@/types/asset-masters/assessment-year-range.types";

/**
 * Configuration for Capital Value (CV) Assessment Year Range
 */
export const capitalValueConfig: AssessmentYearRangeConfig = {
  type: "CV",
  endpoint: "asset-management/assessment-year-range-cv",
  idField: "id",
  routePath: "/assets/configuration/master-data/assessment-year-range/capitalvalue",
  translationNamespace: "assetAssessmentYearRange.capitalValue",
};
