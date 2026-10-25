import {
  getAssessmentYearRangePaged,
  getAssessmentYearRangeById,
  createAssessmentYearRange,
  updateAssessmentYearRange,
  deleteAssessmentYearRange,
} from "@/lib/api/asset-masters/assessment-year-range.service";
import { capitalValueConfig } from "@/components/modules/assets/configuration/master-data/assessment-year-range/config";
import { AssessmentYearRange, AssessmentYearRangeFormModel } from "@/types/asset-masters/assessment-year-range.types";

export * from "@/lib/api/asset-masters/assessment-year-range.service";

/**
 * Helper wrappers for Asset Assessment Year Range (Capital Value)
 */
export async function getAssetAssessmentYearRangeCVPaged<T extends AssessmentYearRange>(
  pageNumber: number,
  pageSize: number,
  sortBy?: string,
  sortOrder?: string
) {
  return getAssessmentYearRangePaged<T>(capitalValueConfig, pageNumber, pageSize, sortBy, sortOrder);
}

export async function getAssetAssessmentYearRangeCVById<T extends AssessmentYearRange>(id: number) {
  return getAssessmentYearRangeById<T>(capitalValueConfig, id);
}

export async function createAssetAssessmentYearRangeCV(data: AssessmentYearRangeFormModel) {
  return createAssessmentYearRange(capitalValueConfig, data);
}

export async function updateAssetAssessmentYearRangeCV(data: AssessmentYearRangeFormModel) {
  return updateAssessmentYearRange(capitalValueConfig, data);
}

export async function deleteAssetAssessmentYearRangeCV(id: number) {
  return deleteAssessmentYearRange(capitalValueConfig, id);
}
