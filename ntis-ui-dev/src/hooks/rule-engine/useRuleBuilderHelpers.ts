import { RuleItem, RuleBlock, ConditionGroupState, ConditionState } from '@/types/rule-engine';

/** Converts legacy verbose operator codes to the short symbols used in state. */
function normalizeOperator(op: string): string {
  switch (op) {
    case 'EQUALS':                  return '=';
    case 'NOT_EQUALS':              return '?';
    case 'GREATER_THAN':            return '>';
    case 'LESS_THAN':               return '<';
    case 'GREATER_THAN_OR_EQUALS':  return '>=';
    case 'LESS_THAN_OR_EQUALS':     return '<=';
    case 'IN':                      return 'In';
    case 'NOT_IN':                  return 'Not In';
    case 'CONTAINS_ANY':            return 'contains any';
    case 'CONTAINS_ALL':            return 'contains all';
    default:                        return op;
  }
}

/** Recursively normalizes operator codes in a condition group. */
function normalizeGroup(g: ConditionGroupState): ConditionGroupState {
  return {
    ...g,
    id: safeUUID(),
    conditions: (g.conditions || []).map((c: ConditionState) => ({
      ...c,
      id: safeUUID(),
      operator: normalizeOperator(c.operator)
    })),
    groups: (g.groups || []).map(normalizeGroup),
  };
}

/**
 * Initializes the rules list, falling back to legacy single conditions and effect format
 * if conditionsJson is not an array.
 */
export function initializeRulesList(initialRule?: RuleItem): RuleBlock[] {
  try {
    if (!initialRule?.conditionsJson) throw new Error();
    const parsed = JSON.parse(initialRule.conditionsJson);
    if (Array.isArray(parsed)) {
      return (parsed as Partial<RuleBlock>[]).map((item) => {
        const rawEffect = item.effects || item.effect;
        const effects = Array.isArray(rawEffect)
          ? rawEffect
          : rawEffect
          ? [rawEffect]
          : [{ effectType: '', value: '', isPercentage: true }];
        return {
          id: item.id || safeUUID(),
          description: item.description || '',
          conditions: normalizeGroup(item.conditions || {
            id: safeUUID(),
            logicalOperator: 'AND',
            conditions: [],
            groups: [],
          }),
          effect: effects[0],
          effects: effects,
          stopProcessing: item.stopProcessing || false,
        };
      });
    }
  } catch {}

  return [{
    id: safeUUID(),
    description: '',
    conditions: { id: safeUUID(), logicalOperator: 'AND', conditions: [], groups: [] },
    effect: { effectType: '', value: '', isPercentage: true },
    effects: [{ effectType: '', value: '', isPercentage: true }],
    stopProcessing: false,
  }];
}

/**
 * Validates the inputs of the Rule Builder.
 * Returns a string error message if validation fails, or null if validation passes.
 */
export function validateRuleBuilder(
  ruleName: string,
  ruleCategory: string,
  rulesList: RuleBlock[],
  t: (key: string, values?: Record<string, string | number | string>) => string
): string | null {
  if (!ruleName.trim()) return t('validation.ruleNameRequired');
  if (!ruleCategory) return t('validation.categoryRequired');

  for (let i = 0; i < rulesList.length; i++) {
    const block = rulesList[i];
    const effects = block.effects || (block.effect ? [block.effect] : []);
    if (effects.length === 0) {
      return `At least one effect is required for Rule Block #${i + 1}`;
    }
    for (let j = 0; j < effects.length; j++) {
      const eff = effects[j];
      const displayIndex = effects.length > 1 ? `${i + 1} (Effect #${j + 1})` : `${i + 1}`;
      if (!eff.effectType) {
        return t('validation.effectTypeRequired', { index: displayIndex });
      }
      if (
        eff.value === undefined ||
        eff.value === null ||
        eff.value.toString().trim() === ''
      ) {
        return t('validation.effectValueRequired', { index: displayIndex });
      }
      const valNum = Number(eff.value);
      if (isNaN(valNum) || valNum < 0 || valNum > 100) {
        return t('validation.effectValueRange', { index: displayIndex });
      }
    }
  }
  return null;
}

/**
 * Safely generates a random UUID in both secure (HTTPS/localhost) and insecure browser contexts.
 */
export function safeUUID(): string {
  if (typeof window !== 'undefined' && window.crypto && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Extracts rule parameter field IDs recursively from the rule conditions.
 */
export function extractRuleParameters(rule: RuleItem): string[] {
  const extracted = new Set<string>();
  try {
    const blocks = initializeRulesList(rule);
    blocks.forEach((block) => {
      if (block.conditions) {
        const extract = (g: ConditionGroupState) => {
          if (!g) return;
          if (Array.isArray(g.conditions)) {
            g.conditions.forEach((cond) => {
              if (cond && cond.fieldId) {
                extracted.add(cond.fieldId);
              }
            });
          }
          if (Array.isArray(g.groups)) {
            g.groups.forEach((subGroup) => {
              extract(subGroup);
            });
          }
        };
        extract(block.conditions);
      }

      // Extract parameter names from effects (e.g. Rent, Rate, RV, CV, Interest)
      const effects = block.effects || (block.effect ? [block.effect] : []);
      effects.forEach((eff) => {
        let code = eff.parameterCode || eff.overrideRateLabel || (eff.overrideRate !== undefined ? String(eff.overrideRate) : '');
        if (code) {
          if (code.includes('-')) code = code.split('-')[0].trim();
          else if (code.includes('(')) code = code.split('(')[0].trim();
          code = code.replace('input.', '').trim();
          if (code && !/^\d+$/.test(code)) {
            extracted.add(code);
          }
        }
      });
    });
  } catch (_e) {
    // safe fallback
  }
  return Array.from(extracted);
}

/**
 * Resolves rule-wise description lists from conditionsJson.
 */
export function getRuleWiseDescriptions(conditionsJson?: string): string[] {
  try {
    if (!conditionsJson) return [];
    const parsed = JSON.parse(conditionsJson);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => item.description).filter(Boolean);
    }
  } catch {}
  return [];
}

// Re-export label helpers from their dedicated file so existing imports remain valid
export { formatFieldName, getFieldLabel, getFriendlyOperatorLabel } from '@/components/modules/property-tax/rule-engine/field-label.helpers';

/**
 * Extracts overrideRate, overrideRateLabel, and parameterCode from a selected option value and options list.
 */
export function extractParameterMetadata(
  val: string | number | undefined,
  staticApiOptions: { label: string; value: string | number }[]
) {
  if (val === undefined || val === null || val === '') {
    return {
      overrideRate: undefined,
      overrideRateLabel: undefined,
      parameterCode: undefined,
    };
  }

  const strVal = String(val).trim();
  const selectedOpt = staticApiOptions.find(
    (o) =>
      String(o.value).trim().toLowerCase() === strVal.toLowerCase() ||
      o.label.trim().toLowerCase() === strVal.toLowerCase() ||
      o.label.split('-')[0].trim().toLowerCase() === strVal.toLowerCase() ||
      o.label.split('(')[0].trim().toLowerCase() === strVal.toLowerCase()
  );

  const labelText = selectedOpt ? selectedOpt.label : strVal;
  let code = labelText;
  if (labelText.includes('-')) {
    code = labelText.split('-')[0].trim();
  } else if (labelText.includes('(')) {
    code = labelText.split('(')[0].trim();
  }

  const num = Number(val);
  return {
    overrideRate: selectedOpt ? (typeof selectedOpt.value === 'number' ? selectedOpt.value : Number(selectedOpt.value) || selectedOpt.value) : isNaN(num) ? val : num,
    overrideRateLabel: labelText || undefined,
    parameterCode: code || labelText || undefined,
  };
}

