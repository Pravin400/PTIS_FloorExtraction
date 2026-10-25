import { renderHook } from '@testing-library/react';
import { useDynamicTaxGeneral } from '@/hooks/dynamic-tax-register/general/useDynamicTaxGeneral';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/components/common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/components/common')>();
  return {
    ...actual,
    useConfirm: () => ({ confirm: vi.fn() }),
  };
});

describe('useDynamicTaxGeneral', () => {
  const routerMock = { push: vi.fn(), replace: vi.fn(), refresh: vi.fn() } as unknown as Parameters<typeof useDynamicTaxGeneral>[3]['router'];
  const navMock = {
    isNew: true,
    numericId: 0,
    calcMode: 'CONDITION_BASED',
    effectiveCategory: 'FIELD',
    buildConfigUrl: vi.fn(),
    router: routerMock,
    routeBase: '/en/test',
  };

  it('initializes form state correctly', () => {
    const { result } = renderHook(() =>
      useDynamicTaxGeneral(null, [], [], navMock as unknown as Parameters<typeof useDynamicTaxGeneral>[3])
    );

    expect(result.current.taxName).toBe('');
    expect(result.current.taxCode).toBe('');
  });
});
