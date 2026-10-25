import { renderHook } from '@testing-library/react';
import { useDynamicTaxValueFilters } from '@/hooks/dynamic-tax-register/value/useDynamicTaxValueFilters';

describe('useDynamicTaxValueFilters', () => {
  const routerMock = { push: vi.fn(), replace: vi.fn(), refresh: vi.fn() } as unknown as Parameters<typeof useDynamicTaxValueFilters>[2]['router'];
  const navMock = {
    searchParams: new URLSearchParams(),
    router: routerMock,
    buildConfigUrl: vi.fn(),
  } as unknown as Parameters<typeof useDynamicTaxValueFilters>[2];

  it('initializes filter options and state', () => {
    const { result } = renderHook(() =>
      useDynamicTaxValueFilters([], [], navMock)
    );

    expect(result.current.valBaseType).toBe('RV');
    expect(result.current.valUserGroup).toBe('all');
  });
});
