import { renderHook } from '@testing-library/react';
import { useDynamicTaxValueRowOps } from '@/hooks/dynamic-tax-register/value/useDynamicTaxValueRowOps';

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

describe('useDynamicTaxValueRowOps', () => {
  const routerMock = { push: vi.fn(), replace: vi.fn(), refresh: vi.fn() } as unknown as Parameters<typeof useDynamicTaxValueRowOps>[0]['router'];

  it('manages value row state', () => {
    const { result } = renderHook(() =>
      useDynamicTaxValueRowOps({
        numericId: 1,
        valYearId: 0,
        valUserGroup: 'all',
        valPage: 1,
        valPageSize: 10,
        valueRows: [],
        valueRowsTotalCount: 0,
        typeOfUseOptions: [],
        valBaseType: 'RV',
        loadFailed: false,
        router: routerMock,
      })
    );

    expect(result.current.valPagedRows).toEqual([]);
    expect(result.current.dirty).toBe(false);
  });
});
