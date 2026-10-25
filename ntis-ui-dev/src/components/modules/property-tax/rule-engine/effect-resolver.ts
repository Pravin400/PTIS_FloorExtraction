import { EffectState, EffectTypeConfig } from '@/types/rule-engine';
import { fetchDynamicFieldOptionsAction } from '@/app/[locale]/property-tax/rule-engine/actions';

export async function resolveDynamicEffectParams(
  effect: EffectState,
  effectTypeConfigs: EffectTypeConfig[]
): Promise<{ resolvedValue?: string; resolvedCategory?: string }> {
  let resolvedValue: string | undefined = undefined;
  let resolvedCategory: string | undefined = undefined;

  const selectedConfig = effectTypeConfigs.find((c) => c.effectType === effect.effectType);
  if (!selectedConfig) {
    return { resolvedValue, resolvedCategory };
  }

  if (selectedConfig.staticApiEndpoint) {
    try {
      const paramsOpts = await fetchDynamicFieldOptionsAction(
        selectedConfig.staticApiEndpoint,
        selectedConfig.staticApiMethod ?? 'GET',
        selectedConfig.staticApiParamter ?? undefined,
        selectedConfig.staticApiResponseMapping ?? undefined
      );
      const found = paramsOpts.find(o => o.value === String(effect.overrideRate));
      if (found) {
        const code = found.label.split(' - ')[0].trim();
        resolvedValue = `input.${code}`;
      }
    } catch (err) {
      console.error('Failed to resolve dynamic value:', err);
    }
  }

  if (selectedConfig.apiEndpoint && effect.multiplierField) {
    try {
      const categoryOpts = await fetchDynamicFieldOptionsAction(
        selectedConfig.apiEndpoint,
        selectedConfig.apiMethod ?? 'GET',
        selectedConfig.apiParameters ?? undefined
      );
      const found = categoryOpts.find(o => o.value === String(effect.multiplierField));
      if (found) {
        resolvedCategory = found.label;
      }
    } catch (err) {
      console.error('Failed to resolve dynamic category:', err);
    }
  }

  return { resolvedValue, resolvedCategory };
}
