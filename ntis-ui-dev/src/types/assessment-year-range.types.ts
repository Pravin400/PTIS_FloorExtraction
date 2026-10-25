import { PagedResponse } from "./common.types";

/**
 * Assessment Year Range type discriminator
 * Used to differentiate between RV (Rateable Value) and CV (Capital Value)
 */
export type AssessmentYearRangeType = "RV" | "CV";

/**
 * Assessment Year Range entity
 * Unified structure for both RV and CV (API returns same structure with 'id' field)
 * Index signature allows compatibility with MasterTable
 */
export interface AssessmentYearRange {
  [key: string]: unknown;
  id: number;
  fromYear: number;
  toYear: number;
  isActive: boolean;
  createdDate: string;
  updatedDate: string | null;
}

/**
 * @deprecated Use AssessmentYearRange instead - API now returns unified 'id' field
 * Kept for backward compatibility
 */
export type AssessmentYearRangeRV = AssessmentYearRange;

/**
 * @deprecated Use AssessmentYearRange instead - API now returns unified 'id' field
 * Kept for backward compatibility
 */
export type AssessmentYearRangeCV = AssessmentYearRange;

/**
 * Form model for creating/editing Assessment Year Range
 * Works for both RV and CV
 */
export interface AssessmentYearRangeFormModel {
  id?: number;
  fromYear: number | string;
  toYear: number | string;
  isActive: boolean;
  updatedBy?: number;
}

/**
 * Props for Assessment Year Range Master component
 */
export interface AssessmentYearRangeMasterProps<T extends AssessmentYearRange>
  extends Omit<PagedResponse<T>, "items" | "hasPrevious" | "hasNext"> {
  data: T[];
  sortBy?: string;
  sortOrder?: string;
}

/**
 * Configuration for Assessment Year Range module
 * Defines endpoint, translations, and field mappings
 */
export interface AssessmentYearRangeConfig {
  /** Type identifier (RV or CV) */
  type: AssessmentYearRangeType;
  /** API endpoint path (without base URL) */
  endpoint: string;
  /** ID field name in the entity */
  idField: "id";
  /** Base path for routes */
  routePath: string;
  /** Translation namespace */
  translationNamespace: string;
}

/**
 * @deprecated Type guards are no longer needed as both RV and CV use same structure
 * Always returns true since all entities now have 'id' field
 */
export function isAssessmentYearRangeRV(
  entity: AssessmentYearRange
): entity is AssessmentYearRangeRV {
  return "id" in entity;
}

/**
 * @deprecated Type guards are no longer needed as both RV and CV use same structure
 * Always returns true since all entities now have 'id' field
 */
export function isAssessmentYearRangeCV(
  entity: AssessmentYearRange
): entity is AssessmentYearRangeCV {
  return "id" in entity;
}

/**
 * Get the ID from an Assessment Year Range entity
 */
export function getAssessmentYearRangeId(entity: AssessmentYearRange): number {
  return entity.id;
}

/**
 * API payload for creating Assessment Year Range
 */
export interface AssessmentYearRangeCreatePayload {
  fromYear: number;
  toYear: number;
  isActive: boolean;
  createdBy?: number;
}

/**
 * API payload for updating Assessment Year Range
 */
export interface AssessmentYearRangeUpdatePayload {
  fromYear: number;
  toYear: number;
  isActive: boolean;
  updatedBy?: number;
}
