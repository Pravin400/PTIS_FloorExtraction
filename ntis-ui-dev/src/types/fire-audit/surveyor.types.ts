/**
 * Fire Audit Surveyor Domain Contracts
 * Path: src/types/fire-audit/surveyor.types.ts
 *
 * Strongly-typed domain interfaces for municipal fire inspections,
 * KPI counts, and occupancy categories.
 */

export type SurveyorInspectionStatus =
  | 'assigned'
  | 'pending'
  | 'overdue'
  | 'due_today'
  | 'in_progress'
  | 'completed'
  | 're_inspection';

export type SurveyorBuildingType =
  | 'Industrial'
  | 'Residential'
  | 'Commercial'
  | 'Healthcare'
  | 'Assembly';

export interface SurveyorInspectionItem {
  id: string;
  inspectionNo: string;
  applicationNo: string;
  premisesName: string;
  address: string;
  buildingType: SurveyorBuildingType;
  occupancyCode: string;
  status: SurveyorInspectionStatus;
  scheduledDate: string;
  scheduledTimeSlot: string;
  countdownText: string;
  contactPersonName: string;
  contactPersonPhone: string;
  contactDesignation?: string;
  inspectionCycle: number;
  latitude: number;
  longitude: number;
  thumbnailUrl?: string;
}

export interface SurveyKpiCounts {
  assigned?: number;
  dueToday?: number;
  overdue?: number;
  pending?: number;
  reInspection?: number;
  completed?: number;
}
