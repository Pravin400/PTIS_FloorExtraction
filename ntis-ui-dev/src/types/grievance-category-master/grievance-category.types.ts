/**
 * Grievance Category Base Types
 */

export const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'] as const;
export type Priority = (typeof PRIORITIES)[number];

export const ESCALATION_LEVELS = ['Level 1', 'Level 2', 'Level 3', 'Level 4'] as const;
export type EscalationLevel = (typeof ESCALATION_LEVELS)[number];

export type GrievanceCategory = {
  id: number;
  categoryCode: string;
  categoryName: string;
  departmentId: number;
  departmentName?: string;
  priority: Priority;
  resolutionSla: string;
  escalationLevel: EscalationLevel;
  description: string;
  isActive: boolean;
  createdDate?: string;
  updatedDate?: string;
  createdBy?: number;
  updatedBy?: number;
};

export interface GrievanceCategoryFormModel {
  id?: number;
  categoryCode: string;
  categoryName: string;
  departmentId: number | null | undefined;
  priority: Priority;
  resolutionSla: string;
  escalationLevel: EscalationLevel;
  description: string;
  isActive: boolean;
}

export interface FormTranslations {
  fields: Record<string, string>;
  errors: Record<string, string>;
  buttons: Record<string, string>;
  toast: Record<string, string>;
}

export type FormState = { success: boolean; error?: string; message?: string; fieldErrors?: Record<string, string> };
