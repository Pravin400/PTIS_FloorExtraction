import type {
  Priority,
  EscalationLevel,
} from '@/types/grievance-category-master/grievanceCategory.types';

export const PRIORITY_TRANSLATION_KEYS: Record<Priority, string> = {
  Low: 'low',
  Medium: 'medium',
  High: 'high',
  Critical: 'critical',
};

export const ESCALATION_TRANSLATION_KEYS: Record<EscalationLevel, string> = {
  'Level 1': 'level1',
  'Level 2': 'level2',
  'Level 3': 'level3',
  'Level 4': 'level4',
};

export function getPriorityStyles(priority: string): string {
  switch (priority) {
    case 'Critical':
      return 'bg-rose-50 text-rose-700 border-rose-200/50 shadow-xs shadow-rose-500/5';
    case 'High':
      return 'bg-orange-50 text-orange-700 border-orange-200/50 shadow-xs shadow-orange-500/5';
    case 'Medium':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200/50 shadow-xs shadow-indigo-500/5';
    case 'Low':
      return 'bg-slate-50 text-slate-600 border-slate-200 shadow-xs';
    default:
      return 'bg-slate-50 text-slate-600 border-slate-200';
  }
}

export function getLocalizedPriorityLabel(
  priority: string,
  tPriorityOptions: (key: string) => string
): string {
  const translationKey = PRIORITY_TRANSLATION_KEYS[priority as Priority];
  return translationKey ? tPriorityOptions(translationKey) : priority;
}

export function getLocalizedEscalationLabel(
  escalationLevel: string,
  tEscalationOptions: (key: string) => string
): string {
  const translationKey = ESCALATION_TRANSLATION_KEYS[escalationLevel as EscalationLevel];
  return translationKey ? tEscalationOptions(translationKey) : escalationLevel;
}
