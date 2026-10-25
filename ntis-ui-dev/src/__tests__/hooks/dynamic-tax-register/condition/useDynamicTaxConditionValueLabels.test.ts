import { renderHook } from '@testing-library/react';
import { useDynamicTaxConditionValueLabels } from '@/hooks/dynamic-tax-register/condition/useDynamicTaxConditionValueLabels';

vi.mock('@/app/[locale]/property-tax/dynamic-tax-register/action', () => ({
  fetchDynamicConditionFieldOptionsAction: vi.fn(() => Promise.resolve([{ label: 'Label 1', value: 'v1' }])),
}));

describe('useDynamicTaxConditionValueLabels', () => {
  it('initializes and provides resolveApiValueLabel function', () => {
    const { result } = renderHook(() => useDynamicTaxConditionValueLabels([], []));
    expect(typeof result.current.resolveApiValueLabel).toBe('function');
  });
});
