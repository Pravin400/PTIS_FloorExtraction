import { renderHook } from '@testing-library/react';
import { useDynamicTaxCondition } from '@/hooks/dynamic-tax-register/condition/useDynamicTaxCondition';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/components/common/ConfirmProvider', () => ({
  useConfirm: () => ({ confirm: vi.fn() }),
  ConfirmProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('@/components/common', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useConfirm: () => ({ confirm: vi.fn() }),
  };
});

describe('useDynamicTaxCondition', () => {
  const routerMock = { push: vi.fn(), replace: vi.fn(), refresh: vi.fn() } as unknown as Parameters<typeof useDynamicTaxCondition>[0]['nav']['router'];

  it('orchestrates condition tab state correctly', () => {
    const { result } = renderHook(() =>
      useDynamicTaxCondition({
        numericId: 1,
        taxRow: null,
        conditionRows: [],
        conditionFields: [],
        conditionScopeId: null,
        yearRangeOptions: [],
        generalRuleDefinitionId: '',
        taxOptions: [],
        nav: { locale: 'en', router: routerMock, handleCloseDrawer: vi.fn() } as unknown as Parameters<typeof useDynamicTaxCondition>[0]['nav'],
      })
    );

    expect(result.current.rows).toEqual([]);
    expect(result.current.scopeMissing).toBe(true);
  });
});
