import { renderHook } from '@testing-library/react';
import { useDynamicTaxMaster } from '@/hooks/dynamic-tax-register/master/useDynamicTaxMaster';

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

describe('useDynamicTaxMaster', () => {
  const routerMock = { push: vi.fn(), replace: vi.fn(), refresh: vi.fn() } as unknown as Parameters<typeof useDynamicTaxMaster>[0]['nav']['router'];
  const navMock = {
    searchParams: new URLSearchParams(),
    router: routerMock,
    buildConfigUrl: vi.fn(),
    activeTab: 'config',
  } as unknown as Parameters<typeof useDynamicTaxMaster>[0]['nav'];

  it('orchestrates master tab state', () => {
    const { result } = renderHook(() =>
      useDynamicTaxMaster({
        numericId: 1,
        taxRow: null,
        ruleOptions: [],
        yearRangeOptions: [],
        masterRows: [],
        masterRowsTotalCount: 0,
        masterSource: null,
        isHybrid: false,
        effectiveCategory: 'DATA',
        generalRuleDefinitionId: '',
        handleGeneralRuleChange: vi.fn(),
        handleAutoDefaultRuleDefinition: vi.fn(),
        masterKeyOptionsBySource: { PropertyType: [], OwnerType: [], TypeOfUse: [] },
        loadFailed: false,
        nav: navMock,
      })
    );

    expect(result.current.mstRows).toEqual([]);
  });
});
