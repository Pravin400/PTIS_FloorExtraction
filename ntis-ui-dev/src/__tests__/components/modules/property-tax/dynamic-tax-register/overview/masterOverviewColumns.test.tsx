import { getMasterOverviewColumns } from '@/components/modules/property-tax/dynamic-tax-register/overview/masterOverviewColumns';

describe('getMasterOverviewColumns', () => {
  const mockT = vi.fn((key: string) => key);

  it('returns expected columns', () => {
    const columns = getMasterOverviewColumns(mockT);
    expect(columns).toHaveLength(5);
    expect(columns.map((c) => c.key)).toEqual([
      'taxName',
      'masterName',
      'displayValue',
      'yearRangeLabel',
      'resultValue',
    ]);
  });
});
