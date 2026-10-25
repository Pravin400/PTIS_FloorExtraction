import { renderHook } from '@testing-library/react';
import { useDynamicTaxConditionFields } from '@/hooks/dynamic-tax-register/condition/useDynamicTaxConditionFields';

describe('useDynamicTaxConditionFields', () => {
  it('provides fields and scopeMissing status', () => {
    const fields = [
      { id: 1, fieldId: 'f1', fieldName: 'Field 1', ruleDefinitionId: 10 } as unknown as Parameters<typeof useDynamicTaxConditionFields>[0][number],
      { id: 2, fieldId: 'f2', fieldName: 'Field 2', ruleDefinitionId: 20 } as unknown as Parameters<typeof useDynamicTaxConditionFields>[0][number],
    ];
    const { result } = renderHook(() => useDynamicTaxConditionFields(fields, 10));
    expect(result.current.fields).toHaveLength(2);
    expect(result.current.scopeMissing).toBe(false);
  });

  it('returns empty array when scope missing', () => {
    const { result } = renderHook(() => useDynamicTaxConditionFields([], null));
    expect(result.current.scopeMissing).toBe(true);
  });
});
