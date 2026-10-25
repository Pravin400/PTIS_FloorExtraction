import type { TaxCalculationGuidelineDto } from '@/types/tax-calculation-guideline.types';

export const GROUP_KEY_MAP: Record<string, string> = {
  'General Settings': 'GENERAL',
  'GENERAL': 'GENERAL',
  'Certificate Date Priority': 'DATE_PRIORITY',
  'DATE_PRIORITY': 'DATE_PRIORITY',
  'CC & OC Rules': 'CC_OC',
  'CC_OC': 'CC_OC',
  'Tax Multipliers': 'CC_OC',
  'Electric Bill Rules': 'ELECTRIC_BILL',
  'ELECTRIC_BILL': 'ELECTRIC_BILL',
  'CC Rules': 'CC',
  'CC': 'CC',
  'OC Rules': 'OC',
  'OC': 'OC',
  'Retrospective Rules': 'RETROSPECTIVE',
  'RETROSPECTIVE': 'RETROSPECTIVE',
  'Finance Year Settings': 'GENERAL',
  'Current Year Proration': 'PRORATION',
  'PRORATION': 'PRORATION',
  'Tax Persistence': 'PERSISTENCE',
  'PERSISTENCE': 'PERSISTENCE',
  'Recalculation Triggers': 'RECALCULATE',
  'RECALCULATE': 'RECALCULATE',
  'RECALCULATION': 'RECALCULATE',
  'Policy Codes': 'PARTIAL_POLICY',
  'PARTIAL_POLICY': 'PARTIAL_POLICY',
  'Scope Settings': 'SCOPE',
  'SCOPE': 'SCOPE',
  'Validation': 'VALIDATION',
  'VALIDATION': 'VALIDATION',
};

/** Standard grid column counts for UI section groups */
export const SECTION_LAYOUT_GRID_COLS: Record<string, 2 | 3 | 4> = {
  GENERAL: 2,
  DATE_PRIORITY: 2,
  CC_OC: 4,
  CC: 3,
  OC: 3,
  ELECTRIC_BILL: 3,
  RETROSPECTIVE: 3,
  SCOPE: 2,
  VALIDATION: 2,
  PRORATION: 2,
  PARTIAL_POLICY: 4,
  PERSISTENCE: 2,
  RECALCULATE: 2,
};

export const KNOWN_SECTION_GROUPS = new Set([
  'GENERAL', 'DATE_PRIORITY', 'CC_OC', 'CC', 'OC', 'ELECTRIC_BILL',
  'RETROSPECTIVE', 'SCOPE', 'VALIDATION', 'PRORATION', 'PERSISTENCE',
  'RECALCULATE', 'RECALCULATION', 'PARTIAL_POLICY',
]);

export interface SectionDefinition {
  groupKey: string;
  titleKey: string;
  colSpanToggle?: boolean;
}

export const PRIMARY_LEFT_SECTIONS: SectionDefinition[] = [
  { groupKey: 'GENERAL', titleKey: 'sections.generalSettings' },
  { groupKey: 'CC_OC', titleKey: 'sections.ccOcRules', colSpanToggle: true },
  { groupKey: 'OC', titleKey: 'sections.ocRules' },
  { groupKey: 'RETROSPECTIVE', titleKey: 'sections.retrospectiveRules' },
];

export const PRIMARY_RIGHT_SECTIONS: SectionDefinition[] = [
  { groupKey: 'DATE_PRIORITY', titleKey: 'sections.datePriority' },
  { groupKey: 'ELECTRIC_BILL', titleKey: 'sections.electricBillRules' },
  { groupKey: 'CC', titleKey: 'sections.ccRules' },
];

export const ADVANCED_LEFT_SECTIONS: SectionDefinition[] = [
  { groupKey: 'SCOPE', titleKey: 'sections.scopeSettings' },
  { groupKey: 'VALIDATION', titleKey: 'sections.certificateValidation' },
  { groupKey: 'PRORATION', titleKey: 'sections.prorationRules' },
];

export const ADVANCED_RIGHT_SECTIONS: SectionDefinition[] = [
  { groupKey: 'PERSISTENCE', titleKey: 'sections.persistenceSettings' },
  { groupKey: 'RECALCULATE', titleKey: 'sections.recalculationSettings' },
  { groupKey: 'PARTIAL_POLICY', titleKey: 'sections.partialPolicy', colSpanToggle: true },
];

/**
 * Groups guidelines by guidelineGroup and sorts each group by displayOrder.
 */
export function groupGuidelines(guidelines: TaxCalculationGuidelineDto[] = []) {
  const groups: Record<string, TaxCalculationGuidelineDto[]> = {};

  for (const item of guidelines) {
    if (item.isActive === false || !item.guidelineCode) continue;
    const rawGroup = item.guidelineGroup;
    if (!rawGroup || rawGroup.trim() === '') continue;

    const groupKey = GROUP_KEY_MAP[rawGroup.trim()] || rawGroup.trim();
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(item);
  }

  for (const groupKey of Object.keys(groups)) {
    groups[groupKey].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }

  return groups;
}
