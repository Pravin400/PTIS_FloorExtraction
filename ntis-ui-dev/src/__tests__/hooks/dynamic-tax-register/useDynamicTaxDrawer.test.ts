import { renderHook } from '@testing-library/react';
import { useDynamicTaxDrawer } from '@/hooks/dynamic-tax-register/useDynamicTaxDrawer';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/en/property-tax/dynamic-tax-register',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ locale: 'en' }),
}));

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

describe('useDynamicTaxDrawer', () => {
  it('orchestrates drawer tabs state', () => {
    const { result } = renderHook(() =>
      useDynamicTaxDrawer({
        id: '1',
        initialTab: 'general',
        taxRow: null,
        ruleOptions: [],
        yearRangeOptions: [],
        valueRows: [],
        valueRowsTotalCount: 0,
        masterRows: [],
        masterRowsTotalCount: 0,
        hybridConfig: null,
        masterSource: null,
        typeOfUseOptions: [],
        masterKeyOptionsBySource: { PropertyType: [], OwnerType: [], TypeOfUse: [] },
        conditionRows: [],
        conditionFields: [],
        conditionScopeId: null,
        taxCategoryOptions: [],
        referenceTaxOptions: [],
        valueLoadFailed: false,
        masterLoadFailed: false,
        hybridLoadFailed: false,
      })
    );

    expect(result.current.nav.locale).toBe('en');
  });
});
