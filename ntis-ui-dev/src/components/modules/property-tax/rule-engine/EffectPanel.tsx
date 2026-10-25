'use client';
import React from 'react';

import { EffectState, EffectTypeConfig, FieldConfig } from '@/types/rule-engine';
import { Input, SearchSelect } from '@/components/common';
import { adaptEffectConfigToFieldConfig } from '@/lib/api/rule-engine/mappers';
import ValueInput from './ValueInput';
import { useEffectPanelOptions } from '@/hooks/rule-engine/useEffectPanelOptions';
import { useTranslations } from 'next-intl';
import { extractParameterMetadata } from '@/hooks/rule-engine/useRuleBuilderHelpers';
import StopProcessingToggle from './StopProcessingToggle';

interface EffectPanelProps {
  effect: EffectState;
  onChange: (updated: EffectState) => void;
  effectTypes: { label: string; value: string }[];
  categoryOptions: { label: string; value: string }[];
  effectTypeConfigs: EffectTypeConfig[];
  stopProcessing?: boolean;
  onStopProcessingChange?: (checked: boolean) => void;
}

export default function EffectPanel({
  effect,
  onChange,
  effectTypes,
  categoryOptions,
  effectTypeConfigs,
  stopProcessing,
  onStopProcessingChange,
}: EffectPanelProps) {
  const selectedConfig = effectTypeConfigs.find((c) => c.effectType === effect.effectType);
  const { dynamicCategoryOptions, staticApiOptions } = useEffectPanelOptions(selectedConfig);
  const t = useTranslations('ruleEngine');

  // Backfill missing overrideRateLabel and parameterCode once staticApiOptions load
  React.useEffect(() => {
    if (effect.overrideRate !== undefined && effect.overrideRate !== null && !effect.overrideRateLabel && staticApiOptions.length > 0) {
      const meta = extractParameterMetadata(effect.overrideRate, staticApiOptions);
      if (meta.overrideRateLabel) {
        onChange({
          ...effect,
          ...meta,
        });
      }
    }
  }, [effect, onChange, staticApiOptions]);


  const options = [
    { label: t('effectPanel.selectCategory'), value: '' },
    ...(dynamicCategoryOptions.length > 0 ? dynamicCategoryOptions : categoryOptions),
  ];

  const handleTypeChange = (type: string) => {
    onChange({
      ...effect,
      effectType: type,
      isPercentage: true,
      value: 0,
      multiplierField: undefined,
    });
  };

  const fieldConfig: FieldConfig = selectedConfig
    ? { ...adaptEffectConfigToFieldConfig(selectedConfig), numericMin: 0, numericMax: 100 }
    : {
        id: 0,
        fieldId: 'value',
        dataType: 'DECIMAL',
        inputType: 'TEXTBOX',
        sourceType: 'NONE',
        isRequired: true,
        numericMin: 0,
        numericMax: 100,
      };

  const handleValueChange = (newVal: string | string[]) => {
    const scalar = Array.isArray(newVal) ? newVal[0] : newVal;
    const num = Number(scalar);
    if (!isNaN(num) && num > 100) {
      onChange({
        ...effect,
        value: 100,
      });
      return;
    }
    if (!isNaN(num) && num < 0) {
      onChange({
        ...effect,
        value: 0,
      });
      return;
    }
    onChange({
      ...effect,
      value: isNaN(num) || scalar.trim() === '' ? scalar : num,
    });
  };

  const valNum = Number(effect.value);
  const isInvalidPercent = effect.value !== undefined && effect.value !== null && effect.value !== '' && (isNaN(valNum) || valNum < 0 || valNum > 100);

  const hasReferenceCategory = !!(selectedConfig && selectedConfig.hasApiSource && selectedConfig.apiEndpoint);
  const hasParameter = !!(selectedConfig && selectedConfig.staticApiEndpoint);

  return (
    <div className="flex flex-col gap-2.5 w-full">
      {/* Visual Dashed Divider: --- Perform the following action --- */}
      <div className="relative flex py-0.5 items-center">
        <div className="flex-grow border-t border-dashed border-zinc-300"></div>
        <span className="flex-shrink mx-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          {t('effectPanel.performAction')}
        </span>
        <div className="flex-grow border-t border-dashed border-zinc-300"></div>
      </div>

      <div className="flex flex-col lg:flex-row items-stretch lg:items-end gap-3 w-full">
        {/* 1. Effect Type selection */}
        <div className="w-full flex-1">
          <SearchSelect
            label={t('effectPanel.effectType')}
            options={effectTypes}
            value={effect.effectType}
            onChange={(_, val) => handleTypeChange(val)}
            placeholder={t('effectPanel.selectEffectType')}
            required
          />
        </div>

        {/* 2. Reference Category selection (shown when config has apiEndpoint) */}
        {hasReferenceCategory && (
          <div className="w-full flex-1">
            <SearchSelect
              label={t('effectPanel.referenceCategory')}
              options={options}
              value={effect.multiplierField ?? ''}
              onChange={(_, val) => onChange({ ...effect, multiplierField: val })}
              required
            />
          </div>
        )}

        {/* 3. Parameter selection (shown when config has staticApiEndpoint) */}
        {hasParameter && (
          <div className="w-full flex-1">
            <SearchSelect
              label={t('effectPanel.parameter')}
              options={staticApiOptions}
              value={effect.overrideRate === undefined || effect.overrideRate === null ? '' : effect.overrideRate.toString()}
              onChange={(_, val) => {
                const meta = extractParameterMetadata(val, staticApiOptions);
                onChange({
                  ...effect,
                  ...meta,
                });
              }}
              required
            />
          </div>
        )}

        {/* 4. Value / Dynamic Value Input */}
        <div className="w-full flex-1">
          <div className="flex flex-col gap-1 w-full">
            <label className="text-[13px] font-semibold text-zinc-600 whitespace-nowrap">
              {t('effectPanel.percentageValue')}
            </label>
            <div className="w-full">
              {hasParameter ? (
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={effect.value === undefined || effect.value === null || effect.value === '' ? '' : effect.value.toString()}
                  onChange={(e) => handleValueChange(e.target.value)}
                  placeholder={t('effectPanel.enterValue')}
                  error={isInvalidPercent ? t('effectPanel.invalidPercentage') : undefined}
                />
              ) : (
                <ValueInput
                  config={fieldConfig}
                  value={effect.value === undefined || effect.value === null || effect.value === '' ? '' : effect.value.toString()}
                  onChange={handleValueChange}
                  error={isInvalidPercent ? t('effectPanel.invalidPercentage') : undefined}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Stop Processing Toggle */}
      {onStopProcessingChange && (
        <StopProcessingToggle
          stopProcessing={stopProcessing}
          onStopProcessingChange={onStopProcessingChange}
        />
      )}
    </div>
  );
}
