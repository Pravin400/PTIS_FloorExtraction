import { renderHook } from '@testing-library/react';
import { useDynamicTaxMasterFilters } from '@/hooks/dynamic-tax-register/master/useDynamicTaxMasterFilters';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('useDynamicTaxMasterFilters', () => {
  const routerMock = { push: vi.fn(), replace: vi.fn(), refresh: vi.fn() } as unknown as Parameters<typeof useDynamicTaxMasterFilters>[1]['router'];
  const navMock = {
    searchParams: new URLSearchParams(),
    router: routerMock,
    buildConfigUrl: vi.fn(),
  } as unknown as Parameters<typeof useDynamicTaxMasterFilters>[1];

  it('manages filter state for master mappings', () => {
    const { result } = renderHook(() =>
      useDynamicTaxMasterFilters([], navMock)
    );

    expect(result.current.mstYearId).toBe(0);
    expect(result.current.mstYearSelectOptions).toBeDefined();
  });
});
