'use client';

import React from 'react';
import { FieldConfig, StaticValue } from '@/types/rule-engine';
import { Input, Checkbox } from '@/components/common';
import { fetchDynamicFieldOptionsAction } from '@/app/[locale]/property-tax/rule-engine/actions';
import DropdownValueInput from './DropdownValueInput';
import MultiSelectValueInput from './MultiSelectValueInput';
import RadioValueInput from './RadioValueInput';

interface ValueInputProps {
  config: FieldConfig;
  operator?: string;
  value: string | string[];
  onChange: (val: string | string[]) => void;
  error?: string;
  disabled?: boolean;
}

export default function ValueInput({
  config,
  operator,
  value,
  onChange,
  error,
  disabled = false,
}: ValueInputProps) {
  const [apiOptions, setApiOptions] = React.useState<{ label: string; value: string }[]>([]);
  const [apiLoading, setApiLoading] = React.useState(false);

  React.useEffect(() => {
    if (config.sourceType !== 'API' || !config.apiEndpoint) return;
    let cancelled = false;
    Promise.resolve().then(() => {
      setApiLoading(true);
    });
    fetchDynamicFieldOptionsAction(
      config.apiEndpoint,
      config.apiMethod ?? 'GET',
      config.apiParameters,
      config.apiResponseMapping
    ).then((opts) => {
      if (!cancelled) {
        setApiOptions(opts);
        setApiLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [config.apiEndpoint, config.apiMethod, config.apiParameters, config.apiResponseMapping, config.sourceType]);

  const staticOptions = React.useMemo<StaticValue[]>(() => {
    if (!config.staticValuesJson) return [];
    try {
      return JSON.parse(config.staticValuesJson) as StaticValue[];
    } catch {
      return [];
    }
  }, [config.staticValuesJson]);

  const effectiveOptions = React.useMemo(() => {
    const base =
      config.sourceType === 'API'
         ? apiOptions
         : staticOptions.map((o) => ({ label: o.label, value: String(o.value) }));
    const merged = config.supportsNA ? [{ label: 'Not Applicable (N/A)', value: 'NA' }, ...base] : base;
    
    // Deduplicate options by value to prevent React key warning issues
    const seen = new Set<string>();
    return merged
      .filter((opt) => {
        const valStr = String(opt.value);
        if (seen.has(valStr.toLowerCase())) return false;
        seen.add(valStr.toLowerCase());
        return true;
      })
      .map((opt) => ({ label: opt.label, value: String(opt.value) }));
  }, [config.sourceType, config.supportsNA, apiOptions, staticOptions]);

  // Auto-select all options when operator is 'contains all'
  React.useEffect(() => {
    if (operator === 'contains all' && effectiveOptions.length > 0) {
      const allVals = effectiveOptions.map((o) => o.value);
      const currentVals = Array.isArray(value) ? value : [value];
      if (
        currentVals.length !== allVals.length ||
        !currentVals.every((v) => allVals.includes(v))
      ) {
        onChange(allVals);
      }
    }
  }, [operator, effectiveOptions, value, onChange]);

  const loadingPlaceholder = apiLoading ? 'Loading options…' : (config.placeholder ?? 'Select…');
  const activeScalar = Array.isArray(value)
    ? (value[0] !== undefined && value[0] !== null ? String(value[0]) : '')
    : (value !== undefined && value !== null ? String(value) : '');

  const isMultiSelectOp = operator && ['In', 'Not In', 'contains any', 'contains all'].includes(operator);
  const resolvedInputType = isMultiSelectOp || config.inputType === 'MULTISELECT' ? 'MULTISELECT' : config.inputType;
  const isFieldDisabled = disabled || operator === 'contains all';

  switch (resolvedInputType) {
    case 'DROPDOWN':
      return (
        <DropdownValueInput
          config={config}
          value={activeScalar}
          onChange={onChange}
          disabled={isFieldDisabled}
          apiLoading={apiLoading}
          effectiveOptions={effectiveOptions}
          loadingPlaceholder={loadingPlaceholder}
          error={error}
        />
      );

    case 'MULTISELECT':
      return (
        <MultiSelectValueInput
          config={config}
          value={value}
          onChange={onChange}
          disabled={isFieldDisabled}
          apiLoading={apiLoading}
          effectiveOptions={effectiveOptions}
          loadingPlaceholder={loadingPlaceholder}
          error={error}
        />
      );

    case 'RADIO':
      return (
        <RadioValueInput
          config={config}
          value={activeScalar}
          onChange={onChange}
          disabled={isFieldDisabled}
          apiLoading={apiLoading}
          effectiveOptions={effectiveOptions}
          error={error}
        />
      );

    case 'CHECKBOX': {
      const isChecked = value === 'true';
      return (
        <div className="flex flex-col gap-1 py-1">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={isChecked}
              onCheckedChange={(checked) => onChange(checked ? 'true' : 'false')}
              disabled={isFieldDisabled}
              id={`checkbox-${config.fieldId}`}
              label={config.placeholder ?? config.fieldId}
            />
          </div>
          {error && <span className="text-xs text-red-500 font-medium">{error}</span>}
        </div>
      );
    }

    case 'DATEPICKER':
      return (
        <Input
          type="date"
          value={activeScalar}
          onChange={(e) => onChange(e.target.value)}
          disabled={isFieldDisabled}
          error={error}
        />
      );

    case 'TEXTBOX':
    default: {
      const isNumeric = config.dataType === 'INTEGER' || config.dataType === 'DECIMAL';
      return (
        <Input
          type={isNumeric ? 'number' : 'text'}
          value={activeScalar}
          onChange={(e) => onChange(e.target.value)}
          placeholder={config.placeholder ?? config.fieldId}
          disabled={isFieldDisabled}
          error={error}
          min={config.numericMin}
          max={config.numericMax}
        />
      );
    }
  }
}
