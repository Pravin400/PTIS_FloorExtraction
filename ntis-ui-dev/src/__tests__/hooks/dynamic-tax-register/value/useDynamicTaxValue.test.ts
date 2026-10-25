import { renderHook } from '@testing-library/react';
import { useDynamicTaxValue } from '@/hooks/dynamic-tax-register/value/useDynamicTaxValue';

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

describe('useDynamicTaxValue', () => {
  const routerMock = { push: vi.fn(), replace: vi.fn(), refresh: vi.fn() } as unknown as Parameters<typeof useDynamicTaxValue>[0]['nav']['router'];
  const navMock = {
    searchParams: new URLSearchParams(),
    router: routerMock,
    buildConfigUrl: vi.fn(),
  } as unknown as Parameters<typeof useDynamicTaxValue>[0]['nav'];

  it('orchestrates value tab state', () => {
    const { result } = renderHook(() =>
      useDynamicTaxValue({
        numericId: 1,
        yearRangeOptions: [],
        valueRows: [],
        valueRowsTotalCount: 0,
        typeOfUseOptions: [],
        loadFailed: false,
        nav: navMock,
      })
    );

    expect(result.current.valPagedRows).toEqual([]);
  });
});
