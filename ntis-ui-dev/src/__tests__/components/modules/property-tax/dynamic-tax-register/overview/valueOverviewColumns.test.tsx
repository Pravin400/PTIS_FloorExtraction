import { getValueOverviewColumns } from '@/components/modules/property-tax/dynamic-tax-register/overview/valueOverviewColumns';
import type { OverviewTax } from '@/types/dynamic-tax-register.types';

describe('getValueOverviewColumns', () => {
  const mockT = vi.fn((key: string) => key);
  const taxes: OverviewTax[] = [
    { taxId: 1, taxName: 'Tax 1', taxCode: 'T1' },
    { taxId: 2, taxName: 'Tax 2', taxCode: 'T2' },
  ];

  it('combines fixed columns and tax columns', () => {
    const columns = getValueOverviewColumns(mockT, taxes);
    expect(columns).toHaveLength(5); // 3 fixed + 2 taxes
    expect(columns.map((c) => c.key)).toEqual([
      'typeOfUseCode',
      'type',
      'yearRangeLabel',
      'tax_1',
      'tax_2',
    ]);
  });
});
