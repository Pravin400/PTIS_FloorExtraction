/**
 * Grievance AI Diagnostic Analysis Types
 * Path: src/types/grievance/grievance-ai.types.ts
 *
 * Aligns with backend NtisPlatform.Application.DTOs.GrievanceAi.GrievanceAiAnalysisDto
 */

import type { ApiResponse } from '@/types/common.types';

export interface GrievanceAiAnalysisDto {
  isValidCivicIssue: boolean;
  isExplicitOrInappropriate: boolean;
  isImageUnclear: boolean;
  rejectionReason?: string | null;
  rejectionReasonLocal?: string | null;
  accuracyPercentage?: number | null;
  departmentId?: number | null;
  departmentName?: string | null;
  departmentNameLocal?: string | null;
  grievanceTypeId?: number | null;
  grievanceTypeName?: string | null;
  grievanceTypeNameLocal?: string | null;
  suggestedTitle?: string | null;
  suggestedTitleLocal?: string | null;
  suggestedDescription?: string | null;
  suggestedDescriptionLocal?: string | null;
  isDepartmentVerified: boolean;
  modelUsed?: string | null;
  scannedPhotoIds: number[];
}

export interface RefineGrievanceDescriptionRequestDto {
  rawDescription: string;
}

export type GrievanceAiAnalysisResponse = ApiResponse<GrievanceAiAnalysisDto>;
