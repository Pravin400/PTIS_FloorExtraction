import React from 'react';
import { EffectTypeConfig } from '@/types/rule-engine';
import { fetchDynamicFieldOptionsAction } from '@/app/[locale]/property-tax/rule-engine/actions';

export function useEffectPanelOptions(selectedConfig?: EffectTypeConfig) {
  const [dynamicCategoryOptions, setDynamicCategoryOptions] = React.useState<{ label: string; value: string }[]>([]);
  const [staticApiOptions, setStaticApiOptions] = React.useState<{ label: string; value: string }[]>([]);

  React.useEffect(() => {
    if (!selectedConfig || !selectedConfig.hasApiSource || !selectedConfig.apiEndpoint) {
      Promise.resolve().then(() => {
        setDynamicCategoryOptions([]);
      });
      return;
    }

    let cancelled = false;

    const endpoint = selectedConfig.apiEndpoint;
    const method = selectedConfig.apiMethod ?? 'GET';
    const params = selectedConfig.apiParameters ?? undefined;

    fetchDynamicFieldOptionsAction(endpoint, method, params)
      .then((opts) => {
        if (!cancelled) {
          setDynamicCategoryOptions(opts);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedConfig]);

  React.useEffect(() => {
    if (!selectedConfig || !selectedConfig.staticApiEndpoint) {
      Promise.resolve().then(() => {
        setStaticApiOptions([]);
      });
      return;
    }

    let cancelled = false;

    const endpoint = selectedConfig.staticApiEndpoint;
    const method = selectedConfig.staticApiMethod ?? 'GET';
    const params = selectedConfig.staticApiParamter ?? undefined;
    const mapping = selectedConfig.staticApiResponseMapping ?? undefined;

    fetchDynamicFieldOptionsAction(endpoint, method, params, mapping)
      .then((opts) => {
        if (!cancelled) {
          setStaticApiOptions(opts);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedConfig]);

  return { dynamicCategoryOptions, staticApiOptions };
}
