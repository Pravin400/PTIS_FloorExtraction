'use client';

import { ConditionRuleRow, DynamicTaxRegisterRow, TaxCategoryOption, YearRangeOption } from '@/types/dynamic-tax-register.types';
import type { FieldConfig } from '@/types/rule-engine';
import type { DynamicTaxNav } from '../shared/useDynamicTaxNav';
import { useDynamicTaxConditionFields } from './useDynamicTaxConditionFields';
import { useDynamicTaxConditionRowOps } from './useDynamicTaxConditionRowOps';
import { useDynamicTaxConditionTest } from './useDynamicTaxConditionTest';
import { useDynamicTaxConditionValueLabels } from './useDynamicTaxConditionValueLabels';

export interface DynamicTaxConditionParams {
  numericId: number;
  taxRow: DynamicTaxRegisterRow | null;
  conditionRows: ConditionRuleRow[];
  conditionFields: FieldConfig[];
  conditionScopeId: number | null;
  yearRangeOptions: YearRangeOption[];
  generalRuleDefinitionId: string;
  /** Active taxes (excluding this tax), for the "Other Tax" reference picker. */
  taxOptions: TaxCategoryOption[];
  nav: DynamicTaxNav;
}

/**
 * Orchestrator for the Condition config tab — shared by the standalone Field tab and
 * Hybrid's nested Condition section (call this exactly ONCE per drawer instance; both
 * sections must consume the same returned slice, never call this hook twice, or their
 * row/pagination state would diverge — same rule as `master`).
 */
export function useDynamicTaxCondition({
  numericId,
  taxRow,
  conditionRows,
  conditionFields,
  conditionScopeId,
  yearRangeOptions,
  generalRuleDefinitionId,
  taxOptions,
  nav,
}: DynamicTaxConditionParams) {
  const fields = useDynamicTaxConditionFields(conditionFields, conditionScopeId);

  const rowOps = useDynamicTaxConditionRowOps({
    numericId,
    taxRow,
    conditionRows,
    fields: fields.fields,
    generalRuleDefinitionId,
    router: nav.router,
  });

  const test = useDynamicTaxConditionTest({
    numericId,
    rowsCount: rowOps.rows.length,
    dirty: rowOps.dirty,
  });

  const valueLabels = useDynamicTaxConditionValueLabels(fields.fields, rowOps.rows);

  return { ...fields, ...rowOps, ...test, ...valueLabels, yearRangeOptions, taxOptions };
}

export type DynamicTaxCondition = ReturnType<typeof useDynamicTaxCondition>;
