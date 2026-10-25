import { renderHook } from '@testing-library/react';
import { useDynamicTaxMasterRuleSelection } from '@/hooks/dynamic-tax-register/master/useDynamicTaxMasterRuleSelection';

describe('useDynamicTaxMasterRuleSelection', () => {
  const routerMock = { push: vi.fn(), replace: vi.fn(), refresh: vi.fn() } as unknown as Parameters<typeof useDynamicTaxMasterRuleSelection>[0]['nav']['router'];
  const navMock = {
    searchParams: new URLSearchParams(),
    router: routerMock,
    buildConfigUrl: vi.fn(),
  } as unknown as Parameters<typeof useDynamicTaxMasterRuleSelection>[0]['nav'];

  it('initializes rule definition selection state', () => {
    const { result } = renderHook(() =>
      useDynamicTaxMasterRuleSelection({
        ruleOptions: [],
        masterSource: null,
        masterRowsFirstRuleId: null,
        isHybrid: false,
        generalRuleDefinitionId: '',
        handleGeneralRuleChange: vi.fn(),
        handleAutoDefaultRuleDefinition: vi.fn(),
        nav: navMock,
      })
    );

    expect(result.current.effectiveMstRuleId).toBe('');
  });
});
