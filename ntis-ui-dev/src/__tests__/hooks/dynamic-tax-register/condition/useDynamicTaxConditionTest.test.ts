import { renderHook, act } from '@testing-library/react';
import { useDynamicTaxConditionTest } from '@/hooks/dynamic-tax-register/condition/useDynamicTaxConditionTest';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('useDynamicTaxConditionTest', () => {
  it('manages test panel state', () => {
    const { result } = renderHook(() =>
      useDynamicTaxConditionTest({
        numericId: 1,
        rowsCount: 2,
        dirty: false,
      })
    );

    expect(result.current.open).toBe(false);

    act(() => {
      result.current.handleOpen();
    });

    expect(result.current.open).toBe(true);
  });
});
