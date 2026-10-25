import { renderHook } from '@testing-library/react';
import { useDynamicTaxMasterAutoSeed } from '@/hooks/dynamic-tax-register/master/useDynamicTaxMasterAutoSeed';

describe('useDynamicTaxMasterAutoSeed', () => {
  it('runs auto-seed effect without throwing', () => {
    renderHook(() =>
      useDynamicTaxMasterAutoSeed({
        activeTab: 'config',
        effectiveCategory: 'DATA',
        isHybrid: false,
        ruleOptions: [],
        effectiveMstRuleId: '',
        mstYearId: 0,
        mstRows: [],
        mstBusy: false,
        loadFailed: false,
        setMstRows: vi.fn(),
        setMstSeededLocally: vi.fn(),
      } as unknown as Parameters<typeof useDynamicTaxMasterAutoSeed>[0])
    );
  });
});
