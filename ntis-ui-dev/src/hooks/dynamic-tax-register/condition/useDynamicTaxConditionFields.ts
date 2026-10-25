'use client';

import { useCallback, useMemo } from 'react';
import type { FieldConfig } from '@/types/rule-engine';

/**
 * Pure derived state over the SSR-provided condition-field metadata — no client-side
 * fetching, matching how `master` receives its master-key options as a prop rather than
 * fetching them itself.
 */
export function useDynamicTaxConditionFields(fields: FieldConfig[], scopeId: number | null) {
  const fieldSelectOptions = useMemo(
    () => fields.map((f) => ({ label: f.fieldName || f.fieldId, value: f.fieldId })),
    [fields]
  );

  const getFieldConfig = useCallback(
    (fieldId: string) => fields.find((f) => f.fieldId === fieldId),
    [fields]
  );

  return { fields, fieldSelectOptions, getFieldConfig, scopeMissing: !scopeId };
}

export type DynamicTaxConditionFields = ReturnType<typeof useDynamicTaxConditionFields>;
