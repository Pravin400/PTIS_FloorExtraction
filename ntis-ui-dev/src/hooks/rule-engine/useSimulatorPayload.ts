import React from 'react';
import { RuleItem, FieldConfig, DryRunResult } from '@/types/rule-engine';
import { ApiResponse } from '@/types/common.types';
import { extractRuleParameters } from './useRuleBuilderHelpers';
import { dryRunRuleAction, fetchFieldsForScopeAction } from '@/app/[locale]/property-tax/rule-engine/actions';
import {
  collectExpressionsFromRuleJson,
  inferFieldTypes,
  coerceInputValue,
  KNOWN_CS_METHODS,
} from '@/components/modules/property-tax/rule-engine/simulatorExpressionParser';

export interface InputRow {
  id: string;
  key: string;
  value: string;
  isExtracted: boolean;
}

export function useSimulatorPayload(rule: RuleItem) {
  const [loading, setLoading]               = React.useState(false);
  const [executionResult, setExecutionResult] = React.useState<ApiResponse<unknown> | null>(null);
  const [dryRunResult, setDryRunResult]     = React.useState<DryRunResult | null>(null);
  const [fields, setFields]                 = React.useState<FieldConfig[]>([]);

  const [inputs, setInputs] = React.useState<InputRow[]>(() => {
    const extracted = extractRuleParameters(rule);
    const effectParamSet = new Set<string>();
    try {
      const parsed = JSON.parse(rule.effectJson);
      const items = Array.isArray(parsed) ? parsed : parsed ? [parsed] : [];
      items.forEach((eff: { parameterCode?: string; overrideRateLabel?: string }) => {
        let code = eff.parameterCode || eff.overrideRateLabel || '';
        if (code) {
          if (code.includes('-')) code = code.split('-')[0].trim();
          else if (code.includes('(')) code = code.split('(')[0].trim();
          code = code.replace('input.', '').trim();
          if (code && !/^\d+$/.test(code)) {
            effectParamSet.add(code.toLowerCase());
            if (!extracted.some((e) => e.toLowerCase() === code.toLowerCase())) {
              extracted.push(code);
            }
          }
        }
      });
    } catch { /* ignore */ }
    const rows = extracted.map(field => {
      return { id: `ext-${field}-${Math.random().toString(36).substring(2, 7)}`, key: field, value: '', isExtracted: true };
    });
    return rows.length === 0 ? [{ id: `custom-${Date.now()}-0`, key: '', value: '', isExtracted: false }] : rows;
  });

  const arrayFieldIds = React.useMemo<Set<string>>(() => {
    const ARRAY_OPS = new Set(['contains any', 'contains all', 'contains_any', 'contains_all']);
    const result = new Set<string>();
    try {
      interface ConditionGroup {
        conditions?: { fieldId?: string; operator?: string }[];
        groups?: ConditionGroup[];
      }
      const blocks = JSON.parse(rule.conditionsJson || '[]') as { conditions?: ConditionGroup }[];
      if (Array.isArray(blocks)) {
        const scanGroup = (g?: ConditionGroup) => {
          if (!g) return;
          (g.conditions || []).forEach((c) => {
            if (c?.fieldId && c?.operator && ARRAY_OPS.has(String(c.operator).toLowerCase()))
              result.add(c.fieldId);
          });
          (g.groups || []).forEach(scanGroup);
        };
        blocks.forEach((block) => scanGroup(block?.conditions));
      }
    } catch { /* invalid conditionsJson — ignore */ }
    return result;
  }, [rule.conditionsJson]);

  React.useEffect(() => {
    if (!rule.ruleScopeId) return;
    fetchFieldsForScopeAction(rule.ruleScopeId)
      .then((data) => {
        if (!data) return;
        setFields(data);
        if (rule.id !== -1) return;

        const extractedParams   = extractRuleParameters(rule);
        const lowercaseExtracted = extractedParams.map(p => p.toLowerCase());
        const filteredFields    = data.filter(f =>
          lowercaseExtracted.includes(f.fieldId.toLowerCase()) ||
          lowercaseExtracted.includes((f.fieldName || '').toLowerCase()) ||
          lowercaseExtracted.includes((f.databaseColumnName || '').toLowerCase()),
        );
        const rows: InputRow[] = filteredFields.map(f => ({
          id: `ext-${f.fieldId || f.databaseColumnName || Math.random().toString(36).substring(2, 7)}`,
          key: f.databaseColumnName || f.fieldId || '',
          value: '',
          isExtracted: true,
        }));
        lowercaseExtracted.forEach(param => {
          if (!rows.some(r => r.key.toLowerCase() === param)) {
            const original = extractedParams.find(p => p.toLowerCase() === param) || param;
            rows.push({ id: `ext-${param}-${Math.random().toString(36).substring(2, 7)}`, key: original, value: '', isExtracted: true });
          }
        });
        setInputs(rows);
      })
      .catch(err => console.error('Failed to fetch scope fields:', err));
  }, [rule.ruleScopeId, rule.id, rule]);

  const getFieldConfig = React.useCallback((key: string): FieldConfig | undefined =>
    fields.find(f =>
      f.fieldName?.toLowerCase()        === key.toLowerCase() ||
      f.databaseColumnName?.toLowerCase() === key.toLowerCase() ||
      f.fieldId?.toLowerCase()           === key.toLowerCase(),
    ),
  [fields]);

  const handleAddRow    = () => setInputs(prev => [...prev, { id: `custom-${Date.now()}-${prev.length}`, key: '', value: '', isExtracted: false }]);
  const handleRemoveRow = (index: number) => setInputs(prev => prev.filter((_, i) => i !== index));
  const handleRowChange = (index: number, field: 'key' | 'value', val: string) =>
    setInputs(prev => prev.map((row, i) => (i === index ? { ...row, [field]: val } : row)));

  const handleRunSimulation = async () => {
    setLoading(true);
    setExecutionResult(null);
    setDryRunResult(null);

    const expressions = collectExpressionsFromRuleJson(rule.ruleJson);
    const types       = inferFieldTypes(expressions);

    const payload: Record<string, unknown> = {};
    inputs.forEach(row => {
      const key = row.key.trim();
      if (!key) return;
      payload[key] = coerceInputValue(key, row.value, types, arrayFieldIds, getFieldConfig(key));
    });

    expressions.forEach(expr => {
      const varRx = /\b[iI]nput\.(\w+)\b/g;
      let m: RegExpExecArray | null;
      while ((m = varRx.exec(expr)) !== null) {
        const name = m[1];
        if (KNOWN_CS_METHODS.has(name) || payload[name] !== undefined) continue;
        payload[name] = types.arrayFields.has(name) || arrayFieldIds.has(name)
          ? [] : types.numericFields.has(name) ? 0 : '';
      }
    });

    try {
      if (rule.id === -1 && rule.ruleCategory === 'ALL') {
        let categories: string[] = [];
        try {
          const blocks = JSON.parse(rule.conditionsJson);
          categories = Array.from(new Set(blocks.map((b: Record<string, unknown> & { ruleCategory?: string }) => b.ruleCategory).filter(Boolean))) as string[];
        } catch { /* ignore */ }
        if (categories.length === 0) categories = ['ARV'];

        const responses = await Promise.all(categories.map(cat => dryRunRuleAction(cat, payload)));
        const merged: DryRunResult = { category: 'ALL', totalRulesLoaded: 0, totalSubRulesEvaluated: 0, matchedCount: 0, stoppedEarly: false, workflows: [] };
        let fallback: ApiResponse<unknown> | null = null;
        let hasData = false;
        responses.forEach(res => {
          const resTyped = res as ApiResponse<DryRunResult> & { success?: boolean };
          const data = resTyped && resTyped.success !== false ? (resTyped.data || resTyped as unknown as DryRunResult) : null;
          if (data) {
            hasData = true;
            merged.totalRulesLoaded       += data.totalRulesLoaded || 0;
            merged.totalSubRulesEvaluated += data.totalSubRulesEvaluated || 0;
            merged.matchedCount           += data.matchedCount || 0;
            if (data.stoppedEarly) merged.stoppedEarly = true;
            if (data.workflows) merged.workflows.push(...data.workflows);
          } else { fallback = res as ApiResponse<unknown>; }
        });
        if (hasData) {
          setDryRunResult(merged);
        } else if (fallback) {
          setExecutionResult(fallback);
        }
      } else {
        const ruleJson = rule.id === -1 ? undefined : rule.ruleJson;
        const response = await dryRunRuleAction(rule.ruleCategory || 'ALL', payload, ruleJson);
        const responseTyped = response as ApiResponse<DryRunResult> & { success?: boolean };
        const data = responseTyped && responseTyped.success !== false ? (responseTyped.data || responseTyped as unknown as DryRunResult) : null;
        if (data) {
          setDryRunResult(data);
        } else {
          setExecutionResult(response as ApiResponse<unknown>);
        }
      }
    } catch (error) {
      setExecutionResult({ success: false, error: error instanceof Error ? error.message : 'Execution failed' });
    } finally {
      setLoading(false);
    }
  };

  return {
    loading, executionResult, dryRunResult,
    inputs, arrayFieldIds,
    handleAddRow, handleRemoveRow, handleRowChange,
    handleRunSimulation, getFieldConfig,
  };
}
