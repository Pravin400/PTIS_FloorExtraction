import type { SurveyorInspectionStatus } from '@/types/fire-audit';

export interface SurveyorStatusTheme {
  primary: string;
  bgSoft: string;
  label: string;
}

export const SURVEYOR_STATUS_THEMES: Record<
  SurveyorInspectionStatus,
  SurveyorStatusTheme
> = {
  overdue: { primary: '#DC2626', bgSoft: '#FEE2E2', label: 'Overdue' },
  due_today: { primary: '#EA580C', bgSoft: '#FFEDD5', label: 'Due Today' },
  assigned: { primary: '#2563EB', bgSoft: '#DBEAFE', label: 'Assigned' },
  pending: { primary: '#D97706', bgSoft: '#FEF3C7', label: 'Pending' },
  re_inspection: { primary: '#9333EA', bgSoft: '#F3E8FF', label: 'Re-Inspection' },
  completed: { primary: '#16A34A', bgSoft: '#DCFCE7', label: 'Completed' },
  in_progress: { primary: '#D97706', bgSoft: '#FEF3C7', label: 'In Progress' },
};
