import type {
  Priority,
  EscalationLevel,
  GrievanceCategoryFormModel,
} from '@/types/grievance-category-master/grievanceCategory.types';

export const priorities: Priority[] = ['Critical', 'High', 'Medium', 'Low'];
export const escalationLevels: EscalationLevel[] = ['Level 1', 'Level 2', 'Level 3', 'Level 4'];

export const INITIAL_FORM_STATE: GrievanceCategoryFormModel = {
  categoryCode: '',
  categoryName: '',
  departmentId: undefined,
  priority: 'Medium',
  resolutionSla: '',
  escalationLevel: 'Level 1',
  description: '',
  isActive: true,
};
