import React from 'react';
import { FieldConfig, ConditionState, StaticValue } from '@/types/rule-engine';
import { fetchDynamicFieldOptionsAction } from '@/app/[locale]/property-tax/rule-engine/actions';

interface UseConditionRowParams {
  condition: ConditionState;
  fields: FieldConfig[];
  onChange: (updated: ConditionState) => void;
}

export function useConditionRow({
  condition,
  fields,
  onChange,
}: UseConditionRowParams) {
  const hasValue = Array.isArray(condition.value)
    ? condition.value.length > 0
    : (condition.value !== undefined && condition.value !== null && condition.value !== '');
  const [isEditing, setIsEditing] = React.useState(!hasValue);
  const [apiOptions, setApiOptions] = React.useState<{ label: string; value: string }[]>([]);

  const currentField = React.useMemo(() => {
    return fields.find((f) => f.fieldId === condition.fieldId);
  }, [fields, condition.fieldId]);

  const fieldOptions = React.useMemo(() => {
    return fields.map((f) => ({
      label: f.fieldName || f.fieldId.replace(/([A-Z])/g, ' $1').trim().replace(/^\w/, (c) => c.toUpperCase()),
      value: f.fieldId,
    }));
  }, [fields]);

  const operatorOptions = React.useMemo(() => {
    if (!currentField || !currentField.supportedOperators) return [];
    return currentField.supportedOperators.map((op) => ({
      label: op.label,
      value: op.code,
    }));
  }, [currentField]);

  const handleFieldChange = (fieldId: string) => {
    const nextField = fields.find((f) => f.fieldId === fieldId);
    if (!nextField) return;
    const defaultOperator = nextField.supportedOperators?.[0]?.code || '=';
    const defaultValue = nextField.inputType === 'MULTISELECT' ? [] : '';
    onChange({
      ...condition,
      fieldId,
      operator: defaultOperator,
      value: defaultValue,
    });
  };

  React.useEffect(() => {
    if (!currentField || currentField.sourceType !== 'API' || !currentField.apiEndpoint) {
      Promise.resolve().then(() => {
        setApiOptions([]);
      });
      return;
    }
    let cancelled = false;
    fetchDynamicFieldOptionsAction(
      currentField.apiEndpoint,
      currentField.apiMethod ?? 'GET',
      currentField.apiParameters,
      currentField.apiResponseMapping
    ).then((opts) => {
      if (!cancelled) {
        setApiOptions(opts);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [currentField]);

  const resolveLabelForValue = React.useCallback((val: string | string[]) => {
    if (!currentField) return val;
    const valArray = Array.isArray(val) ? val : [val];
    let options: { label: string; value: string }[] = [];
    if (currentField.sourceType === 'API') {
      options = apiOptions;
    } else if (currentField.staticValuesJson) {
      try {
        options = JSON.parse(currentField.staticValuesJson);
      } catch {}
    }
    
    if (options.length > 0) {
      const labels = valArray.map((v) => {
        const vStr = String(v).toLowerCase();
        const match = options.find((item) => String(item.value).toLowerCase() === vStr);
        return match?.label || String(v);
      });
      return Array.isArray(val) ? labels : labels[0];
    }
    return val;
  }, [currentField, apiOptions]);

  const formattedValueLabel = React.useMemo(() => {
    if (condition.value === undefined || condition.value === null || condition.value === '') return 'Empty';
    if (!currentField) return String(condition.value);

    if (currentField.sourceType === 'API' && apiOptions.length > 0) {
      const valArray = Array.isArray(condition.value) ? condition.value : [condition.value];
      const labels = valArray.map((v) => {
        const vStr = String(v).toLowerCase();
        const match = apiOptions.find((item) => String(item.value).toLowerCase() === vStr);
        return match?.label || String(v);
      });
      return labels.join(', ');
    }

    if (currentField.staticValuesJson) {
      try {
        const list = JSON.parse(currentField.staticValuesJson) as StaticValue[];
        const valArray = Array.isArray(condition.value) ? condition.value : [condition.value];
        const labels = valArray.map((v) => {
          const vStr = String(v).toLowerCase();
          const match = list.find((item) => String(item.value).toLowerCase() === vStr);
          return match?.label || String(v);
        });
        return labels.join(', ');
      } catch {
        return String(condition.value);
      }
    }
    return Array.isArray(condition.value) ? condition.value.join(', ') : String(condition.value);
  }, [condition.value, currentField, apiOptions]);

  const operatorLabel = React.useMemo(() => {
    if (!currentField) return condition.operator;
    const op = currentField.supportedOperators?.find((o) => o.code === condition.operator);
    return op ? op.label : condition.operator;
  }, [currentField, condition.operator]);

  const fieldLabel = currentField?.fieldName || currentField?.fieldId
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase()) || condition.fieldId;

  return {
    isEditing,
    setIsEditing,
    fieldOptions,
    operatorOptions,
    currentField,
    handleFieldChange,
    resolveLabelForValue,
    formattedValueLabel,
    operatorLabel,
    fieldLabel,
  };
}
