import { RuleItem } from '@/types/rule-engine';

export function assembleGlobalTestRule(
  catRules: RuleItem[],
  targetCategory: string,
  scopeId: number
): RuleItem {
  const allBlocks: (Record<string, unknown> & { ruleCategory?: string })[] = [];
  const allEngineRules: Record<string, unknown>[] = [];

  catRules.forEach((rule) => {
    try {
      if (rule.conditionsJson) {
        const parsed = JSON.parse(rule.conditionsJson);
        if (Array.isArray(parsed)) {
          parsed.forEach((b: Record<string, unknown>) => {
            b.ruleCategory = rule.ruleCategory;
          });
          allBlocks.push(...parsed);
        } else {
          allBlocks.push({ conditions: parsed, ruleCategory: rule.ruleCategory });
        }
      }
      if (rule.ruleJson) {
        const parsedJson = JSON.parse(rule.ruleJson);
        const rulesList = parsedJson.rules || parsedJson.Rules || [];
        if (Array.isArray(rulesList)) {
          allEngineRules.push(...rulesList);
        }
      }
    } catch {}
  });

  return {
    id: -1,
    ruleName: 'Global Simulation',
    ruleCode: targetCategory,
    ruleCategory: targetCategory,
    ruleScopeId: scopeId,
    isActive: true,
    conditionsJson: JSON.stringify(allBlocks),
    ruleJson: JSON.stringify({ rules: allEngineRules }),
    effectJson: '{}',
  };
}

export function formatEffectPhrase(
  eff: {
    effectType?: string;
    value?: string | number;
    isPercentage?: boolean;
    multiplierField?: string;
    overrideRate?: string | number;
  },
  paramOptions: Record<string, string>
): string {
  const typeLabel = eff.effectType || 'No action';
  const val = eff.value;
  const isPct = eff.isPercentage;
  const mult = eff.multiplierField;
  const overrideVal = eff.overrideRate;

  const paramLabel = (overrideVal !== undefined && overrideVal !== null)
    ? (paramOptions[overrideVal.toString()] || overrideVal.toString())
    : '';

  const subject = paramLabel || 'Rate';
  const typeLower = typeLabel.toLowerCase();

  let phrase = '';
  if (typeLower.includes('override') || typeLower.includes('set') || typeLower.includes('equal')) {
    phrase = `${typeLabel} ${subject} to ${val}${isPct ? '%' : ''}`;
  } else {
    phrase = `${typeLabel} ${subject} by ${val}${isPct ? '%' : ''}`;
  }

  if (mult) {
    phrase += ` based on ${mult}`;
  }
  return phrase;
}

