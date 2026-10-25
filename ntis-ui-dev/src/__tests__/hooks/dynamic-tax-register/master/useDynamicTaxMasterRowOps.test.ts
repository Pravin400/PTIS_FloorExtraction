import { renderHook } from '@testing-library/react';
import { useDynamicTaxMasterRowOps } from '@/hooks/dynamic-tax-register/master/useDynamicTaxMasterRowOps';

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

const emptyMasterRows: Parameters<typeof useDynamicTaxMasterRowOps>[0]['masterRows'] = [];
const emptyMasterKeyOptions: Parameters<typeof useDynamicTaxMasterRowOps>[0]['masterKeyOptionsBySource'] = { PropertyType: [], OwnerType: [], TypeOfUse: [] };

describe('useDynamicTaxMasterRowOps', () => {
  const routerMock = { push: vi.fn(), replace: vi.fn(), refresh: vi.fn() } as unknown as Parameters<typeof useDynamicTaxMasterRowOps>[0]['router'];

  it('manages master row state', () => {
    const { result } = renderHook(() =>
      useDynamicTaxMasterRowOps({
        numericId: 1,
        taxRow: null,
        yearRangeOptions: [],
        mstYearId: 0,
        mstPage: 1,
        mstPageSize: 10,
        onMstPageChange: vi.fn(),
        onMstPageSizeChange: vi.fn(),
        effectiveMstRuleId: '',
        effectiveMasterSource: null,
        mstBulkMode: 'FIXED',
        mstBulkBase: 'NONE',
        mstBulk: '0',
        setMstBulk: vi.fn(),
        masterRows: emptyMasterRows,
        masterRowsTotalCount: 0,
        masterKeyOptionsBySource: emptyMasterKeyOptions,
        loadFailed: false,
        router: routerMock,
      })
    );

    expect(result.current.mstRows).toEqual([]);
  });
});
