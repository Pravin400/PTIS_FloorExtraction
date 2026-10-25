import { renderHook, act } from '@testing-library/react';
import { useDynamicTaxHybrid } from '@/hooks/dynamic-tax-register/hybrid/useDynamicTaxHybrid';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('useDynamicTaxHybrid', () => {
  it('manages hybrid configuration state', () => {
    const { result } = renderHook(() =>
      useDynamicTaxHybrid(1, null, false)
    );

    expect(result.current.hybEvalPriority).toBe('MASTER_THEN_CONDITION');

    act(() => {
      result.current.setHybEvalPriority('CONDITION_THEN_MASTER');
    });

    expect(result.current.hybEvalPriority).toBe('CONDITION_THEN_MASTER');
  });
});
